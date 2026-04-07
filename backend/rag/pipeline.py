import anthropic
from backend.config import settings
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

# ── ChromaDB + Sentence-Transformers setup ───────────────────
CHROMA_PATH = Path(__file__).parent.parent.parent / "chroma_db"
COLLECTION_NAME = "events"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"

_embed_model = None
_chroma_collection = None


def _get_embed_model():
    global _embed_model
    if _embed_model is None:
        from sentence_transformers import SentenceTransformer
        _embed_model = SentenceTransformer(EMBED_MODEL_NAME)
    return _embed_model


def _get_collection():
    global _chroma_collection
    if _chroma_collection is None:
        import chromadb
        chroma_client = chromadb.PersistentClient(path=str(CHROMA_PATH))
        _chroma_collection = chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _chroma_collection


# ── Helpers ──────────────────────────────────────────────────

def event_to_text(event) -> str:
    """Build a rich text representation of an event for embedding."""
    parts = [
        event.title,
        event.event_type or "",
        event.field or "",
        event.location or "",
        " ".join(event.tags or []),
        (event.description or "")[:500],
    ]
    return " ".join(p for p in parts if p).strip()


def build_context(events) -> str:
    """Convert events into text context for the LLM."""
    context_parts = []
    for i, event in enumerate(events[:15]):
        context_parts.append(
            f"Event {i+1}:\n"
            f"  Title: {event.title}\n"
            f"  Type: {event.event_type}\n"
            f"  Field: {event.field}\n"
            f"  Location: {event.location}\n"
            f"  Deadline: {event.deadline or 'Not specified'}\n"
            f"  Prize: {event.prize or 'Not specified'}\n"
            f"  Tags: {', '.join(event.tags) if event.tags else 'None'}\n"
            f"  URL: {event.url}\n"
            f"  Description: {(event.description or '')[:200]}...\n"
        )
    return "\n".join(context_parts)


# ── Retrieval strategies ─────────────────────────────────────

def semantic_search(query: str, all_events: list, top_k: int = 15) -> list:
    """Embed the query and find the top-K most semantically similar events."""
    collection = _get_collection()
    count = collection.count()
    if count == 0:
        logger.warning("ChromaDB collection is empty — run embed_events.py first")
        return []

    model = _get_embed_model()
    query_embedding = model.encode(query).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, count),
    )

    matched_ids = {int(id_) for id_ in results["ids"][0]}
    id_to_event = {e.id: e for e in all_events}
    # Preserve ChromaDB ranking order
    ordered = [id_to_event[int(id_)] for id_ in results["ids"][0] if int(id_) in id_to_event]
    return ordered


def keyword_fallback(query: str, events: list, top_k: int = 15) -> list:
    """Keyword-based fallback when ChromaDB has no data yet."""
    query_lower = query.lower()
    keywords = query_lower.split()

    scored = []
    for event in events:
        searchable = " ".join([
            event.title or "",
            event.description or "",
            event.field or "",
            event.event_type or "",
            event.location or "",
            " ".join(event.tags or []),
        ]).lower()
        score = sum(1 for kw in keywords if kw in searchable)
        if score > 0:
            scored.append((score, event))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [e for _, e in scored[:top_k]]


# ── Public RAG entry-point ───────────────────────────────────

async def rag_search(query: str, all_events: list) -> dict:
    """
    RAG Pipeline:
    1. RETRIEVE — semantically find the most relevant events via ChromaDB
    2. AUGMENT  — build a context prompt with those events
    3. GENERATE — ask Claude to answer using that context
    """
    # Step 1: RETRIEVE
    relevant_events = semantic_search(query, all_events, top_k=15)
    retrieval_method = "semantic"

    if not relevant_events:
        # Fallback: keyword matching (e.g., embeddings not yet computed)
        relevant_events = keyword_fallback(query, all_events, top_k=15)
        retrieval_method = "keyword"

    if not relevant_events:
        relevant_events = all_events[:10]
        retrieval_method = "default"

    logger.info("Retrieval method: %s, events returned: %d", retrieval_method, len(relevant_events))

    # Step 2: AUGMENT
    context = build_context(relevant_events)

    prompt = f"""You are HackMatch, an AI assistant that helps people find the perfect hackathons,
conferences, meetups, and tech events based on their interests and skills.

Here are the available events in our database:

{context}

User Query: {query}

Based on the events above, provide a helpful, conversational response that:
1. Recommends the most relevant events for the user's query
2. Explains WHY each event is a good match
3. Mentions key details like deadlines, prizes, and location
4. Is encouraging and enthusiastic

If no events match well, suggest what types of events the user should look for.
Keep your response concise and friendly."""

    # Step 3: GENERATE
    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    answer = message.content[0].text

    events_data = [
        {
            "id": event.id,
            "title": event.title,
            "type": event.event_type,
            "field": event.field,
            "location": event.location,
            "deadline": event.deadline,
            "prize": event.prize,
            "url": event.url,
            "tags": event.tags,
        }
        for event in relevant_events[:5]
    ]

    return {
        "query": query,
        "answer": answer,
        "events": events_data,
        "retrieval_method": retrieval_method,
    }
