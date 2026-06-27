"""Geocoding + distance helpers for the "search by area" feature.

Turns an event's free-text `location` (e.g. "San Diego, CA") into
latitude/longitude via the Google Maps Geocoding API, and measures the
distance between two points so we can filter events by radius.
"""
import math
from functools import lru_cache
from typing import Optional, Tuple

import requests

from backend.config import settings

GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

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
    """Geocode free text to (lat, lng). Returns None if not configured,
    remote, or no result. Cached so repeated city names cost one API call."""
    place = geocode_place(location)
    return (place["lat"], place["lng"]) if place else None


def geocode_place(query: Optional[str]) -> Optional[dict]:
    """Geocode a query to {lat, lng, formatted_address} or None.

    Returns None (rather than raising) when the server has no API key,
    the query is remote/empty, or Google returns no match — callers treat
    that as "no coordinates available".
    """
    if not query or is_remote(query):
        return None
    if not settings.google_maps_api_key:
        return None
    try:
        resp = requests.get(
            GEOCODE_URL,
            params={"address": query, "key": settings.google_maps_api_key},
            timeout=10,
        )
        data = resp.json()
        if data.get("status") == "OK" and data.get("results"):
            top = data["results"][0]
            loc = top["geometry"]["location"]
            return {
                "lat": loc["lat"],
                "lng": loc["lng"],
                "formatted_address": top.get("formatted_address", query),
            }
    except (requests.RequestException, ValueError, KeyError):
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
