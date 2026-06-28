"""Seed events.

`IN_PERSON_SEED` — curated in-person events with real city coordinates. These
are ALWAYS ensured on startup (inserted if missing, matched by title), IN
ADDITION to the live Devpost scrape, so "Search by Area" always has real,
mappable events even though most scraped Devpost hackathons are Remote.

`REMOTE_SEED` — remote samples used only as a fallback when the Devpost scrape
returns nothing, so the site is never blank.

All URLs point to real, stable listing pages (no placeholder URLs).
"""

# Bump whenever seed data changes to force a one-time refresh on the next deploy
# (see backend/main.py startup). "3" adds the always-inserted in-person events.
SEED_VERSION = "3"

# Real, stable destinations.
DEVPOST = "https://devpost.com/hackathons"
MLH = "https://mlh.io/seasons/2026/events"
CTFTIME = "https://ctftime.org/event/list/upcoming"
ETHGLOBAL = "https://ethglobal.com/events"
MEETUP_FRONTEND = "https://www.meetup.com/find/?keywords=frontend"
MEETUP_MOBILE = "https://www.meetup.com/find/?keywords=mobile%20development"
FLUTTER = "https://flutter.dev/events"
ITCHIO_JAMS = "https://itch.io/jams"
PYDATA = "https://pydata.org/"
HACKTOBERFEST = "https://hacktoberfest.com/"
TRYHACKME = "https://tryhackme.com/"
OPENSOURCE_ORG = "https://opensource.org/"
WEBDEV = "https://web.dev/"

# ── In-person events (always inserted; have coordinates for the map) ──────────
IN_PERSON_SEED = [
    {
        "title": "San Diego AI Innovate Hackathon",
        "description": "A 48-hour in-person hackathon to build LLM-powered apps with mentors from top AI labs. Beginner-friendly tracks and hardware on site.",
        "event_type": "hackathon", "field": "AI/ML",
        "location": "San Diego, CA", "latitude": 32.7157, "longitude": -117.1611,
        "url": DEVPOST, "deadline": "2026-08-15", "start_date": "2026-09-05",
        "prize": "$25,000", "tags": ["ai", "ml", "llm"], "source": "seed",
    },
    {
        "title": "SoCal Cyber Defense CTF",
        "description": "On-site capture-the-flag competition covering web exploitation, reverse engineering, and cryptography. Teams of up to four.",
        "event_type": "hackathon", "field": "Cybersecurity",
        "location": "San Diego, CA", "latitude": 32.7295, "longitude": -117.1573,
        "url": CTFTIME, "deadline": "2026-07-20", "start_date": "2026-08-01",
        "prize": "$10,000", "tags": ["security", "ctf"], "source": "seed",
    },
    {
        "title": "SF Founders Web3 Summit",
        "description": "Two-day in-person conference on decentralized apps, smart contracts, and on-chain identity. Talks, workshops, and a demo night.",
        "event_type": "conference", "field": "Web3",
        "location": "San Francisco, CA", "latitude": 37.7749, "longitude": -122.4194,
        "url": ETHGLOBAL, "deadline": None, "start_date": "2026-10-12",
        "prize": None, "tags": ["web3", "blockchain"], "source": "seed",
    },
    {
        "title": "LA Indie GameDev Jam",
        "description": "Weekend in-person game jam with a surprise theme. Artists, designers, and engineers welcome; showcase your build on Sunday.",
        "event_type": "hackathon", "field": "General Tech",
        "location": "Los Angeles, CA", "latitude": 34.0522, "longitude": -118.2437,
        "url": ITCHIO_JAMS, "deadline": None, "start_date": "2026-08-22",
        "prize": "$5,000", "tags": ["gamedev", "unity"], "source": "seed",
    },
    {
        "title": "NYC Cybersecurity Meetup",
        "description": "Monthly in-person meetup for security engineers and students. This month: threat modeling and a live CTF challenge.",
        "event_type": "meetup", "field": "Cybersecurity",
        "location": "New York, NY", "latitude": 40.7128, "longitude": -74.0060,
        "url": TRYHACKME, "deadline": None, "start_date": "2026-07-30",
        "prize": None, "tags": ["security", "networking"], "source": "seed",
    },
    {
        "title": "Seattle Cloud & DevOps Workshop",
        "description": "Hands-on in-person workshop on CI/CD, containers, and observability. Bring a laptop; intermediate level.",
        "event_type": "workshop", "field": "General Tech",
        "location": "Seattle, WA", "latitude": 47.6062, "longitude": -122.3321,
        "url": WEBDEV, "deadline": "2026-06-30", "start_date": "2026-07-10",
        "prize": None, "tags": ["devops", "cloud"], "source": "seed",
    },
    {
        "title": "Austin Mobile Builders Meetup",
        "description": "In-person meetup for mobile developers building with Flutter, Swift, and Kotlin. Lightning talks and an open Q&A.",
        "event_type": "meetup", "field": "Mobile",
        "location": "Austin, TX", "latitude": 30.2672, "longitude": -97.7431,
        "url": FLUTTER, "deadline": None, "start_date": "2026-07-18",
        "prize": None, "tags": ["mobile", "flutter"], "source": "seed",
    },
    {
        "title": "Boston HealthTech Hackathon",
        "description": "In-person hackathon building software for healthcare and life sciences, with access to de-identified datasets from partner hospitals.",
        "event_type": "hackathon", "field": "Social Impact",
        "location": "Boston, MA", "latitude": 42.3601, "longitude": -71.0589,
        "url": MLH, "deadline": "2026-09-01", "start_date": "2026-09-20",
        "prize": "$15,000", "tags": ["health", "social impact"], "source": "seed",
    },
]

