import { useState, useEffect } from 'react';
import { getEvents, matchEvents } from '../api';
import { useLocation } from 'react-router-dom';

const TYPE_COLORS = {
  hackathon:  { bg: '#6366f115', border: '#6366f140', text: '#6366f1' },
  conference: { bg: '#8b5cf615', border: '#8b5cf640', text: '#8b5cf6' },
  meetup:     { bg: '#22c55e15', border: '#22c55e40', text: '#22c55e' },
  workshop:   { bg: '#f59e0b15', border: '#f59e0b40', text: '#f59e0b' },
};

function MatchBadge({ score }) {
  const color = score >= 60 ? '#22c55e' : score >= 30 ? '#f59e0b' : '#6366f1';
  const label = score >= 60 ? 'Great Match' : score >= 30 ? 'Good Match' : 'Match';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.25rem 0.6rem', borderRadius: '999px',
      background: `${color}15`, border: `1px solid ${color}40`,
    }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color }}>{score}%</span>
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color }}>{label}</span>
    </div>
  );
}

function EventCard({ event, matchScore }) {
  const colors = TYPE_COLORS[event.event_type] || TYPE_COLORS.hackathon;
  return (
    <div style={{
      background: 'var(--card)', borderRadius: '16px',
      border: '1px solid var(--border)', padding: '1.5rem',
      display: 'flex', flexDirection: 'column', gap: '0.875rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{
          padding: '0.25rem 0.7rem', borderRadius: '6px',
          fontSize: '0.7rem', fontWeight: 700,
          background: colors.bg, border: `1px solid ${colors.border}`,
          color: colors.text, textTransform: 'uppercase', letterSpacing: '0.07em'
        }}>{event.event_type}</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {matchScore !== undefined && <MatchBadge score={matchScore} />}
          {event.prize && event.prize !== '$0' && (
            <span style={{
              padding: '0.25rem 0.7rem', borderRadius: '6px',
              fontSize: '0.75rem', fontWeight: 600,
              background: '#f59e0b15', border: '1px solid #f59e0b40',
              color: '#f59e0b'
            }}>🏆 {event.prize}</span>
          )}
        </div>
      </div>

      <h3 style={{
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontWeight: 700, fontSize: '1rem',
        color: 'var(--text)', lineHeight: 1.4
      }}>{event.title}</h3>

      <p style={{
        fontSize: '0.85rem', color: 'var(--text2)', lineHeight: 1.65,
        display: '-webkit-box', WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical', overflow: 'hidden'
      }}>{event.description}</p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>📍 {event.location}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>🏷️ {event.field}</span>
        {event.deadline && (
          <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 500 }}>
            ⏰ {event.deadline}
          </span>
        )}
      </div>

      {event.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {event.tags.slice(0, 4).map(tag => (
            <span key={tag} style={{
              padding: '0.2rem 0.55rem', borderRadius: '5px',
              fontSize: '0.72rem', background: 'var(--bg2)',
              color: 'var(--text2)', border: '1px solid var(--border)'
            }}>#{tag}</span>
          ))}
        </div>
      )}

      <a href={event.url} target="_blank" rel="noopener noreferrer" style={{
        marginTop: 'auto', padding: '0.6rem 1rem',
        borderRadius: '8px', textAlign: 'center',
        fontSize: '0.85rem', fontWeight: 600,
        background: 'var(--bg2)', border: '1px solid var(--border)',
        color: 'var(--text)', display: 'block'
      }}>View Event →</a>
    </div>
  );
}

