from typing import List
from backend.db.models import User, Event

# Maps user-facing interest labels to keywords found in event fields/tags/descriptions
INTEREST_KEYWORDS = {
    "ai/ml":           ["ai", "ml", "machine learning", "deep learning", "neural", "llm",
                        "artificial intelligence", "nlp", "computer vision", "data science",
                        "generative", "transformer", "gpt"],
    "web3":            ["web3", "blockchain", "crypto", "defi", "nft", "solidity", "ethereum",
                        "smart contract", "dao", "decentralized", "polygon", "bitcoin"],
    "cybersecurity":   ["security", "cyber", "ctf", "hacking", "infosec", "penetration",
                        "vulnerability", "cryptography", "privacy", "forensics"],
    "web development": ["web", "frontend", "backend", "fullstack", "full-stack", "react",
                        "node", "javascript", "html", "css", "api", "rest"],
    "mobile":          ["mobile", "ios", "android", "flutter", "react native", "swift",
                        "kotlin", "app development"],
    "general tech":    ["tech", "technology", "software", "engineering", "programming",
                        "coding", "open innovation", "hardware", "iot"],
    "social impact":   ["social", "impact", "nonprofit", "health", "education", "climate",
                        "sustainability", "accessibility", "humanitarian", "community"],
    "open source":     ["open source", "opensource", "oss", "github", "community",
                        "contributor", "foss"],
}

# Maps skill names to keywords that might appear in event descriptions/tags
SKILL_ALIASES = {
    "python":     ["python", "django", "flask", "fastapi", "pytorch", "tensorflow", "pandas"],
    "javascript": ["javascript", "js", "node", "react", "vue", "angular", "typescript"],
    "react":      ["react", "reactjs", "frontend", "web development"],
    "node.js":    ["node", "nodejs", "express", "backend"],
    "solidity":   ["solidity", "ethereum", "smart contract", "web3", "blockchain"],
    "rust":       ["rust", "webassembly", "wasm", "systems"],
    "go":         ["go", "golang", "backend", "microservices"],
    "java":       ["java", "spring", "android", "backend"],
    "c++":        ["c++", "cpp", "systems", "game dev", "embedded"],
    "typescript": ["typescript", "ts", "javascript", "react", "angular"],
    "tensorflow": ["tensorflow", "machine learning", "ai", "deep learning", "ml"],
    "pytorch":    ["pytorch", "machine learning", "ai", "deep learning", "ml"],
}

# Maps a skill to the event field(s) it implies. Lets us rank events by field
# relevance even when a user hasn't picked explicit interests — this is the main
# driver of score *variation* across events of the same type.
SKILL_FIELDS = {
    "python":       ["AI/ML", "Web Development", "General Tech"],
    "tensorflow":   ["AI/ML"], "pytorch": ["AI/ML"], "keras": ["AI/ML"],
    "scikit-learn": ["AI/ML"], "pandas": ["AI/ML"], "numpy": ["AI/ML"],
    "machine learning": ["AI/ML"], "deep learning": ["AI/ML"], "nlp": ["AI/ML"],
    "javascript":   ["Web Development"], "typescript": ["Web Development"],
    "react":        ["Web Development"], "vue": ["Web Development"], "angular": ["Web Development"],
    "node.js":      ["Web Development"], "node": ["Web Development"], "next.js": ["Web Development"],
    "html":         ["Web Development"], "css": ["Web Development"],
    "solidity":     ["Web3"], "ethereum": ["Web3"], "web3": ["Web3"], "blockchain": ["Web3"],
    "rust":         ["Web3", "General Tech"],
    "swift":        ["Mobile"], "kotlin": ["Mobile"], "flutter": ["Mobile"],
    "react native": ["Mobile"], "android": ["Mobile"], "ios": ["Mobile"],
    "go":           ["General Tech", "Web Development"], "java": ["Mobile", "General Tech"],
    "c++":          ["General Tech"], "c": ["General Tech"], "c#": ["General Tech"],
    "security":     ["Cybersecurity"], "cryptography": ["Cybersecurity"],
}

INTEREST_FIELDS = {
    "ai/ml": ["AI/ML"], "web3": ["Web3"], "cybersecurity": ["Cybersecurity"],
    "web development": ["Web Development"], "mobile": ["Mobile"],
    "general tech": ["General Tech"], "social impact": ["Social Impact"],
    "open source": ["General Tech"],
}


def _event_text(event: Event) -> str:
    parts = [
        event.field or "",
        event.event_type or "",
        " ".join(event.tags or []),
        (event.title or ""),
        (event.description or "")[:300],  # limit description to avoid noise
    ]
    return " ".join(parts).lower()


def _inferred_fields(user_skills: List[str], user_interests: List[str]) -> set:
    fields = set()
    for s in user_skills:
        fields.update(SKILL_FIELDS.get(s, []))
    for i in user_interests:
        fields.update(INTEREST_FIELDS.get(i, []))
    return {f.lower() for f in fields}


def score_event_for_user(user: User, event: Event) -> float:
    """Score an event 0–100 for a user from real signal overlap:

    - skill keywords found in the event's tags/field/title/description (varies
      per event because events have different content),
    - field affinity: does the event's field align with the fields implied by
      the user's skills/interests,
    - explicit interest keyword overlap,
    - event-type preference.
    """
    user_skills    = [s.lower() for s in (user.skills or [])]
    user_interests = [i.lower() for i in (user.interests or [])]
    user_types     = [t.lower() for t in (user.event_types or [])]

    # No preferences at all → nothing to personalize on. Give a small, equal base
    # so "My Matches" isn't empty, but it can't outrank a genuine match.
    if not (user_skills or user_interests or user_types):
        return 20.0

    event_text  = _event_text(event)
    event_type  = (event.event_type or "").lower()
    event_field = (event.field or "").lower()

    score = 0.0

    # ── Skill keyword overlap (0–40) ────────────────────────────
    if user_skills:
        hits = sum(
            1 for s in user_skills
            if any(kw in event_text for kw in SKILL_ALIASES.get(s, [s]))
        )
        score += min(40, hits * 13)

    # ── Field affinity (0–30) ───────────────────────────────────
    inferred = _inferred_fields(user_skills, user_interests)
    if event_field and event_field in inferred:
        score += 30

    # ── Interest keyword overlap (0–15) ─────────────────────────
    if user_interests and any(
        kw in event_text
        for i in user_interests
        for kw in INTEREST_KEYWORDS.get(i, [i])
    ):
        score += 15

    # ── Event-type preference (0–15) ────────────────────────────
    if user_types and event_type in user_types:
        score += 15

    return round(min(score, 100.0), 1)


def match_events(user: User, events: List[Event], limit: int = 50) -> List[dict]:
    """Return events for a user, each with a real 0–100 match_score, sorted by
    descending relevance. Events with zero overlap are dropped; if nothing
    overlaps at all, fall back to returning everything (still ranked) so the
    page isn't empty."""
    scored = []
    for event in events:
        scored.append({
            "id":          event.id,
            "title":       event.title,
            "description": event.description,
            "event_type":  event.event_type,
            "field":       event.field,
            "location":    event.location,
            "latitude":    event.latitude,
            "longitude":   event.longitude,
            "url":         event.url,
            "deadline":    event.deadline,
            "start_date":  event.start_date,
            "prize":       event.prize,
            "tags":        event.tags,
            "source":      event.source,
            "match_score": score_event_for_user(user, event),
        })

    scored.sort(key=lambda e: e["match_score"], reverse=True)
    relevant = [e for e in scored if e["match_score"] > 0]
    return (relevant or scored)[:limit]
