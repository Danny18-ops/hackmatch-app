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

### Render (backend)

**Core**
| Var | Value |
|---|---|
| `DATABASE_URL` | Postgres internal URL (or wired via the blueprint) |
| `SECRET_KEY` | any long random string (also signs JWTs + OAuth session cookie) |
| `ANTHROPIC_API_KEY` | AI search + chat assistant (optional — falls back to keyword search if unset) |

> "Search by Area" now uses free OpenStreetMap (Leaflet map + Nominatim
> geocoding) — **no Google Maps key or billing required** anywhere.

**Auth — URLs (required for OAuth redirects)**
| Var | Value |
|---|---|
| `BACKEND_URL` | `https://hackmatch-app.onrender.com` (builds the OAuth callback URL) |
| `FRONTEND_URL` | `https://hackmatch.dnyaneshwariraut.com` (where callback redirects with `?token=`) |

**Auth — OAuth providers** (set the pair for each provider you enable; unset providers are simply hidden/disabled)
| Var | Where to get it |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 Client. Authorized redirect URI: `https://hackmatch-app.onrender.com/api/auth/google/callback` |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub → Settings → Developer settings → OAuth Apps. Callback URL: `https://hackmatch-app.onrender.com/api/auth/github/callback` |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | Meta for Developers → App → Facebook Login. Redirect URI: `https://hackmatch-app.onrender.com/api/auth/facebook/callback` |

**Email (transactional, via Resend)**
| Var | Value |
|---|---|
| `RESEND_API_KEY` | Resend dashboard API key (unset → emails are logged, not sent) |
| `EMAIL_FROM` | e.g. `HackMatch <noreply@yourdomain.com>` (must be a Resend-verified domain; defaults to `onboarding@resend.dev` for testing) |

> Each OAuth callback URL above must be registered **exactly** in that provider's
> console, using your real `BACKEND_URL`.

### Vercel (frontend) → Settings → Environment Variables, then redeploy
| Var | Value |
|---|---|
| `REACT_APP_API_URL` | `https://hackmatch-app.onrender.com` (also builds the OAuth button links) |

> CRA bakes `REACT_APP_*` in **at build time** — after changing them you must
> **redeploy** the Vercel project for it to take effect.

---

## ⚠️ Free-tier memory note
AI search loads `sentence-transformers` + `torch` + `chromadb`, which can exceed
Render free's **512 MB RAM** and crash that endpoint (event listing and area
search are unaffected). If AI search 500s in production, upgrade the Render
instance or move embeddings to a hosted vector DB.