export default function Events() {
  const [events,   setEvents]   = useState([]);
  const [matchMap, setMatchMap] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState({ event_type: '', field: '', mode: '' });
  const [error,    setError]    = useState('');
  const [isMatched, setIsMatched] = useState(false);
  const [username,  setUsername]  = useState('');
  const location = useLocation();

  const types  = ['', 'hackathon', 'conference', 'meetup', 'workshop'];
  const fields = ['', 'AI/ML', 'Web3', 'Cybersecurity', 'Web Development', 'General Tech', 'Social Impact'];
  const modes  = ['', 'Remote', 'In-Person'];

  useEffect(() => {
    const params  = new URLSearchParams(location.search);
    const matched = params.get('matched');
    const userId  = params.get('user_id') || localStorage.getItem('hackmatch_user_id');
    const uname   = localStorage.getItem('hackmatch_username');
    const fieldParam = params.get('field');

    if (uname) setUsername(uname);

    if (fieldParam) {
      setFilter(f => ({ ...f, field: decodeURIComponent(fieldParam) }));
    }

    if (matched && userId) {
      setIsMatched(true);
      fetchMatchedEvents(userId);
    } else {
      fetchAllEvents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    if (!isMatched) fetchAllEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const applyFilters = (data) => {
    let filtered = [...data];
    if (filter.event_type) filtered = filtered.filter(e => e.event_type === filter.event_type);
    if (filter.field)      filtered = filtered.filter(e => e.field === filter.field);
    if (filter.mode === 'Remote')    filtered = filtered.filter(e => e.location?.toLowerCase().includes('remote'));
    if (filter.mode === 'In-Person') filtered = filtered.filter(e => !e.location?.toLowerCase().includes('remote'));
    return filtered;
  };

  const fetchMatchedEvents = async (userId) => {
    setLoading(true);
    try {
      const res = await matchEvents(userId);
      const all = res.data.matched_events || [];
      // Keep only events with a real match score, sorted best-first
      const matched = all
        .filter(e => e.match_score > 0)
        .sort((a, b) => b.match_score - a.match_score);
      const map = {};
      matched.forEach(e => { map[e.id] = e.match_score; });
      setMatchMap(map);
      setEvents(applyFilters(matched));
    } catch {
      fetchAllEvents();
    } finally { setLoading(false); }
  };

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      const res = await getEvents({});
      setEvents(applyFilters(res.data));
    } catch {
      setError('Could not load events. Make sure the backend is running!');
    } finally { setLoading(false); }
  };

  const FilterBar = ({ label, options, filterKey }) => (
    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{
        fontSize: '0.72rem', color: 'var(--text2)',
        fontWeight: 600, letterSpacing: '0.06em', minWidth: '60px'
      }}>{label}</span>
      {options.map(opt => {
        const active = filter[filterKey] === opt;
        return (
          <button key={opt} onClick={() => setFilter(f => ({ ...f, [filterKey]: opt }))}
            style={{
              padding: '0.35rem 0.875rem', borderRadius: '7px',
              fontSize: '0.8rem', fontWeight: 500,
              background: active ? '#6366f1' : 'var(--card)',
              border: `1px solid ${active ? '#6366f1' : 'var(--border)'}`,
              color: active ? '#fff' : 'var(--text2)',
              transition: 'all 0.15s', cursor: 'pointer'
            }}>
            {opt || 'All'}
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', padding: '2.5rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        {isMatched && username ? (
          <>
            <h1 style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800, fontSize: '1.75rem',
              color: 'var(--text)', marginBottom: '0.4rem'
            }}>
              ⚡ Your AI Matches
              <span style={{
                marginLeft: '0.875rem', fontSize: '0.875rem', fontWeight: 600,
                color: '#6366f1', background: '#6366f115',
                padding: '0.2rem 0.7rem', borderRadius: '6px',
                border: '1px solid #6366f130', verticalAlign: 'middle'
              }}>{events.length} found</span>
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>
              Personalized for <strong>{username}</strong> based on your skills and interests
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={() => fetchMatchedEvents(localStorage.getItem('hackmatch_user_id'))}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '8px',
                  fontSize: '0.85rem', fontWeight: 600,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', border: 'none', cursor: 'pointer'
                }}>⚡ My Matches</button>
              <button onClick={() => { setIsMatched(false); setMatchMap({}); fetchAllEvents(); }}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '8px',
                  fontSize: '0.85rem', fontWeight: 600,
                  background: 'var(--card)', border: '1px solid var(--border)',
                  color: 'var(--text2)', cursor: 'pointer'
                }}>🌐 All Events</button>
            </div>
          </>
        ) : (
          <>
            <h1 style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800, fontSize: '1.75rem',
              color: 'var(--text)', marginBottom: '0.4rem'
            }}>
              Discover Events
              <span style={{
                marginLeft: '0.875rem', fontSize: '0.875rem', fontWeight: 600,
                color: '#6366f1', background: '#6366f115',
                padding: '0.2rem 0.7rem', borderRadius: '6px',
                border: '1px solid #6366f130', verticalAlign: 'middle'
              }}>{events.length} found</span>
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '0.95rem' }}>
              Hackathons, conferences, meetups and more — worldwide
            </p>
          </>
        )}
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--card)', borderRadius: '14px',
        border: '1px solid var(--border)', padding: '1.25rem',
        marginBottom: '2rem', display: 'flex',
        flexDirection: 'column', gap: '0.875rem'
      }}>
        <FilterBar label="TYPE"  options={types}  filterKey="event_type" />
        <FilterBar label="FIELD" options={fields} filterKey="field" />
        <FilterBar label="MODE"  options={modes}  filterKey="mode" />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text2)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚡</div>
          <p>{isMatched ? 'Finding your best matches...' : 'Loading events...'}</p>
        </div>
      ) : error ? (
        <div style={{
          padding: '1.5rem', borderRadius: '12px',
          background: '#ef444415', border: '1px solid #ef444430',
          color: '#ef4444', textAlign: 'center'
        }}>{error}</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text2)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No events found.</p>
          {filter.mode === 'In-Person' && (
            <p style={{ fontSize: '0.85rem' }}>
              Most hackathons are remote. Try switching to Remote or All!
            </p>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem'
        }}>
          {events.map(e => (
            <EventCard key={e.id} event={e} matchScore={matchMap[e.id]} />
          ))}
        </div>
      )}
    </div>
  );
}