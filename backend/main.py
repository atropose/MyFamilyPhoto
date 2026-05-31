import asyncio
import json
import mimetypes
import os
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Optional

import aiosqlite
from fastapi import (
    BackgroundTasks, Cookie, Depends, FastAPI, File, Form,
    HTTPException, Query, Request, Response, UploadFile, status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from sse_starlette.sse import EventSourceResponse

from auth import create_session, delete_session, get_passcode, require_auth, validate_session
from database import DB_PATH, get_db, init_db
from scanner import run_ai_reanalyze, run_scan, scan_state, subscribe_scan_events, unsubscribe_scan_events
from thumbnails import THUMBNAIL_DIR, ensure_thumbnail_dir

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    ensure_thumbnail_dir()
    yield


app = FastAPI(title="MyPicManager API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/api/auth/login")
async def login(request: Request, response: Response):
    body = await request.json()
    passcode = body.get("passcode", "")
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        correct = await get_passcode(db)
    if passcode != correct:
        raise HTTPException(status_code=401, detail="Wrong passcode")
    token = create_session()
    response.set_cookie(
        "session", token,
        httponly=True, samesite="lax",
        max_age=30 * 24 * 3600,
    )
    return {"ok": True}


@app.post("/api/auth/logout")
async def logout(response: Response, session: Optional[str] = Cookie(default=None)):
    if session:
        delete_session(session)
    response.delete_cookie("session")
    return {"ok": True}


@app.get("/api/auth/status")
async def auth_status(session: Optional[str] = Cookie(default=None)):
    return {"authenticated": bool(session and validate_session(session))}


# ── Settings ──────────────────────────────────────────────────────────────────

@app.get("/api/settings")
async def get_settings(_: str = Depends(require_auth)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT key, value FROM app_settings") as cur:
            rows = await cur.fetchall()
    settings = {r["key"]: r["value"] for r in rows}
    settings.pop("passcode", None)
    return settings


@app.put("/api/settings")
async def update_settings(request: Request, _: str = Depends(require_auth)):
    body = await request.json()
    async with aiosqlite.connect(DB_PATH) as db:
        for key, value in body.items():
            await db.execute(
                "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
                (key, str(value)),
            )
        await db.commit()
    return {"ok": True}


@app.put("/api/settings/passcode")
async def update_passcode(request: Request, _: str = Depends(require_auth)):
    body = await request.json()
    new_pc = body.get("passcode", "")
    if len(new_pc) < 4:
        raise HTTPException(400, "Passcode must be at least 4 characters")
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('passcode', ?)",
            (new_pc,),
        )
        await db.commit()
    return {"ok": True}


# ── Media ─────────────────────────────────────────────────────────────────────

def _media_row_to_dict(row) -> dict:
    d = dict(row)
    if d.get("taken_at"):
        try:
            d["taken_at"] = datetime.fromisoformat(d["taken_at"]).isoformat()
        except ValueError:
            pass
    return d


@app.get("/api/media")
async def list_media(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    location: Optional[str] = None,
    member: Optional[str] = None,
    media_type: Optional[str] = None,
    show_hidden: bool = False,
    _: str = Depends(require_auth),
):
    conditions = []
    params: list = []

    if not show_hidden:
        conditions.append("is_hidden = 0")

    if start_date:
        conditions.append("taken_at >= ?")
        params.append(start_date)

    if end_date:
        conditions.append("taken_at <= ?")
        params.append(end_date + "T23:59:59")

    if location:
        conditions.append("address LIKE ?")
        params.append(f"%{location}%")

    if member and member != "all":
        if "/" in member:
            fm, sf = member.split("/", 1)
            conditions.append("family_member = ?")
            params.append(fm)
            conditions.append("sub_folder = ?")
            params.append(sf)
        else:
            conditions.append("family_member = ?")
            params.append(member)

    if media_type and media_type in ("photo", "video"):
        conditions.append("media_type = ?")
        params.append(media_type)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    offset = (page - 1) * page_size

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(f"SELECT COUNT(*) FROM media_files {where}", params) as cur:
            total = (await cur.fetchone())[0]
        async with db.execute(
            f"SELECT * FROM media_files {where} ORDER BY taken_at DESC LIMIT ? OFFSET ?",
            params + [page_size, offset],
        ) as cur:
            rows = await cur.fetchall()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [_media_row_to_dict(r) for r in rows],
    }


