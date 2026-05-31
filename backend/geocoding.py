import asyncio
from typing import Optional

try:
    from geopy.geocoders import Nominatim
    from geopy.exc import GeocoderTimedOut, GeocoderServiceError
    GEOPY_AVAILABLE = True
except ImportError:
    GEOPY_AVAILABLE = False

_geocoder = None


def _get_geocoder():
    global _geocoder
    if _geocoder is None and GEOPY_AVAILABLE:
        _geocoder = Nominatim(user_agent="mypicmanager/1.0")
    return _geocoder


def reverse_geocode(lat: float, lng: float) -> Optional[str]:
    if not GEOPY_AVAILABLE:
        return None
    geocoder = _get_geocoder()
    if not geocoder:
        return None
    try:
        location = geocoder.reverse((lat, lng), language="ko", timeout=10)
        if location:
            addr = location.raw.get("address", {})
            parts = []
            for key in ("country", "province", "state", "city", "town", "village", "suburb", "neighbourhood", "road"):
                val = addr.get(key)
                if val and val not in parts:
                    parts.append(val)
            return " ".join(parts[:4]) if parts else location.address
    except (GeocoderTimedOut, GeocoderServiceError, Exception):
        pass
    return None


async def reverse_geocode_async(lat: float, lng: float) -> Optional[str]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, reverse_geocode, lat, lng)
