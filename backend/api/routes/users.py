from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.models import get_db, User
from pydantic import BaseModel
from typing import List, Optional
import requests

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    email: str
    password: Optional[str] = None

class UserUpdate(BaseModel):
    skills: Optional[List[str]] = []
    interests: Optional[List[str]] = []
    event_types: Optional[List[str]] = []
    github_username: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    github_username: Optional[str]
    skills: List[str]
    interests: List[str]
    event_types: List[str]

    class Config:
        from_attributes = True

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_email = db.query(User).filter(
        User.email == user.email
    ).first()
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="This email is already registered. Please sign in instead."
        )

    existing_username = db.query(User).filter(
        User.username == user.username
    ).first()
    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="This username is already taken. Please choose another."
        )

    new_user = User(
        username=user.username,
        email=user.email,
        skills=[],
        interests=[],
        event_types=[]
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/username/{username}")
def get_user_by_username(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.username == username
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}/preferences", response_model=UserResponse)
def update_preferences(
    user_id: int,
    prefs: UserUpdate,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.skills      = prefs.skills
    user.interests   = prefs.interests
    user.event_types = prefs.event_types
    if prefs.github_username:
        user.github_username = prefs.github_username

    db.commit()
    db.refresh(user)
    return user

@router.get("/{user_id}/github-skills")
def fetch_github_skills(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.github_username:
        raise HTTPException(
            status_code=404,
            detail="GitHub username not set"
        )

    response = requests.get(
        f"https://api.github.com/users/{user.github_username}/repos",
        headers={"Accept": "application/vnd.github.v3+json"}
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail="Could not fetch GitHub data. Check the username."
        )

    repos = response.json()
    languages = set()
    for repo in repos:
        if repo.get("language"):
            languages.add(repo["language"])

    user.skills = list(languages)
    db.commit()
    db.refresh(user)

    return {
        "github_username": user.github_username,
        "detected_skills": list(languages),
        "repos_analyzed": len(repos)
    }