@app.get("/api/media/{media_id}")
async def get_media(media_id: int, _: str = Depends(require_auth)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM media_files WHERE id = ?", (media_id,)) as cur:
            row = await cur.fetchone()
    if not row:
        raise HTTPException(404, "Not found")
    return _media_row_to_dict(row)


@app.get("/api/media/{media_id}/thumbnail")
async def serve_thumbnail(media_id: int, _: str = Depends(require_auth)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT thumbnail_path FROM media_files WHERE id = ?", (media_id,)
        ) as cur:
            row = await cur.fetchone()
    if not row or not row["thumbnail_path"] or not os.path.exists(row["thumbnail_path"]):
        raise HTTPException(404, "Thumbnail not found")
    return FileResponse(row["thumbnail_path"], media_type="image/jpeg")


@app.get("/api/media/{media_id}/file")
async def serve_file(media_id: int, _: str = Depends(require_auth)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT file_path, filename, media_type FROM media_files WHERE id = ?", (media_id,)
        ) as cur:
            row = await cur.fetchone()
    if not row or not os.path.exists(row["file_path"]):
        raise HTTPException(404, "File not found")
    mime = mimetypes.guess_type(row["file_path"])[0] or "application/octet-stream"
    return FileResponse(
        row["file_path"],
        media_type=mime,
        filename=row["filename"],
    )


@app.get("/api/media/{media_id}/stream")
async def stream_video(media_id: int, request: Request, _: str = Depends(require_auth)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT file_path, media_type FROM media_files WHERE id = ?", (media_id,)
        ) as cur:
            row = await cur.fetchone()
    if not row or row["media_type"] != "video" or not os.path.exists(row["file_path"]):
        raise HTTPException(404, "Video not found")

    file_path = row["file_path"]
    file_size = os.path.getsize(file_path)
    mime = mimetypes.guess_type(file_path)[0] or "video/mp4"

    range_header = request.headers.get("range")
    if range_header:
        start_str, end_str = range_header.replace("bytes=", "").split("-")
        start = int(start_str)
        end = int(end_str) if end_str else min(start + 1024 * 1024, file_size - 1)
        chunk_size = end - start + 1

        def iter_file():
            with open(file_path, "rb") as f:
                f.seek(start)
                remaining = chunk_size
                while remaining > 0:
                    data = f.read(min(65536, remaining))
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        return StreamingResponse(
            iter_file(),
            status_code=206,
            media_type=mime,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(chunk_size),
            },
        )

    return FileResponse(file_path, media_type=mime)


@app.patch("/api/media/{media_id}/hide")
async def toggle_hide(media_id: int, request: Request, _: str = Depends(require_auth)):
    body = await request.json()
    is_hidden = bool(body.get("is_hidden", True))
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE media_files SET is_hidden = ? WHERE id = ?",
            (1 if is_hidden else 0, media_id),
        )
        await db.commit()
    return {"ok": True, "is_hidden": is_hidden}


@app.patch("/api/media/{media_id}/review")
async def mark_reviewed(media_id: int, _: str = Depends(require_auth)):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE media_files SET ai_reviewed = 1 WHERE id = ?", (media_id,)
        )
        await db.commit()
    return {"ok": True}


# ── Family Members ─────────────────────────────────────────────────────────────

@app.get("/api/members")
async def list_members(_: str = Depends(require_auth)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            """
            SELECT family_member, sub_folder
            FROM media_files
            WHERE family_member IS NOT NULL
            GROUP BY family_member, sub_folder
            ORDER BY family_member, sub_folder
            """
        ) as cur:
            rows = await cur.fetchall()

    folders: dict = {}
    for row in rows:
        fm = row["family_member"]
        sf = row["sub_folder"]
        if fm not in folders:
            folders[fm] = {"id": fm, "name": fm, "children": []}
        if sf:
            folders[fm]["children"].append({"id": f"{fm}/{sf}", "name": sf, "children": []})

    return {"members": list(folders.values())}


# ── Scan ──────────────────────────────────────────────────────────────────────

@app.get("/api/scan/status")
async def scan_status(_: str = Depends(require_auth)):
    return scan_state


@app.post("/api/scan/full")
async def start_full_scan(
    background_tasks: BackgroundTasks,
    _: str = Depends(require_auth),
):
    if scan_state["running"]:
        raise HTTPException(409, "Scan already running")
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT key, value FROM app_settings WHERE key IN ('root_media_path', 'ai_service_url')") as cur:
            settings = {r["key"]: r["value"] async for r in cur}

    root = settings.get("root_media_path", "/media/family")
    ai_url = settings.get("ai_service_url")

    async def do_scan():
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            await run_scan(root, db, mode="full", ai_service_url=ai_url)

    background_tasks.add_task(do_scan)
    return {"ok": True, "mode": "full"}


