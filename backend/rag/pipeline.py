import anthropic
from backend.config import settings
from typing import List
import json

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

def build_context(events) -> str:
    """Convert events into text context for the LLM"""
    context_parts = []
    for i, event in enumerate(events[:15]):  # Top 15 events as context
        context_parts.append(
            f"Event {i+1}:\n"
            f"  Title: {event.title}\n"
            f"  Type: {event.event_type}\n"
            f"  Field: {event.field}\n"
            f"  Location: {event.location}\n"
            f"  Deadline: {event.deadline or 'Not specified'}\n"
            f"  Prize: {event.prize or 'Not specified'}\n"
            f"  Tags: {', '.join(event.tags) if event.tags else 'None'}\n"
            f"  URL: {event.url}\n"
            f"  Description: {event.description[:200]}...\n"
        )
    return "\n".join(context_parts)

def simple_filter(query: str, events) -> list:
    """Filter events based on keywords in query"""
    query_lower = query.lower()
    keywords = query_lower.split()
    
    scored_events = []
    for event in events:
        score = 0
        searchable = f"{event.title} {event.description} {event.field} {event.event_type} {event.location} {' '.join(event.tags or [])}".lower()
        for keyword in keywords:
            if keyword in searchable:
                score += 1
        if score > 0:
            scored_events.append((score, event))
    
    scored_events.sort(key=lambda x: x[0], reverse=True)
    return [e for _, e in scored_events[:15]]

async def rag_search(query: str, all_events: list) -> dict:
    """
    RAG Pipeline:
    1. RETRIEVE — filter relevant events based on query
    2. AUGMENT  — build a context prompt with those events
    3. GENERATE — ask Claude to answer using that context
    """
    # Step 1: RETRIEVE
    relevant_events = simple_filter(query, all_events)
    if not relevant_events:
        relevant_events = all_events[:10]  # fallback to first 10

    # Step 2: AUGMENT
    context = build_context(relevant_events)
    
    prompt = f"""You are HackMatch, an AI assistant that helps people find the perfect hackathons, 
conferences, meetups, and tech events based on their interests and skills.

Here are the available events in our database:

{context}

User Query: {query}

Based on the events above, provide a helpful, conversational response that:
1. Recommends the most relevant events for the user's query
2. Explains WHY each event is a good match
3. Mentions key details like deadlines, prizes, and location
4. Is encouraging and enthusiastic

If no events match well, suggest what types of events the user should look for.
Keep your response concise and friendly."""

    # Step 3: GENERATE
    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    
    answer = message.content[0].text
    
    # Format matched events for frontend
    events_data = []
    for event in relevant_events[:5]:
        events_data.append({
            "id": event.id,
            "title": event.title,
            "type": event.event_type,
            "field": event.field,
            "location": event.location,
            "deadline": event.deadline,
            "prize": event.prize,
            "url": event.url,
            "tags": event.tags
        })
    
    return {
        "query": query,
        "answer": answer,
        "events": events_data
    }