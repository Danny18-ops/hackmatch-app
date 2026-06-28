from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from backend.db.models import init_db
from backend.config import settings
from backend.api.routes import events, users, search, auth, chat

app = FastAPI(
    title="HackMatch API",
    description="AI-powered hackathon & tech event discovery engine",
    version="1.0.0"
)

# Session cookie — required by Authlib to hold the OAuth state/nonce between
# /{provider}/login and /{provider}/callback.
app.add_middleware(SessionMiddleware, secret_key=settings.secret_key)

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://hackmatch.dnyaneshwariraut.com",
        "https://hackmatch-app.vercel.app",
        "https://hackmatch-app-danny18-ops-projects.vercel.app",
        "https://hackmatch-3y13gsp5b-danny18-ops-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router,   prefix="/api/auth",   tags=["Auth"])
app.include_router(users.router,  prefix="/api/users",  tags=["Users"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(chat.router,   prefix="/api",        tags=["Chat"])

def _scrape_and_store(db, max_pages: int = 3) -> int:
    """Scrape Devpost, geocode physical locations, and store new events.
    Returns the number of events added. Shared by /api/scrape and auto-seed."""
    from backend.scraper.devpost import scrape_devpost
    from backend.db.models import Event
    from backend.services.geocode import geocode_location, is_remote

    events = scrape_devpost(max_pages=max_pages)
    added = 0
    for e in events:
        if db.query(Event).filter(Event.title == e['title']).first():
            continue
        # Geocode physical locations so the event shows up in area search.
        if not is_remote(e.get('location')):
            coords = geocode_location(e['location'])
            if coords:
                e['latitude'], e['longitude'] = coords
        db.add(Event(**e))
        added += 1
    db.commit()
    return added


def _populate_events(db) -> None:
    """Populate an (assumed empty) events table: scrape Devpost first for real
    events, then fall back to the deterministic seed if the scrape yields none."""
    from backend.db.models import Event
    from backend.db.seed_data import seed_initial_events

    try:
        added = _scrape_and_store(db)
        if added:
            print(f"🌐 Seeded {added} live Devpost events")
    except Exception as ex:
        print(f"⚠️ Devpost scrape failed: {ex}")

    if db.query(Event).count() == 0:
        inserted = seed_initial_events(db)
        if inserted:
            print(f"🌱 Devpost unavailable — inserted {inserted} fallback events")


@app.on_event("startup")
def startup():
    init_db()
    from backend.db.models import SessionLocal, Event, Meta
    from backend.db.seed_data import SEED_VERSION

    db = SessionLocal()
    try:
        applied = db.query(Meta).filter(Meta.key == "seed_version").first()
        applied_version = applied.value if applied else None

        if applied_version != SEED_VERSION:
            # Seed data changed: one-time refresh. Wipe ONLY the events table
            # (events come solely from scrape/seed). User accounts live in a
            # separate table and are never touched here.
            deleted = db.query(Event).delete()
            db.commit()
            print(f"♻️  Seed {applied_version} -> {SEED_VERSION}: cleared {deleted} stale events")

            _populate_events(db)

            if applied:
                applied.value = SEED_VERSION
            else:
                db.add(Meta(key="seed_version", value=SEED_VERSION))
            db.commit()
        elif db.query(Event).count() == 0:
            # Safety net: matching version but the table is empty.
            _populate_events(db)
    except Exception as ex:
        db.rollback()
        print(f"⚠️ Startup seeding failed: {ex}")
    finally:
        db.close()
    print("✅ HackMatch API is running!")

@app.get("/")
def root():
    return {"message": "Welcome to HackMatch API 🚀"}

@app.post("/api/scrape")
def trigger_scrape():
    from backend.db.models import SessionLocal, Event
    db = SessionLocal()
    try:
        added = _scrape_and_store(db)
        total = db.query(Event).count()
        return {"message": f"Added {added} events. Total: {total}"}
    except Exception as ex:
        db.rollback()
        return {"error": str(ex)}
    finally:
        db.close()