@app.post("/api/scan/incremental")
async def start_incremental_scan(
    background_tasks: BackgroundTasks,
    _: str = Depends(require_auth),
):
    if scan_state["running"]:
        raise HTTPException(409, "Scan already running")
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT key, value FROM app_settings WHERE key IN ('root_media_path', 'ai_service_url')") as cur:
            settings = {r["key"]: r["value"] async for r in cur}

    root = settings.get("root_media_path", "/media/family")
    ai_url = settings.get("ai_service_url")

    async def do_scan():
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            await run_scan(root, db, mode="incremental", ai_service_url=ai_url)

    background_tasks.add_task(do_scan)
    return {"ok": True, "mode": "incremental"}


@app.post("/api/scan/ai-reanalyze")
async def start_ai_reanalyze(
    background_tasks: BackgroundTasks,
    _: str = Depends(require_auth),
):
    if scan_state["running"]:
        raise HTTPException(409, "Scan already running")
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT value FROM app_settings WHERE key = 'ai_service_url'") as cur:
            row = await cur.fetchone()
    ai_url = row["value"] if row else None
    if not ai_url:
        raise HTTPException(400, "AI service URL not configured")

    async def do_reanalyze():
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            await run_ai_reanalyze(db, ai_url)

    background_tasks.add_task(do_reanalyze)
    return {"ok": True}


@app.get("/api/scan/events")
async def scan_events(request: Request, _: str = Depends(require_auth)):
    q = subscribe_scan_events()

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(q.get(), timeout=30)
                    yield {"data": json.dumps(event)}
                    if event.get("type") in ("done", "error"):
                        break
                except asyncio.TimeoutError:
                    yield {"data": json.dumps({"type": "ping"})}
        finally:
            unsubscribe_scan_events(q)

    return EventSourceResponse(event_generator())