# ── Remote events (fallback only, no coordinates) ─────────────────────────────
REMOTE_SEED = [
    {
        "title": "Global Remote AI Agents Hackathon",
        "description": "Fully online hackathon to build autonomous agents and tool-using LLM apps. Open worldwide; async judging.",
        "event_type": "hackathon", "field": "AI/ML",
        "location": "Remote", "latitude": None, "longitude": None,
        "url": DEVPOST, "deadline": "2026-07-31", "start_date": "2026-08-08",
        "prize": "$30,000", "tags": ["ai", "agents", "remote"], "source": "seed",
    },
    {
        "title": "Remote Web3 DeFi Build Week",
        "description": "Week-long online build sprint focused on DeFi protocols and on-chain tooling, with daily mentor office hours.",
        "event_type": "hackathon", "field": "Web3",
        "location": "Remote", "latitude": None, "longitude": None,
        "url": ETHGLOBAL, "deadline": "2026-09-05", "start_date": "2026-09-15",
        "prize": "$18,000", "tags": ["web3", "defi", "remote"], "source": "seed",
    },
    {
        "title": "Open Source Maintainers Meetup (Virtual)",
        "description": "Casual virtual meetup for maintainers and contributors to swap tips on governance, CI, and growing a community.",
        "event_type": "meetup", "field": "General Tech",
        "location": "Remote", "latitude": None, "longitude": None,
        "url": HACKTOBERFEST, "deadline": None, "start_date": "2026-07-28",
        "prize": None, "tags": ["open source", "remote"], "source": "seed",
    },
    {
        "title": "Remote Frontend Performance Workshop",
        "description": "Deep-dive into Core Web Vitals, bundle analysis, and rendering strategies. Live coding plus a Q&A.",
        "event_type": "workshop", "field": "Web Development",
        "location": "Remote", "latitude": None, "longitude": None,
        "url": MEETUP_FRONTEND, "deadline": None, "start_date": "2026-08-05",
        "prize": None, "tags": ["frontend", "performance", "remote"], "source": "seed",
    },
    {
        "title": "Online Data Science Conference",
        "description": "Virtual talks on ML in production, MLOps, and responsible AI, plus a hands-on feature-engineering session.",
        "event_type": "conference", "field": "AI/ML",
        "location": "Remote", "latitude": None, "longitude": None,
        "url": PYDATA, "deadline": None, "start_date": "2026-11-03",
        "prize": None, "tags": ["data science", "mlops", "remote"], "source": "seed",
    },
]

SEED_EVENTS = IN_PERSON_SEED + REMOTE_SEED


def _insert_missing(db, events) -> int:
    """Insert events whose title isn't already in the table. Returns count added."""
    from backend.db.models import Event
    added = 0
    for e in events:
        if not db.query(Event).filter(Event.title == e["title"]).first():
            db.add(Event(**e))
            added += 1
    if added:
        db.commit()
    return added


def seed_in_person_events(db) -> int:
    """Always-ensure the curated in-person events exist (matched by title).
    Safe to call on every startup — idempotent."""
    return _insert_missing(db, IN_PERSON_SEED)


def seed_initial_events(db) -> int:
    """Fallback seed: insert all sample events if the table is empty.
    Returns the number inserted (0 if already populated)."""
    from backend.db.models import Event
    if db.query(Event).count() > 0:
        return 0
    for event in SEED_EVENTS:
        db.add(Event(**event))
    db.commit()
    return len(SEED_EVENTS)
