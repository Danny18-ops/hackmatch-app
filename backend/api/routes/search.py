from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.db.models import get_db, Event, User
from backend.rag.pipeline import rag_search
from backend.ml.matcher import match_events
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    user_id: Optional[int] = None

class MatchRequest(BaseModel):
    user_id: int
    limit: Optional[int] = 50

@router.post("/query")
async def search_events(request: SearchRequest, db: Session = Depends(get_db)):
    """Natural language search using RAG pipeline"""
    events = db.query(Event).all()
    if not events:
        return {
            "query": request.query,
            "answer": "No events found in database yet. Please run the scraper first!",
            "events": []
        }
    result = await rag_search(request.query, events)
    return result

@router.post("/match")
def match_user_events(request: MatchRequest, db: Session = Depends(get_db)):
    """Match events to user based on their profile"""
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        return {"error": "User not found"}
    
    events = db.query(Event).all()
    if not events:
        return {"error": "No events found"}
    
    matched = match_events(user, events, limit=request.limit)
    # match_events already filters score > 0 and sorts descending
    return {
        "user_id":        request.user_id,
        "matched_events": matched,
        "count":          len(matched),
    }