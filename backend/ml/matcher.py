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


def _event_text(event: Event) -> str:
    parts = [
        event.field or "",
        event.event_type or "",
        " ".join(event.tags or []),
        (event.title or ""),
        (event.description or "")[:300],  # limit description to avoid noise
    ]
    return " ".join(parts).lower()


def score_event_for_user(user: User, event: Event) -> float:
    """
    Score an event for a user based on:
    - Skill match (do their skills match event tags/description?)
    - Interest match (does event field/tags match user interests?)
    - Event type preference
    """
    user_skills    = [s.lower() for s in (user.skills or [])]
    user_interests = [i.lower() for i in (user.interests or [])]
    user_types     = [t.lower() for t in (user.event_types or [])]

    # If user has no preferences at all, return a neutral score
    if not user_skills and not user_interests and not user_types:
        return 30.0

    event_text = _event_text(event)
    event_type = (event.event_type or "").lower()
    score = 0.0

    # ── Skill match — up to 40 pts ──────────────────────────────
    if user_skills:
        matched = 0
        for skill in user_skills:
            aliases = SKILL_ALIASES.get(skill, [skill])
            if any(kw in event_text for kw in aliases):
                matched += 1
        score += (matched / len(user_skills)) * 40

    # ── Interest match — up to 40 pts ───────────────────────────
    if user_interests:
        for interest in user_interests:
            keywords = INTEREST_KEYWORDS.get(interest, [interest])
            if any(kw in event_text for kw in keywords):
                score += 40
                break

    # ── Event type preference — up to 20 pts ────────────────────
    if user_types and event_type in user_types:
        score += 20

    return round(score, 2)


def match_events(user: User, events: List[Event], limit: int = 50) -> List[dict]:
    """Return top matching events for a user with scores"""
    scored = []
    for event in events:
        score = score_event_for_user(user, event)
        scored.append({
            "id":          event.id,
            "title":       event.title,
            "type":        event.event_type,
            "field":       event.field,
            "location":    event.location,
            "deadline":    event.deadline,
            "prize":       event.prize,
            "url":         event.url,
            "tags":        event.tags,
            "match_score": score,
        })

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    # Only return events with an actual match; apply limit after filtering
    matched = [e for e in scored if e["match_score"] > 0]
    return matched[:limit]
