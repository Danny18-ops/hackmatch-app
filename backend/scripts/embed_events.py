"""
embed_events.py — Pre-compute and store event embeddings in ChromaDB.

Run from the project root:
    python -m backend.scripts.embed_events

This is idempotent: re-running it will upsert (update) existing entries.
"""

import sys
import logging
from pathlib import Path

# Ensure the project root is on the path when run directly
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.db.models import SessionLocal, Event, init_db
from backend.rag.pipeline import (
    CHROMA_PATH,
    COLLECTION_NAME,
    EMBED_MODEL_NAME,
    event_to_text,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

BATCH_SIZE = 64  # encode this many events at a time


def main():
    init_db()
    db = SessionLocal()

    try:
        events = db.query(Event).all()
        if not events:
            logger.warning("No events found in the database. Run the scraper first.")
            return

        logger.info("Loaded %d events from database.", len(events))

        # ── Load model ───────────────────────────────────────────
        from sentence_transformers import SentenceTransformer
        logger.info("Loading embedding model '%s'…", EMBED_MODEL_NAME)
        model = SentenceTransformer(EMBED_MODEL_NAME)

        # ── Connect to ChromaDB ──────────────────────────────────
        import chromadb
        CHROMA_PATH.mkdir(parents=True, exist_ok=True)
        chroma_client = chromadb.PersistentClient(path=str(CHROMA_PATH))
        collection = chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info("ChromaDB collection '%s' ready (existing docs: %d).",
                    COLLECTION_NAME, collection.count())

        # ── Embed and upsert in batches ──────────────────────────
        total = len(events)
        for batch_start in range(0, total, BATCH_SIZE):
            batch = events[batch_start: batch_start + BATCH_SIZE]

            texts = [event_to_text(e) for e in batch]
            ids = [str(e.id) for e in batch]
            metadatas = [
                {
                    "title": e.title or "",
                    "event_type": e.event_type or "",
                    "field": e.field or "",
                    "location": e.location or "",
                    "url": e.url or "",
                }
                for e in batch
            ]

            embeddings = model.encode(texts, show_progress_bar=False).tolist()

            collection.upsert(
                ids=ids,
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
            )

            end = min(batch_start + BATCH_SIZE, total)
            logger.info("Upserted events %d–%d / %d", batch_start + 1, end, total)

        logger.info(
            "Done. ChromaDB collection now contains %d documents.", collection.count()
        )

    finally:
        db.close()


if __name__ == "__main__":
    main()
