import asyncio
import os
import subprocess
from pathlib import Path
from typing import Optional, Tuple

try:
    from PIL import Image, ExifTags
    import piexif
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

from config import THUMBNAILS_DIR

THUMBNAIL_SIZE = (400, 400)
THUMBNAIL_DIR = THUMBNAILS_DIR


def ensure_thumbnail_dir():
    THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)


def get_thumbnail_path(file_path: str) -> Path:
    file_hash = str(abs(hash(file_path)))
    return THUMBNAIL_DIR / f"{file_hash}.jpg"


def generate_image_thumbnail(file_path: str) -> Optional[str]:
    if not PIL_AVAILABLE:
        return None
    try:
        thumb_path = get_thumbnail_path(file_path)
        if thumb_path.exists():
            return str(thumb_path)

        with Image.open(file_path) as img:
            # Fix EXIF rotation
            try:
                exif_data = img._getexif()
                if exif_data:
                    for tag, value in exif_data.items():
                        if ExifTags.TAGS.get(tag) == "Orientation":
                            rotations = {3: 180, 6: 270, 8: 90}
                            if value in rotations:
                                img = img.rotate(rotations[value], expand=True)
            except Exception:
                pass

            img.thumbnail(THUMBNAIL_SIZE, Image.LANCZOS)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            img.save(thumb_path, "JPEG", quality=85, optimize=True)
        return str(thumb_path)
    except Exception as e:
        print(f"Thumbnail error for {file_path}: {e}")
        return None


def generate_video_thumbnail(file_path: str) -> Optional[str]:
    thumb_path = get_thumbnail_path(file_path).with_suffix(".jpg")
    thumb_path_str = str(thumb_path).replace(".jpg", "_v.jpg")
    thumb_path = Path(thumb_path_str)

    if thumb_path.exists():
        return str(thumb_path)

    try:
        result = subprocess.run(
            [
                "ffmpeg", "-y", "-ss", "00:00:01",
                "-i", file_path,
                "-vframes", "1",
                "-vf", "scale=400:400:force_original_aspect_ratio=decrease",
                str(thumb_path),
            ],
            capture_output=True,
            timeout=30,
        )
        if result.returncode == 0 and thumb_path.exists():
            return str(thumb_path)
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return None


def get_image_dimensions(file_path: str) -> Tuple[Optional[int], Optional[int]]:
    if not PIL_AVAILABLE:
        return None, None
    try:
        with Image.open(file_path) as img:
            return img.size
    except Exception:
        return None, None


def get_video_duration(file_path: str) -> Optional[float]:
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                file_path,
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            return float(result.stdout.strip())
    except Exception:
        pass
    return None


async def generate_thumbnail_async(file_path: str, media_type: str) -> Optional[str]:
    loop = asyncio.get_event_loop()
    if media_type == "photo":
        return await loop.run_in_executor(None, generate_image_thumbnail, file_path)
    else:
        return await loop.run_in_executor(None, generate_video_thumbnail, file_path)