@app.get("/api/ai/status")
async def ai_service_status(_: str = Depends(require_auth)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT value FROM app_settings WHERE key = 'ai_service_url'") as cur:
            row = await cur.fetchone()
    ai_url = row["value"] if row else None
    if not ai_url:
        return {"connected": False, "url": None}

    try:
        import httpx
        async with httpx.AsyncClient(timeout=3) as client:
            resp = await client.get(f"{ai_url}/health")
        return {"connected": resp.status_code == 200, "url": ai_url}
    except Exception:
        return {"connected": False, "url": ai_url}


# ── Admin review ──────────────────────────────────────────────────────────────

@app.get("/api/admin/review")
async def get_review_queue(
    tab: str = Query("pending"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    _: str = Depends(require_auth),
):
    if tab == "pending":
        where = "WHERE face_count IS NOT NULL AND face_count = 0 AND ai_reviewed = 0 AND is_hidden = 0"
    elif tab == "hidden":
        where = "WHERE is_hidden = 1"
    else:
        where = ""

    offset = (page - 1) * page_size
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(f"SELECT COUNT(*) FROM media_files {where}") as cur:
            total = (await cur.fetchone())[0]
        async with db.execute(
            f"SELECT * FROM media_files {where} ORDER BY taken_at DESC LIMIT ? OFFSET ?",
            (page_size, offset),
        ) as cur:
            rows = await cur.fetchall()
    return {
        "total": total,
        "items": [_media_row_to_dict(r) for r in rows],
    }


@app.post("/api/admin/review/bulk")
async def bulk_review(request: Request, _: str = Depends(require_auth)):
    body = await request.json()
    ids = body.get("ids", [])
    action = body.get("action", "hide")
    if not ids:
        raise HTTPException(400, "No IDs provided")

    placeholders = ",".join("?" for _ in ids)
    async with aiosqlite.connect(DB_PATH) as db:
        if action == "hide":
            await db.execute(
                f"UPDATE media_files SET is_hidden = 1, ai_reviewed = 1 WHERE id IN ({placeholders})", ids
            )
        elif action == "keep":
            await db.execute(
                f"UPDATE media_files SET ai_reviewed = 1 WHERE id IN ({placeholders})", ids
            )
        await db.commit()
    return {"ok": True}


# ── Diaries ───────────────────────────────────────────────────────────────────

@app.get("/api/diaries")
async def list_diaries(
    year: Optional[int] = None,
    _: str = Depends(require_auth),
):
    conditions = []
    params = []
    if year:
        conditions.append("week_year = ?")
        params.append(year)
    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            f"SELECT * FROM weekly_diaries {where} ORDER BY week_year DESC, week_number DESC",
            params,
        ) as cur:
            rows = await cur.fetchall()
        # Also get weeks that have photos but no diary
        async with db.execute(
            f"""SELECT DISTINCT week_year, week_number, MIN(taken_at) as week_start_approx
                FROM media_files
                WHERE is_hidden = 0
                GROUP BY week_year, week_number
                ORDER BY week_year DESC, week_number DESC"""
        ) as cur:
            photo_weeks = await cur.fetchall()

    diary_weeks = {(r["week_year"], r["week_number"]) for r in rows}
    result = [dict(r) for r in rows]

    # Add placeholder entries for weeks with photos but no diary
    for pw in photo_weeks:
        key = (pw["week_year"], pw["week_number"])
        if key not in diary_weeks:
            result.append({
                "id": None,
                "week_year": pw["week_year"],
                "week_number": pw["week_number"],
                "week_start": None,
                "audio_path": None,
                "text_content": None,
                "created_at": None,
                "has_photos": True,
            })

    # Sort combined
    result.sort(key=lambda x: (x["week_year"], x["week_number"]), reverse=True)
    return {"diaries": result}


@app.get("/api/diaries/{year}/{week}")
async def get_diary(year: int, week: int, _: str = Depends(require_auth)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM weekly_diaries WHERE week_year = ? AND week_number = ?",
            (year, week),
        ) as cur:
            row = await cur.fetchone()
    return dict(row) if row else {}


@app.get("/api/diaries/{year}/{week}/media")
async def get_diary_media(year: int, week: int, _: str = Depends(require_auth)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM media_files WHERE week_year = ? AND week_number = ? AND is_hidden = 0 ORDER BY taken_at",
            (year, week),
        ) as cur:
            rows = await cur.fetchall()
    return {"items": [_media_row_to_dict(r) for r in rows]}


@app.post("/api/diaries")
async def upsert_diary(
    week_year: int = Form(...),
    week_number: int = Form(...),
    text_content: str = Form(default=""),
    audio: Optional[UploadFile] = File(default=None),
    _: str = Depends(require_auth),
):
    # Calculate week_start (Monday)
    jan4 = date(week_year, 1, 4)
    week_start = jan4 - timedelta(days=jan4.weekday()) + timedelta(weeks=week_number - 1)

    audio_path = None
    if audio and audio.filename:
        audio_dir = UPLOAD_DIR / "audio"
        audio_dir.mkdir(parents=True, exist_ok=True)
        audio_filename = f"{week_year}_{week_number:02d}_{audio.filename}"
        audio_path = str(audio_dir / audio_filename)
        content = await audio.read()
        with open(audio_path, "wb") as f:
            f.write(content)

    async with aiosqlite.connect(DB_PATH) as db:
        # Check if existing diary has audio_path we should preserve
        existing_audio = None
        async with db.execute(
            "SELECT audio_path FROM weekly_diaries WHERE week_year = ? AND week_number = ?",
            (week_year, week_number),
        ) as cur:
            existing = await cur.fetchone()
            if existing:
                existing_audio = existing[0]

        final_audio_path = audio_path or existing_audio

        await db.execute(
            """
            INSERT INTO weekly_diaries (week_year, week_number, week_start, audio_path, text_content)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(week_year, week_number) DO UPDATE SET
                week_start = excluded.week_start,
                audio_path = COALESCE(excluded.audio_path, audio_path),
                text_content = excluded.text_content
            """,
            (week_year, week_number, str(week_start), final_audio_path, text_content),
        )
        await db.commit()
        async with db.execute(
            "SELECT * FROM weekly_diaries WHERE week_year = ? AND week_number = ?",
            (week_year, week_number),
        ) as cur:
            row = await cur.fetchone()
    return dict(row)


@app.get("/api/diaries/{year}/{week}/audio")
async def serve_diary_audio(year: int, week: int, _: str = Depends(require_auth)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT audio_path FROM weekly_diaries WHERE week_year = ? AND week_number = ?",
            (year, week),
        ) as cur:
            row = await cur.fetchone()
    if not row or not row["audio_path"] or not os.path.exists(row["audio_path"]):
        raise HTTPException(404, "Audio not found")
    mime = mimetypes.guess_type(row["audio_path"])[0] or "audio/mpeg"
    return FileResponse(row["audio_path"], media_type=mime)


# ── Static files (frontend) ───────────────────────────────────────────────────

FRONTEND_DIST = Path(__file__).parent.parent / "mypicmanager" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
