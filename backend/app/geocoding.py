import time
import logging
from typing import Optional, Tuple
import requests

logger = logging.getLogger(__name__)

# Simple cache: query string -> (lat, lng)
_GEOCODE_CACHE: dict[str, Optional[Tuple[float, float]]] = {}
_LAST_REQUEST_TIME = 0.0

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "Nagrik-CivicComplaintTriage/2.0 (contact: info@nagrik.local)"

def geocode_location(location_query: Optional[str]) -> Tuple[Optional[float], Optional[float]]:
    """
    Geocodes location text using OpenStreetMap Nominatim.
    Adheres strictly to Nominatim usage policy:
    - Custom User-Agent
    - 1 req/sec rate limit
    - Timeout protection
    - In-memory result caching
    - Returns (None, None) gracefully on any error or missing result
    """
    global _LAST_REQUEST_TIME
    if not location_query or not location_query.strip():
        return None, None

    clean_query = location_query.strip()
    cache_key = clean_query.lower()

    if cache_key in _GEOCODE_CACHE:
        cached = _GEOCODE_CACHE[cache_key]
        if cached:
            return cached
        return None, None

    # Rate limiting: wait until at least 1.0s has passed since last request
    now = time.time()
    elapsed = now - _LAST_REQUEST_TIME
    if elapsed < 1.05:
        time.sleep(1.05 - elapsed)

    try:
        headers = {"User-Agent": USER_AGENT}
        params = {
            "q": clean_query,
            "format": "json",
            "limit": 1
        }
        _LAST_REQUEST_TIME = time.time()
        response = requests.get(NOMINATIM_URL, params=params, headers=headers, timeout=5.0)

        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                lat = float(data[0]["lat"])
                lng = float(data[0]["lon"])
                _GEOCODE_CACHE[cache_key] = (lat, lng)
                logger.info(f"Geocoded '{clean_query}' -> ({lat}, {lng})")
                return lat, lng
            else:
                _GEOCODE_CACHE[cache_key] = None
        else:
            logger.warning(f"Nominatim returned status {response.status_code} for '{clean_query}'")
            _GEOCODE_CACHE[cache_key] = None

    except Exception as e:
        logger.warning(f"Geocoding failed for '{clean_query}': {e}")
        _GEOCODE_CACHE[cache_key] = None

    return None, None
