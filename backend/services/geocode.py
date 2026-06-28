"""Geocoding + distance helpers for the "search by area" feature.

Uses the free OpenStreetMap Nominatim API — no API key, no billing. Turns an
event's free-text `location` (e.g. "San Diego, CA") into latitude/longitude,
and measures distance between two points so we can filter events by radius.
"""
import math
from functools import lru_cache
from typing import Optional, Tuple

import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
# Nominatim's usage policy asks for an identifying User-Agent.
_HEADERS = {"User-Agent": "HackMatch/1.0 (hackathon & event discovery app)"}

# Locations that have no physical coordinates and should be skipped.
_NON_PHYSICAL = {"remote", "online", "virtual", "worldwide", "anywhere", "tbd", "n/a", ""}


def is_remote(location: Optional[str]) -> bool:
    """True for events that aren't tied to a physical place."""
    if not location:
        return True
    loc = location.strip().lower()
    return loc in _NON_PHYSICAL or "remote" in loc or "online" in loc


@lru_cache(maxsize=4096)
def geocode_location(location: str) -> Optional[Tuple[float, float]]:
    """Geocode free text to (lat, lng). Returns None if remote, empty, or no
    result. Cached so repeated city names cost one network call."""
    place = geocode_place(location)
    return (place["lat"], place["lng"]) if place else None


def geocode_place(query: Optional[str]) -> Optional[dict]:
    """Geocode a query to {lat, lng, formatted_address} or None via Nominatim.

    Returns None (rather than raising) when the query is remote/empty or
    Nominatim returns no match — callers treat that as "no coordinates".
    """
    if not query or is_remote(query):
        return None
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={"q": query, "format": "json", "limit": 1},
            headers=_HEADERS,
            timeout=10,
        )
        data = resp.json()
        if data:
            top = data[0]
            return {
                "lat": float(top["lat"]),
                "lng": float(top["lon"]),
                "formatted_address": top.get("display_name", query),
            }
    except (requests.RequestException, ValueError, KeyError, IndexError):
        return None
    return None


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two lat/lng points, in kilometers."""
    radius = 6371.0  # Earth radius (km)
    p1, p2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(d_lambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))
