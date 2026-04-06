from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.db.models import init_db
from backend.api.routes import events, users, search

app = FastAPI(
    title="HackMatch API",
    description="AI-powered hackathon & tech event discovery engine",
    version="1.0.0"
)

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(users.router,  prefix="/api/users",  tags=["Users"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])

@app.on_event("startup")
def startup():
    init_db()
    print("✅ HackMatch API is running!")

@app.get("/")
def root():
    return {"message": "Welcome to HackMatch API 🚀"}