import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
import aiosqlite
from fastapi import Cookie, HTTPException, status, Depends
from database import get_db, DB_PATH

SESSION_DURATION_DAYS = 30

_sessions: dict[str, datetime] = {}


def create_session() -> str:
    token = secrets.token_urlsafe(32)
    _sessions[token] = datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)
    return token


def validate_session(token: str) -> bool:
    exp = _sessions.get(token)
    if not exp:
        return False
    if datetime.now(timezone.utc) > exp:
        _sessions.pop(token, None)
        return False
    return True


def delete_session(token: str):
    _sessions.pop(token, None)


async def get_passcode(db: aiosqlite.Connection) -> str:
    async with db.execute("SELECT value FROM app_settings WHERE key = 'passcode'") as cur:
        row = await cur.fetchone()
        return row["value"] if row else "1234"


async def require_auth(session: Optional[str] = Cookie(default=None, alias="session")):
    if not session or not validate_session(session):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return session
