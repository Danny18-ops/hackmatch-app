from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.db.models import get_db, Event, SavedEvent
from backend.config import settings
from backend.services.geocode import geocode_location, haversine_km, is_remote
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# ── Schemas ──────────────────────────────────────────────────
class EventResponse(BaseModel):
    id: int
    title: str
    description: str
    event_type: str
    field: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    url: str
    deadline: Optional[str]
    start_date: Optional[str]
    prize: Optional[str]
    tags: List[str]
    source: str

    class Config:
        from_attributes = True


def _event_dict(event: Event, distance_km: Optional[float] = None) -> dict:
    """Serialize an event (plus optional distance) for the map/area views."""
    data = {
        "id":         event.id,
        "title":      event.title,
        "type":       event.event_type,
        "field":      event.field,
        "location":   event.location,
        "latitude":   event.latitude,
        "longitude":  event.longitude,
        "deadline":   event.deadline,
        "prize":      event.prize,
        "url":        event.url,
        "tags":       event.tags,
    }
    if distance_km is not None:
        data["distance_km"] = round(distance_km, 1)
    return data

# ── Routes ───────────────────────────────────────────────────
@router.get("/", response_model=List[EventResponse])
def get_events(
    event_type: Optional[str] = Query(None),
    field:      Optional[str] = Query(None),
    location:   Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Event)
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if field:
        query = query.filter(Event.field == field)
    if location:
        query = query.filter(Event.location == location)
    return query.offset(skip).limit(limit).all()

@router.get("/nearby")
def nearby_events(
    lat: float = Query(..., description="Latitude of the search area"),
    lng: float = Query(..., description="Longitude of the search area"),
    radius_km: float = Query(80.0, ge=1, le=5000, description="Search radius in kilometers"),
    event_type: Optional[str] = Query(None),
    field:      Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Search by area: return events within `radius_km` of a point, nearest first.

    Only events that have been geocoded (latitude/longitude set) are considered.
    Run POST /api/events/geocode once to backfill coordinates for existing events.
    """
    query = db.query(Event).filter(
        Event.latitude.isnot(None),
        Event.longitude.isnot(None),
    )
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if field:
        query = query.filter(Event.field == field)

    results = []
    for event in query.all():
        distance = haversine_km(lat, lng, event.latitude, event.longitude)
        if distance <= radius_km:
            results.append(_event_dict(event, distance))

    results.sort(key=lambda e: e["distance_km"])
    results = results[:limit]
    return {
        "center":    {"lat": lat, "lng": lng},
        "radius_km": radius_km,
        "count":     len(results),
        "events":    results,
    }

@router.post("/geocode")
def geocode_events(db: Session = Depends(get_db)):
    """Backfill latitude/longitude for events that don't have them yet.

    Skips remote/online events. Requires GOOGLE_MAPS_API_KEY on the server.
    """
    if not settings.google_maps_api_key:
        raise HTTPException(
            status_code=400,
            detail="GOOGLE_MAPS_API_KEY is not configured on the server.",
        )

    pending = db.query(Event).filter(Event.latitude.is_(None)).all()
    geocoded, skipped = 0, 0
    for event in pending:
        if is_remote(event.location):
            skipped += 1
            continue
        coords = geocode_location(event.location)
        if coords:
            event.latitude, event.longitude = coords
            geocoded += 1
        else:
            skipped += 1
    db.commit()
    return {
        "geocoded": geocoded,
        "skipped":  skipped,
        "checked":  len(pending),
    }

@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.post("/{event_id}/save")
def save_event(event_id: int, user_id: int, db: Session = Depends(get_db)):
    existing = db.query(SavedEvent).filter(
        SavedEvent.user_id == user_id,
        SavedEvent.event_id == event_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Event already saved")
    
    saved = SavedEvent(user_id=user_id, event_id=event_id)
    db.add(saved)
    db.commit()
    return {"message": "Event saved successfully ✅"}

@router.get("/saved/{user_id}", response_model=List[EventResponse])
def get_saved_events(user_id: int, db: Session = Depends(get_db)):
    saved = db.query(SavedEvent).filter(SavedEvent.user_id == user_id).all()
    event_ids = [s.event_id for s in saved]
    events = db.query(Event).filter(Event.id.in_(event_ids)).all()
    return events