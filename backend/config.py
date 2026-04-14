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
    
    # GitHub OAuth
    github_client_id: str = ""
    github_client_secret: str = ""
    
    # JWT
    secret_key: str = "changethisinproduction"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Email (Gmail SMTP)
    mail_username: str = ""
    mail_password: str = ""
    mail_from: str = ""
    mail_server: str = "smtp.gmail.com"
    mail_port: int = 587
    
    # Frontend API URL
    react_app_api_url: str = "http://127.0.0.1:8000"

    class Config:
        env_file = ".env"

settings = Settings()