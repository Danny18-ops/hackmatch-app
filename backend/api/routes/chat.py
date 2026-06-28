"""HackMatch assistant — a lightweight always-available chat endpoint.

Reuses the Anthropic client from the RAG pipeline. Fetches current events from
the DB each call and includes a compact summary so the assistant recommends
real events with real links. Degrades to a friendly fallback message when
ANTHROPIC_API_KEY is unset or the API call fails.
"""
import logging
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.config import settings
from backend.db.models import get_db, Event
from backend.rag.pipeline import _get_client

router = APIRouter()
logger = logging.getLogger(__name__)

FALLBACK_REPLY = (
    "I'm the HackMatch assistant! The AI service isn't fully configured right "
    "now, but you can browse events on the Events page, try natural-language "
    "AI Search, or find in-person events on Search by Area."
)


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


def _events_context(db: Session, limit: int = 40) -> str:
    events = db.query(Event).limit(limit).all()
    if not events:
        return "(No events are currently in the database.)"
    lines = []
    for e in events:
        lines.append(
            f"- {e.title} | {e.event_type or 'event'} | {e.field or 'General'} | "
            f"{e.location or 'Remote'} | deadline: {e.deadline or 'n/a'} | {e.url}"
        )
    return "\n".join(lines)


def _build_system(context: str) -> str:
    return f"""You are the HackMatch assistant — a friendly, concise helper inside the HackMatch web app.

HackMatch helps people discover hackathons, conferences, meetups, and workshops, and get AI-matched to events based on their skills and interests.

You can help with two things:
1. Recommending events from the list below. Always use the event's REAL title and REAL url exactly as given — never invent events, titles, or links.
2. Explaining how the app works:
   - Home: overview and live event counts.
   - Events: browse "All Events" or "My Matches" (events ranked for the signed-in user by skills/interests). Filter by type, field, and Remote/In-Person.
   - AI Search: ask in natural language and get event recommendations.
   - Search by Area: find in-person events near a city on a Google Map.
   - Profile: sign up / sign in (email-password or Google/GitHub), set your skills and preferred event types, auto-detect skills from GitHub, then "Save & Find My Events".

Guidelines:
- Keep replies short and friendly — usually 2-4 sentences. Respond with the final answer only; don't narrate your reasoning.
- Format replies in Markdown: use **bold** for emphasis and "- " bullet lists when listing multiple events.
- When recommending an event, link it as a Markdown link using its real url, e.g. [Event Name](https://...), so it's clickable.
- If nothing in the list fits, say so and suggest the Events filters or AI Search.
- Only reference events from this list:

{context}"""


@router.post("/chat")
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Reply to a conversation as the HackMatch assistant."""
    # Sanitize: keep only user/assistant turns, drop leading assistant turns
    # (the Anthropic API requires the first message to be from the user).
    msgs = [
        {"role": m.role, "content": m.content}
        for m in request.messages
        if m.role in ("user", "assistant") and m.content.strip()
    ]
    while msgs and msgs[0]["role"] != "user":
        msgs.pop(0)

    if not msgs:
        return {"reply": "Hi! I'm the HackMatch assistant. Ask me to find a hackathon or how the app works.", "ai_powered": False}

    if not settings.anthropic_api_key:
        return {"reply": FALLBACK_REPLY, "ai_powered": False}

    try:
        system = _build_system(_events_context(db))
        response = _get_client().messages.create(
            model="claude-opus-4-8",
            max_tokens=1024,
            system=system,
            messages=msgs,
        )
        reply = next((b.text for b in response.content if b.type == "text"), "")
        return {"reply": reply or FALLBACK_REPLY, "ai_powered": bool(reply)}
    except Exception as ex:
        logger.warning("Chat request failed: %s", ex)
        return {"reply": FALLBACK_REPLY, "ai_powered": False}
