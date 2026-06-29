"""Authentication: email/password (JWT) + OAuth (Google, GitHub, Facebook).

Password flow: /register, /login, /me.
OAuth flow:    /{provider}/login -> provider -> /{provider}/callback
               -> find-or-create user -> issue our JWT -> redirect to
               FRONTEND_URL/profile?token=...

Welcome email on first account creation (password or OAuth); sign-in
notification on every successful login.
"""
from typing import Optional

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.config import settings
from backend.db.models import get_db, User
from backend.services.email import (
    send_signin_email, send_welcome_email,
    notify_admin_new_user, notify_admin_signin,
)
from backend.services.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter()

# ── Schemas ──────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str  # username OR email
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    github_username: Optional[str] = None
    skills: list = []
    interests: list = []
    event_types: list = []

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


def _issue(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.id),
        user=UserOut.model_validate(user),
    )


# ── Email / password ─────────────────────────────────────────
@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "This email is already registered. Please sign in.")
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(400, "This username is taken. Please choose another.")

    user = User(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
        skills=[], interests=[], event_types=[],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    send_welcome_email(user.email, user.username)
    notify_admin_new_user(user.username, user.email, "email/password")
    return _issue(user)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == req.username) | (User.email == req.username)
    ).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(401, "Invalid username/email or password.")
    send_signin_email(user.email, user.username)
    notify_admin_signin(user.username, user.email, "email/password")
    return _issue(user)


@router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)):
    return current


# ── OAuth ────────────────────────────────────────────────────
oauth = OAuth()

if settings.google_client_id:
    oauth.register(
        name="google",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )
if settings.github_client_id:
    oauth.register(
        name="github",
        client_id=settings.github_client_id,
        client_secret=settings.github_client_secret,
        access_token_url="https://github.com/login/oauth/access_token",
        authorize_url="https://github.com/login/oauth/authorize",
        api_base_url="https://api.github.com/",
        client_kwargs={"scope": "read:user user:email"},
    )
if settings.facebook_client_id:
    oauth.register(
        name="facebook",
        client_id=settings.facebook_client_id,
        client_secret=settings.facebook_client_secret,
        access_token_url="https://graph.facebook.com/v18.0/oauth/access_token",
        authorize_url="https://www.facebook.com/v18.0/dialog/oauth",
        api_base_url="https://graph.facebook.com/v18.0/",
        client_kwargs={"scope": "email public_profile"},
    )

SUPPORTED_PROVIDERS = {"google", "github", "facebook"}


def _unique_username(db: Session, base: str) -> str:
    base = "".join(c for c in (base or "").lower().replace(" ", "") if c.isalnum()) or "user"
    username, i = base, 1
    while db.query(User).filter(User.username == username).first():
        i += 1
        username = f"{base}{i}"
    return username


async def _fetch_identity(provider: str, client, token) -> tuple[Optional[str], Optional[str]]:
    """Return (email, display_name) from the provider."""
    if provider == "google":
        info = token.get("userinfo")
        if not info:
            info = (await client.userinfo(token=token))
        return info.get("email"), info.get("name")

    if provider == "github":
        profile = (await client.get("user", token=token)).json()
        email = profile.get("email")
        if not email:
            emails = (await client.get("user/emails", token=token)).json()
            primary = next((e for e in emails if e.get("primary")), (emails or [{}])[0])
            email = primary.get("email")
        return email, profile.get("name") or profile.get("login")

    if provider == "facebook":
        profile = (await client.get("me?fields=id,name,email", token=token)).json()
        return profile.get("email"), profile.get("name")

    return None, None


@router.get("/{provider}/login")
async def oauth_login(provider: str, request: Request):
    if provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(404, "Unknown OAuth provider")
    client = oauth.create_client(provider)
    if client is None:
        raise HTTPException(400, f"{provider.title()} sign-in is not configured on the server.")
    redirect_uri = f"{settings.backend_url}/api/auth/{provider}/callback"
    return await client.authorize_redirect(request, redirect_uri)


@router.get("/{provider}/callback")
async def oauth_callback(provider: str, request: Request, db: Session = Depends(get_db)):
    if provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(404, "Unknown OAuth provider")
    client = oauth.create_client(provider)
    if client is None:
        raise HTTPException(400, f"{provider.title()} sign-in is not configured on the server.")

    try:
        token = await client.authorize_access_token(request)
        email, name = await _fetch_identity(provider, client, token)
    except Exception as ex:
        return RedirectResponse(f"{settings.frontend_url}/profile?error=oauth_failed")

    if not email:
        return RedirectResponse(f"{settings.frontend_url}/profile?error=no_email")

    user = db.query(User).filter(User.email == email).first()
    created = False
    if not user:
        user = User(
            username=_unique_username(db, name or email.split("@")[0]),
            email=email,
            skills=[], interests=[], event_types=[],
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        created = True

    if created:
        send_welcome_email(user.email, user.username)
        notify_admin_new_user(user.username, user.email, provider)
    else:
        send_signin_email(user.email, user.username)
        notify_admin_signin(user.username, user.email, provider)

    jwt_token = create_access_token(user.id)
    return RedirectResponse(f"{settings.frontend_url}/profile?token={jwt_token}")
