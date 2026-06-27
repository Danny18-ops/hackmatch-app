# HackMatch

AI-powered hackathon & tech-event discovery. FastAPI backend (SQLAlchemy +
ChromaDB RAG with Claude) and a React frontend.

## Features
- 🤖 **AI Search** — natural-language event search via a RAG pipeline (Claude).
- ⚡ **Smart matching** — ranks events against your skills/interests.
- 📍 **Search by Area** — find in-person events near a city, on a Google Map.
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
- `ANTHROPIC_API_KEY` — required for AI search.
- `GOOGLE_MAPS_API_KEY` — required for "search by area" geocoding (enable the
  **Geocoding API** in Google Cloud).
- `DATABASE_URL` — SQLite by default; a Postgres URL in production.

Populate events, then geocode them for area search:

```bash
curl -X POST http://127.0.0.1:8000/api/scrape    # scrape live Devpost events
curl -X POST http://127.0.0.1:8000/api/events/geocode   # backfill lat/lng
```

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env          # set REACT_APP_GOOGLE_MAPS_API_KEY
npm start
```

For the **Search by Area** map + autocomplete, set
`REACT_APP_GOOGLE_MAPS_API_KEY` and enable the **Maps JavaScript API** and
**Places API** in Google Cloud. Without a key you can still search by typing a
city (the backend resolves it via the Geocoding API).

## Search-by-area API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/events/nearby?lat=&lng=&radius_km=` | Events within a radius, nearest first |
| `POST` | `/api/events/geocode` | Backfill lat/lng for existing events |
| `GET` | `/api/search/geocode?q=<city>` | Resolve an area name → coordinates |
