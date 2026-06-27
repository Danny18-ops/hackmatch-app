from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    app_name: str = "HackMatch"
    debug: bool = True
    
    # Database
    database_url: str = "sqlite:///./hackmatch.db"
    
    # Anthropic
    anthropic_api_key: str = ""

    # Google Maps (geocoding for "search by area")
    google_maps_api_key: str = ""

    # ── OAuth providers ──────────────────────────────────────
    google_client_id: str = ""
    google_client_secret: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""
    facebook_client_id: str = ""
    facebook_client_secret: str = ""

    # Where OAuth callbacks live and where to redirect back to.
    # backend_url builds the {provider}/callback redirect_uri (must match the
    # value registered in each provider console). frontend_url is where the
    # callback redirects with ?token=...
    backend_url: str = "http://127.0.0.1:8000"
    frontend_url: str = "http://localhost:3000"

    # JWT
    secret_key: str = "changethisinproduction"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7   # 7 days

    # ── Transactional email (Resend) ─────────────────────────
    resend_api_key: str = ""
    email_from: str = "HackMatch <onboarding@resend.dev>"

    # Email (legacy Gmail SMTP — unused once Resend is configured)
    mail_username: str = ""
    mail_password: str = ""
    mail_from: str = ""
    mail_server: str = "smtp.gmail.com"
    mail_port: int = 587

    # Frontend API URL
    react_app_api_url: str = "http://127.0.0.1:8000"

    # On startup, auto-scrape events if the database is empty (keeps a fresh
    # deploy from showing a blank site). Set AUTO_SEED=false to disable.
    auto_seed: bool = True

    class Config:
        env_file = ".env"

settings = Settings()