import requests
import re
from sqlalchemy.orm import Session
from backend.db.models import Event, SessionLocal
import time


def detect_field(tags: list, title: str) -> str:
    """Detect field from tags and title"""
    text = ' '.join(tags + [title]).lower()

    if any(w in text for w in ['ai', 'ml', 'machine learning', 'deep learning', 'llm', 'gpt', 'neural', 'chatbot']):
        return 'AI/ML'
    elif any(w in text for w in ['blockchain', 'web3', 'crypto', 'ethereum', 'solana', 'defi', 'nft']):
        return 'Web3'
    elif any(w in text for w in ['security', 'cyber', 'hack', 'ctf', 'privacy', 'infosec']):
        return 'Cybersecurity'
    elif any(w in text for w in ['mobile', 'ios', 'android', 'swift', 'flutter', 'kotlin']):
        return 'Mobile'
    elif any(w in text for w in ['react', 'frontend', 'web', 'javascript', 'css', 'html', 'nextjs']):
        return 'Web Development'
    elif any(w in text for w in ['social', 'health', 'education', 'environment', 'impact', 'good']):
        return 'Social Impact'
    else:
        return 'General Tech'


def generate_description(field: str, title: str, tags: list) -> str:
    """Generate a meaningful description when none is provided"""
    tag_str = ', '.join(tags[:3]) if tags else 'technology'

    descriptions = {
        'AI/ML': f"An exciting AI and machine learning hackathon where participants build intelligent solutions using cutting-edge technologies like {tag_str}. Open to developers of all skill levels.",
        'Web3': f"A blockchain and Web3 hackathon focused on building decentralized applications using {tag_str}. Great opportunity to explore the future of the internet.",
        'Cybersecurity': f"A cybersecurity challenge where participants tackle real-world security problems involving {tag_str}. Test your skills in a competitive environment.",
        'Mobile': f"A mobile development hackathon focused on building innovative apps using {tag_str}. Create solutions that impact millions of users.",
        'Web Development': f"A web development hackathon where teams build creative web applications using {tag_str}. Perfect for frontend and full-stack developers.",
        'Social Impact': f"A hackathon focused on using technology for social good. Build solutions involving {tag_str} that make a real difference in the world.",
        'General Tech': f"A hackathon open to all tech enthusiasts. Build innovative projects using {tag_str} and compete with developers from around the world.",
    }

    return descriptions.get(field, descriptions['General Tech'])


def scrape_devpost(max_pages: int = 5):
    """Scrape real live hackathons from Devpost API"""
    events = []

    for page in range(1, max_pages + 1):
        try:
            url = f"https://devpost.com/api/hackathons?status=open&page={page}"
            headers = {"User-Agent": "Mozilla/5.0"}
            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code != 200:
                print(f"Failed page {page}: {response.status_code}")
                break

            data = response.json()
            hackathons = data.get('hackathons', [])

            if not hackathons:
                print(f"No more hackathons at page {page}")
                break

            for h in hackathons:
                try:
                    # Prize
                    prize = None
                    if h.get('prize_amount'):
                        try:
                            raw = str(h['prize_amount'])
                            clean = re.sub(r'<[^>]+>', '', raw).strip().replace(',', '')
                            amount = int(float(clean))
                            if amount > 0:
                                prize = f"${amount:,}"
                        except:
                            prize = None

                    # Tags
                    themes = h.get('themes', [])
                    tags = [t['name'] for t in themes if t.get('name')]
                    if not tags:
                        tags = ['hackathon', 'coding', 'tech']

                    # Field
                    field = detect_field(tags, h.get('title', ''))

                    # Location
                    location = 'Remote'
                    if h.get('location'):
                        location = h['location']

                    # Deadline
                    deadline = None
                    if h.get('submission_period_dates'):
                        deadline = h['submission_period_dates']

                    # Description — use tagline if available, otherwise generate one
                    tagline = h.get('tagline', '').strip()
                    if tagline and len(tagline) > 20:
                        description = tagline
                    else:
                        description = generate_description(field, h.get('title', ''), tags)

                    events.append({
                        "title":       h.get('title', 'Untitled'),
                        "description": description,
                        "event_type":  "hackathon",
                        "field":       field,
                        "location":    location,
                        "url":         h.get('url', 'https://devpost.com'),
                        "deadline":    deadline,
                        "start_date":  None,
                        "prize":       prize,
                        "tags":        tags[:8],
                        "source":      "devpost"
                    })

                except Exception as e:
                    print(f"Error parsing hackathon: {e}")
                    continue

            print(f"✅ Page {page}: fetched {len(hackathons)} hackathons")
            time.sleep(1)

        except Exception as e:
            print(f"Error on page {page}: {e}")
            break

    return events


if __name__ == "__main__":
    db: Session = SessionLocal()
    try:
        print("🌐 Fetching live events from Devpost...")
        events = scrape_devpost(max_pages=5)
        added = 0
        for e in events:
            exists = db.query(Event).filter(Event.title == e['title']).first()
            if not exists:
                db.add(Event(**e))
                added += 1
        db.commit()
        total = db.query(Event).count()
        print(f"✅ Added {added} live events!")
        print(f"🎉 Total in database: {total}")
    except Exception as ex:
        print(f"❌ Error: {ex}")
        db.rollback()
    finally:
        db.close()