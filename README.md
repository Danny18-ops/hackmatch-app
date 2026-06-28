# HackMatch

AI-powered hackathon & tech-event discovery. FastAPI backend (SQLAlchemy +
ChromaDB RAG with Claude) and a React frontend.

## Features
- 🤖 **AI Search** — natural-language event search via a RAG pipeline (Claude).
- ⚡ **Smart matching** — ranks events against your skills/interests.
- 📍 **Search by Area** — find in-person events near a city, on a free OpenStreetMap (Leaflet) map — no API key.
- 💬 **AI assistant** — always-available chat bubble to find events / ask how the app works.
- 🐙 GitHub skill detection, saved events, live Devpost scraping.

## Backend setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then fill in your keys
uvicorn backend.main:app --reload --port 8000
```

Key env vars (see [.env.example](.env.example)):
- `ANTHROPIC_API_KEY` — required for AI search and the chat assistant.
- `DATABASE_URL` — SQLite by default; a Postgres URL in production.
- "Search by Area" uses free OpenStreetMap (Leaflet + Nominatim) — **no map API key**.

Populate events, then geocode them for area search:

```bash
curl -X POST http://127.0.0.1:8000/api/scrape    # scrape live Devpost events
curl -X POST http://127.0.0.1:8000/api/events/geocode   # backfill lat/lng (free Nominatim)
```

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env          # set REACT_APP_API_URL
npm start
```

**Search by Area** uses a free Leaflet + OpenStreetMap map with Nominatim
geocoding — no key, no billing. Type a city and it centers the map and lists
real events within the chosen radius.

## Search-by-area API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/events/nearby?lat=&lng=&radius_km=` | Events within a radius, nearest first |
| `POST` | `/api/events/geocode` | Backfill lat/lng for existing events |
| `GET` | `/api/search/geocode?q=<city>` | Resolve an area name → coordinates |
