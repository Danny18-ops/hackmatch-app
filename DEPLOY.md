# Deploying HackMatch (Vercel + Render)

The site is hosted correctly — frontend on **Vercel**, backend on **Render**.
Two free-tier issues make it *look* broken; here's how to fix both.

> **Don't switch to localhost.** Localhost only works on your own computer — the
> public site would still be down for everyone. The fixes below keep it online.

---

## Problem 1 — Backend sleeps (the "it's not working" symptom)

Render's free tier **spins the server down after ~15 min of inactivity**. The
first visit then waits ~50s for it to wake, and the request fails before then.

**Fix A — keep it awake (free):** create a cron ping at
[cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com):
- URL: `https://hackmatch-app.onrender.com/`
- Interval: every **10 minutes**

**Fix B — already done in code:** the frontend now waits up to 60s, retries
once, and sends a warm-up ping on load, so a cold start usually succeeds
silently instead of erroring.

**Fix C — pay to never sleep:** Render Starter instance (~$7/mo).

---

## Problem 2 — Empty / disappearing data

`/api/events/` currently returns `[]`. Two causes:

1. **Ephemeral SQLite.** If `DATABASE_URL` is unset/SQLite on Render, the DB
   file is wiped on every restart/redeploy. Use **Postgres** so data persists.
2. **Never seeded.** No events were scraped into production.

### Check your current database (you were unsure)
Render dashboard → your service → **Environment** → look for `DATABASE_URL`.
- Missing, or starts with `sqlite:` → ephemeral. Add Postgres (below).
- Starts with `postgres://` / `postgresql://` → already persistent. 

### Add a free, persistent Postgres
**Option 1 — Blueprint (easiest):** Render → **New + → Blueprint** → pick this
repo. [`render.yaml`](render.yaml) creates the web service **and** a free
Postgres, and wires `DATABASE_URL` automatically. Then set the two secret keys
when prompted.

**Option 2 — Manual on your existing service:**
1. Render → **New + → PostgreSQL** (free plan) → create.
2. Copy its **Internal Database URL**.
3. On the web service → **Environment** → set `DATABASE_URL` to that value.

> The backend already normalizes `postgres://` → `postgresql://` and skips the
> SQLite-only connect arg, so Postgres boots cleanly.

### Seeding events
On startup, the backend now **auto-scrapes events if the DB is empty**, so a
fresh Postgres fills itself within a minute of the first boot. To trigger
manually any time:
```bash
curl -X POST https://hackmatch-app.onrender.com/api/scrape          # fetch events
curl -X POST https://hackmatch-app.onrender.com/api/events/geocode  # add map coords
```

---

## Required environment variables

**Render (backend):**
| Var | Value |
|---|---|
| `DATABASE_URL` | Postgres internal URL (or via blueprint) |
| `ANTHROPIC_API_KEY` | for AI search |
| `GOOGLE_MAPS_API_KEY` | for "search by area" geocoding (enable Geocoding API) |
| `SECRET_KEY` | any random string |

**Vercel (frontend) → Settings → Environment Variables, then redeploy:**
| Var | Value |
|---|---|
| `REACT_APP_API_URL` | `https://hackmatch-app.onrender.com` |
| `REACT_APP_GOOGLE_MAPS_API_KEY` | Maps JS + Places key (enable both APIs) |

> CRA bakes `REACT_APP_*` in **at build time** — after changing them you must
> **redeploy** the Vercel project for it to take effect.

---

## ⚠️ Free-tier memory note
AI search loads `sentence-transformers` + `torch` + `chromadb`, which can exceed
Render free's **512 MB RAM** and crash that endpoint (event listing and area
search are unaffected). If AI search 500s in production, upgrade the Render
instance or move embeddings to a hosted vector DB.
