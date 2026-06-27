from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from backend.config import settings

# Render/Heroku hand out `postgres://` URLs, but SQLAlchemy 2.x only accepts
# the `postgresql://` scheme — normalize it so production boots.
_database_url = settings.database_url
if _database_url.startswith("postgres://"):
    _database_url = _database_url.replace("postgres://", "postgresql://", 1)

# `check_same_thread` is a SQLite-only connect arg. Passing it to Postgres
# (psycopg2) on production crashes engine creation, so only set it for SQLite.
_connect_args = (
    {"check_same_thread": False}
    if _database_url.startswith("sqlite")
    else {}
)
engine = create_engine(_database_url, connect_args=_connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ── User Model ──────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String, unique=True, index=True)
    email           = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)
    github_username = Column(String, nullable=True)
    github_token    = Column(String, nullable=True)
    skills          = Column(JSON, default=list)       # ["Python", "React", ...]
    interests       = Column(JSON, default=list)       # ["AI/ML", "Web3", ...]
    event_types     = Column(JSON, default=list)       # ["hackathon", "meetup", ...]
    created_at      = Column(DateTime, default=datetime.utcnow)

# ── Event Model ─────────────────────────────────────────────
class Event(Base):
    __tablename__ = "events"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String, index=True)
    description = Column(Text)
    event_type  = Column(String)   # hackathon, conference, meetup, workshop
    field       = Column(String)   # AI/ML, Web3, Cybersecurity, etc.
    location    = Column(String)   # "Remote" or city name
    latitude    = Column(Float, nullable=True)   # geocoded from `location` (Google Maps)
    longitude   = Column(Float, nullable=True)   # used for "search by area" radius search
    url         = Column(String)
    deadline    = Column(String, nullable=True)
    start_date  = Column(String, nullable=True)
    end_date    = Column(String, nullable=True)
    prize       = Column(String, nullable=True)
    tags        = Column(JSON, default=list)
    source      = Column(String)   # devpost, mlh, eventbrite, etc.
    embedding   = Column(JSON, nullable=True)   # stored as list of floats
    created_at  = Column(DateTime, default=datetime.utcnow)

# ── Saved Event Model ────────────────────────────────────────
class SavedEvent(Base):
    __tablename__ = "saved_events"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, index=True)
    event_id   = Column(Integer, index=True)
    saved_at   = Column(DateTime, default=datetime.utcnow)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)