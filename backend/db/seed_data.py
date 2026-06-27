"""Deterministic seed events.

Inserted synchronously on startup when the events table is empty, so the live
site is never blank — independent of the (flaky, network-dependent) Devpost
scrape. The Devpost scrape stays available as optional enrichment via
POST /api/scrape.

A few events carry real city coordinates so "search by area" works out of the
box; others are Remote (no coordinates).
"""

SEED_EVENTS = [
    {
        "title": "AI Innovate Hackathon 2026",
        "description": "48-hour hackathon to build LLM-powered apps. Beginner-friendly tracks, mentors from top AI labs, and workshops on RAG and agents.",
        "event_type": "hackathon", "field": "AI/ML",
        "location": "San Francisco, CA", "latitude": 37.7749, "longitude": -122.4194,
        "url": "https://example.com/ai-innovate", "deadline": "2026-08-15",
        "start_date": "2026-09-05", "prize": "$25,000",
        "tags": ["ai", "ml", "llm", "rag"], "source": "seed",
    },
    {
        "title": "SoCal Cyber Defense CTF",
        "description": "Capture-the-flag competition covering web exploitation, reverse engineering, and cryptography. Solo or teams of up to four.",
        "event_type": "hackathon", "field": "Cybersecurity",
        "location": "San Diego, CA", "latitude": 32.7157, "longitude": -117.1611,
        "url": "https://example.com/socal-ctf", "deadline": "2026-07-20",
        "start_date": "2026-08-01", "prize": "$10,000",
        "tags": ["security", "ctf", "cryptography"], "source": "seed",
    },
    {
        "title": "NYC Web3 Builders Summit",
        "description": "Two-day conference on decentralized apps, smart contracts, and on-chain identity. Talks, workshops, and a demo night.",
        "event_type": "conference", "field": "Web3",
        "location": "New York, NY", "latitude": 40.7128, "longitude": -74.0060,
        "url": "https://example.com/web3-summit", "deadline": None,
        "start_date": "2026-10-12", "prize": None,
        "tags": ["web3", "blockchain", "ethereum"], "source": "seed",
    },
    {
        "title": "Austin Frontend Meetup: React & Beyond",
        "description": "Monthly meetup for frontend engineers. This month: React Server Components, performance, and a lightning-talk open mic.",
        "event_type": "meetup", "field": "Web Development",
        "location": "Austin, TX", "latitude": 30.2672, "longitude": -97.7431,
        "url": "https://example.com/atx-frontend", "deadline": None,
        "start_date": "2026-07-18", "prize": None,
        "tags": ["react", "frontend", "javascript"], "source": "seed",
    },
    {
        "title": "Seattle Mobile Dev Workshop",
        "description": "Hands-on workshop building a cross-platform app with Flutter. Bring a laptop; no prior mobile experience required.",
        "event_type": "workshop", "field": "Mobile",
        "location": "Seattle, WA", "latitude": 47.6062, "longitude": -122.3321,
        "url": "https://example.com/seattle-mobile", "deadline": "2026-06-30",
        "start_date": "2026-07-10", "prize": None,
        "tags": ["mobile", "flutter", "dart"], "source": "seed",
    },
    {
        "title": "Boston HealthTech Hackathon",
        "description": "Build software for healthcare and life sciences. Partnered with local hospitals; access to de-identified datasets.",
        "event_type": "hackathon", "field": "Social Impact",
        "location": "Boston, MA", "latitude": 42.3601, "longitude": -71.0589,
        "url": "https://example.com/boston-healthtech", "deadline": "2026-09-01",
        "start_date": "2026-09-20", "prize": "$15,000",
        "tags": ["health", "social impact", "data"], "source": "seed",
    },
    {
        "title": "LA GameDev Jam",
        "description": "Weekend game jam with a surprise theme. Artists, designers, and engineers welcome. Showcase your build on Sunday.",
        "event_type": "hackathon", "field": "General Tech",
        "location": "Los Angeles, CA", "latitude": 34.0522, "longitude": -118.2437,
        "url": "https://example.com/la-gamedev", "deadline": None,
        "start_date": "2026-08-22", "prize": "$5,000",
        "tags": ["gamedev", "unity", "design"], "source": "seed",
    },
    {
        "title": "Chicago Data Science Conference",
        "description": "Talks on ML in production, MLOps, and responsible AI. Networking lunch and a hands-on feature-engineering workshop.",
        "event_type": "conference", "field": "AI/ML",
        "location": "Chicago, IL", "latitude": 41.8781, "longitude": -87.6298,
        "url": "https://example.com/chicago-ds", "deadline": None,
        "start_date": "2026-11-03", "prize": None,
        "tags": ["data science", "ml", "mlops"], "source": "seed",
    },
    {
        "title": "London Open Source Summit",
        "description": "Celebrating open-source software with maintainer panels, contribution sprints, and a first-time contributor workshop.",
        "event_type": "conference", "field": "General Tech",
        "location": "London, UK", "latitude": 51.5074, "longitude": -0.1278,
        "url": "https://example.com/london-oss", "deadline": None,
        "start_date": "2026-10-25", "prize": None,
        "tags": ["open source", "community", "oss"], "source": "seed",
    },
    {
        "title": "Toronto AI for Climate Hackathon",
        "description": "Use machine learning to tackle climate challenges — emissions tracking, energy optimization, and disaster response.",
        "event_type": "hackathon", "field": "Social Impact",
        "location": "Toronto, ON", "latitude": 43.6532, "longitude": -79.3832,
        "url": "https://example.com/toronto-climate", "deadline": "2026-08-10",
        "start_date": "2026-09-14", "prize": "$20,000",
        "tags": ["ai", "climate", "social impact"], "source": "seed",
    },
    {
        "title": "Global Remote AI Agents Hackathon",
        "description": "Fully online hackathon to build autonomous agents and tool-using LLM apps. Open worldwide; async judging.",
        "event_type": "hackathon", "field": "AI/ML",
        "location": "Remote", "latitude": None, "longitude": None,
        "url": "https://example.com/remote-agents", "deadline": "2026-07-31",
        "start_date": "2026-08-08", "prize": "$30,000",
        "tags": ["ai", "agents", "llm", "remote"], "source": "seed",
    },
    {
        "title": "Remote Web3 DeFi Build Week",
        "description": "Week-long online build sprint focused on DeFi protocols and on-chain tooling. Daily office hours with mentors.",
        "event_type": "hackathon", "field": "Web3",
        "location": "Remote", "latitude": None, "longitude": None,
        "url": "https://example.com/remote-defi", "deadline": "2026-09-05",
        "start_date": "2026-09-15", "prize": "$18,000",
        "tags": ["web3", "defi", "solidity", "remote"], "source": "seed",
    },
    {
        "title": "Intro to Cybersecurity (Online Workshop)",
        "description": "Beginner workshop covering threat modeling, secure coding, and common web vulnerabilities. Recorded for later viewing.",
        "event_type": "workshop", "field": "Cybersecurity",
        "location": "Remote", "latitude": None, "longitude": None,
        "url": "https://example.com/intro-cyber", "deadline": None,
        "start_date": "2026-07-12", "prize": None,
        "tags": ["security", "beginner", "remote"], "source": "seed",
    },
    {
        "title": "Open Source Maintainers Meetup (Virtual)",
        "description": "Casual virtual meetup for maintainers and contributors to swap tips on governance, CI, and growing a community.",
        "event_type": "meetup", "field": "General Tech",
        "location": "Remote", "latitude": None, "longitude": None,
        "url": "https://example.com/oss-maintainers", "deadline": None,
        "start_date": "2026-07-28", "prize": None,
        "tags": ["open source", "community", "remote"], "source": "seed",
    },
    {
        "title": "Remote Frontend Performance Workshop",
        "description": "Deep-dive into Core Web Vitals, bundle analysis, and rendering strategies. Live coding plus a Q&A.",
        "event_type": "workshop", "field": "Web Development",
        "location": "Remote", "latitude": None, "longitude": None,
        "url": "https://example.com/remote-frontend-perf", "deadline": None,
        "start_date": "2026-08-05", "prize": None,
        "tags": ["frontend", "performance", "web", "remote"], "source": "seed",
    },
]


def seed_initial_events(db) -> int:
    """Insert the deterministic seed events if the table is empty.
    Returns the number of events inserted (0 if it was already populated)."""
    from backend.db.models import Event

    if db.query(Event).count() > 0:
        return 0
    for event in SEED_EVENTS:
        db.add(Event(**event))
    db.commit()
    return len(SEED_EVENTS)
