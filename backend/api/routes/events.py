from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.db.models import get_db, Event, SavedEvent
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
    url: str
    deadline: Optional[str]
    start_date: Optional[str]
    prize: Optional[str]
    tags: List[str]
    source: str

    class Config:
        from_attributes = True

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