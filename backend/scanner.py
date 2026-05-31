import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncGenerator, Optional
import aiosqlite

from exif_parser import extract_exif_async
from geocoding import reverse_geocode_async
from thumbnails import generate_thumbnail_async, get_image_dimensions, get_video_duration, ensure_thumbnail_dir

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp", ".bmp", ".gif", ".tiff", ".tif"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".m4v", ".3gp", ".wmv", ".flv"}

# Shared scan state
scan_state = {
    "running": False,
    "total": 0,
    "processed": 0,
    "current_file": "",
    "errors": 0,
    "started_at": None,
    "finished_at": None,
    "mode": None,
}

_scan_subscribers: list[asyncio.Queue] = []


def subscribe_scan_events() -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue(maxsize=100)
    _scan_subscribers.append(q)
    return q


def unsubscribe_scan_events(q: asyncio.Queue):
    try:
        _scan_subscribers.remove(q)
    except ValueError:
        pass


async def _emit(event: dict):
    for q in list(_scan_subscribers):
        try:
            q.put_nowait(event)
        except asyncio.QueueFull:
            pass


def _detect_folder_info(file_path: str, root_path: str) -> tuple[str, str | None]:
    rel = os.path.relpath(file_path, root_path)
    parts = Path(rel).parts
    family_member = parts[0] if parts else "unknown"
    # sub_folder is the 2nd-depth directory (only when file is nested at least 2 levels deep)
    sub_folder = parts[1] if len(parts) >= 3 else None
    return family_member, sub_folder


