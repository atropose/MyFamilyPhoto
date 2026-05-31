"""Central config — reads .env if present, falls back to defaults."""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass

MEDIA_ROOT = Path(os.getenv("MEDIA_ROOT", str(Path(__file__).parent.parent / "photos")))
THUMBNAILS_DIR = Path(os.getenv("THUMBNAILS_DIR", str(Path(__file__).parent / "thumbnails")))
DB_PATH = Path(os.getenv("DB_PATH", str(Path(__file__).parent / "mypic.db")))
DEFAULT_PASSCODE = os.getenv("DEFAULT_PASSCODE", "1234")
