import asyncio
from datetime import datetime
from typing import Optional, Tuple
import os

try:
    from PIL import Image
    from PIL.ExifTags import TAGS, GPSTAGS
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


def _dms_to_decimal(dms, ref: str) -> float:
    degrees, minutes, seconds = dms
    if hasattr(degrees, "numerator"):
        degrees = degrees.numerator / degrees.denominator
        minutes = minutes.numerator / minutes.denominator
        seconds = seconds.numerator / seconds.denominator
    result = float(degrees) + float(minutes) / 60 + float(seconds) / 3600
    if ref in ("S", "W"):
        result = -result
    return result


def extract_exif(file_path: str) -> dict:
    if not PIL_AVAILABLE:
        return {}
    try:
        with Image.open(file_path) as img:
            raw = img._getexif()
            if not raw:
                return {}

        data = {}
        gps_data = {}

        for tag_id, value in raw.items():
            tag = TAGS.get(tag_id, str(tag_id))
            if tag == "GPSInfo":
                for gps_id, gps_val in value.items():
                    gps_tag = GPSTAGS.get(gps_id, str(gps_id))
                    gps_data[gps_tag] = gps_val
            elif tag == "DateTimeOriginal":
                try:
                    data["taken_at"] = datetime.strptime(str(value), "%Y:%m:%d %H:%M:%S")
                except ValueError:
                    pass
            elif tag == "DateTime" and "taken_at" not in data:
                try:
                    data["taken_at"] = datetime.strptime(str(value), "%Y:%m:%d %H:%M:%S")
                except ValueError:
                    pass
            elif tag == "Make":
                data["camera_make"] = str(value).strip()
            elif tag == "Model":
                data["camera_model"] = str(value).strip()

        if gps_data:
            try:
                lat = _dms_to_decimal(gps_data["GPSLatitude"], gps_data.get("GPSLatitudeRef", "N"))
                lng = _dms_to_decimal(gps_data["GPSLongitude"], gps_data.get("GPSLongitudeRef", "E"))
                if -90 <= lat <= 90 and -180 <= lng <= 180:
                    data["gps_lat"] = lat
                    data["gps_lng"] = lng
            except (KeyError, TypeError, ZeroDivisionError):
                pass

        return data
    except Exception:
        return {}


async def extract_exif_async(file_path: str) -> dict:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, extract_exif, file_path)