async def _process_file(
    file_path: str,
    root_path: str,
    db: aiosqlite.Connection,
    ai_service_url: Optional[str] = None,
) -> bool:
    try:
        stat = os.stat(file_path)
        file_size = stat.st_size
        ext = Path(file_path).suffix.lower()

        if ext in IMAGE_EXTENSIONS:
            media_type = "photo"
        elif ext in VIDEO_EXTENSIONS:
            media_type = "video"
        else:
            return False

        family_member, sub_folder = _detect_folder_info(file_path, root_path)
        filename = Path(file_path).name

        # Extract EXIF
        exif = {}
        width = height = None
        duration = None

        if media_type == "photo":
            exif = await extract_exif_async(file_path)
            w, h = get_image_dimensions(file_path)
            width, height = w, h
        else:
            loop = asyncio.get_event_loop()
            d = await loop.run_in_executor(None, get_video_duration, file_path)
            duration = d

        # Determine taken_at
        taken_at = exif.get("taken_at")
        if not taken_at:
            taken_at = datetime.fromtimestamp(stat.st_mtime)

        # ISO week
        iso_cal = taken_at.isocalendar()
        week_year = iso_cal[0]
        week_number = iso_cal[1]

        # GPS
        gps_lat = exif.get("gps_lat")
        gps_lng = exif.get("gps_lng")
        address = None

        if gps_lat and gps_lng:
            address = await reverse_geocode_async(gps_lat, gps_lng)

        # Thumbnail
        thumb_path = await generate_thumbnail_async(file_path, media_type)

        # AI face detection (optional)
        face_count = None
        if ai_service_url and media_type == "photo":
            try:
                import httpx
                async with httpx.AsyncClient(timeout=15) as client:
                    with open(file_path, "rb") as f:
                        resp = await client.post(
                            f"{ai_service_url}/detect-faces",
                            content=f.read(),
                            headers={"Content-Type": "image/jpeg"},
                        )
                    if resp.status_code == 200:
                        face_count = resp.json().get("face_count", 0)
            except Exception:
                pass

        await db.execute(
            """
            INSERT OR REPLACE INTO media_files
            (file_path, filename, media_type, taken_at, week_year, week_number,
             gps_lat, gps_lng, address, thumbnail_path, width, height, duration,
             family_member, sub_folder, file_size, face_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                file_path, filename, media_type,
                taken_at.isoformat() if taken_at else None,
                week_year, week_number,
                gps_lat, gps_lng, address,
                thumb_path, width, height, duration,
                family_member, sub_folder, file_size, face_count,
            ),
        )
        return True
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False


async def run_scan(
    root_path: str,
    db: aiosqlite.Connection,
    mode: str = "full",
    ai_service_url: Optional[str] = None,
):
    if scan_state["running"]:
        return

    ensure_thumbnail_dir()
    scan_state.update({
        "running": True,
        "total": 0,
        "processed": 0,
        "errors": 0,
        "current_file": "",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "finished_at": None,
        "mode": mode,
    })
    await _emit({"type": "start", "mode": mode})

    try:
        # Collect files
        all_files = []
        for dirpath, _, filenames in os.walk(root_path):
            for fn in filenames:
                ext = Path(fn).suffix.lower()
                if ext in IMAGE_EXTENSIONS or ext in VIDEO_EXTENSIONS:
                    all_files.append(os.path.join(dirpath, fn))

        # For incremental mode, filter out already-processed files
        if mode == "incremental":
            async with db.execute("SELECT file_path FROM media_files") as cur:
                existing = {row[0] async for row in cur}
            all_files = [f for f in all_files if f not in existing]

        scan_state["total"] = len(all_files)
        await _emit({"type": "total", "total": len(all_files)})

        for file_path in all_files:
            scan_state["current_file"] = file_path
            await _emit({"type": "progress", "file": file_path, "processed": scan_state["processed"], "total": scan_state["total"]})

            ok = await _process_file(file_path, root_path, db, ai_service_url)
            if ok:
                scan_state["processed"] += 1
            else:
                scan_state["errors"] += 1

            # Commit every 50 files
            if (scan_state["processed"] + scan_state["errors"]) % 50 == 0:
                await db.commit()

        await db.commit()
        scan_state["finished_at"] = datetime.now(timezone.utc).isoformat()
        await _emit({
            "type": "done",
            "processed": scan_state["processed"],
            "errors": scan_state["errors"],
        })
    except Exception as e:
        await _emit({"type": "error", "message": str(e)})
    finally:
        scan_state["running"] = False


async def run_ai_reanalyze(
    db: aiosqlite.Connection,
    ai_service_url: str,
):
    if scan_state["running"]:
        return

    scan_state.update({
        "running": True,
        "mode": "ai_reanalyze",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "finished_at": None,
        "processed": 0,
        "errors": 0,
    })
    await _emit({"type": "start", "mode": "ai_reanalyze"})

    try:
        async with db.execute(
            "SELECT id, file_path FROM media_files WHERE face_count IS NULL AND media_type = 'photo'"
        ) as cur:
            rows = await cur.fetchall()

        scan_state["total"] = len(rows)
        await _emit({"type": "total", "total": len(rows)})

        import httpx
        async with httpx.AsyncClient(timeout=15) as client:
            for row in rows:
                media_id, file_path = row[0], row[1]
                scan_state["current_file"] = file_path
                await _emit({"type": "progress", "file": file_path, "processed": scan_state["processed"], "total": scan_state["total"]})
                try:
                    with open(file_path, "rb") as f:
                        resp = await client.post(
                            f"{ai_service_url}/detect-faces",
                            content=f.read(),
                            headers={"Content-Type": "image/jpeg"},
                        )
                    if resp.status_code == 200:
                        face_count = resp.json().get("face_count", 0)
                        await db.execute(
                            "UPDATE media_files SET face_count = ? WHERE id = ?",
                            (face_count, media_id),
                        )
                        scan_state["processed"] += 1
                except Exception:
                    scan_state["errors"] += 1

        await db.commit()
        scan_state["finished_at"] = datetime.now(timezone.utc).isoformat()
        await _emit({"type": "done", "processed": scan_state["processed"], "errors": scan_state["errors"]})
    except Exception as e:
        await _emit({"type": "error", "message": str(e)})
    finally:
        scan_state["running"] = False
