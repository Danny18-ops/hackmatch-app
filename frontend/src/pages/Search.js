import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { searchEvents } from '../api';

export default function Search() {
  const [query,   setQuery]   = useState('');
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const suggestions = [
    'Beginner-friendly AI hackathon remote',
    'Cybersecurity meetup in San Diego',
    'Web3 hackathon with big prizes',
    'Machine learning conference 2025',
    'Frontend workshop for beginners',
  ];

  const handleSearch = async (q) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await searchEvents(searchQuery);
      setResult(res.data);
    } catch {
      setError('Search failed. Make sure the backend is running!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', padding: '100px 2rem 4rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 1rem', borderRadius: '999px',
            border: '1px solid #f59e0b44', background: '#f59e0b11',
            fontSize: '0.8rem', color: '#f59e0b', marginBottom: '1.5rem',
            fontWeight: 600, letterSpacing: '0.05em'
          }}>
            ✨ RAG-POWERED AI SEARCH
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '1rem'
          }}>
            Ask Anything About{' '}
            <span style={{
              background: 'linear-gradient(90deg, #f59e0b, #00d4ff)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>Events</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6 }}>
            Our AI understands natural language. Ask in plain English and get
            intelligent, personalized event recommendations.
          </p>
        </div>

        {/* Search Box */}
        <div style={{
          background: '#111827', borderRadius: '16px',
          border: '1px solid #1e2d45', padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 0 40px #00d4ff0a'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. beginner AI hackathon with prizes..."
              style={{
                flex: 1, padding: '0.85rem 1.25rem', borderRadius: '10px',
                background: '#0d1220', border: '1px solid #1e2d45',
                color: '#e2e8f0', fontSize: '1rem', outline: 'none',
                fontFamily: 'DM Sans, sans-serif'
              }}
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              style={{
                padding: '0.85rem 1.75rem', borderRadius: '10px',
                fontWeight: 700, fontSize: '0.95rem',
                background: loading
                  ? '#1e2d45'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: loading ? '#64748b' : '#080b14',
                transition: 'all 0.2s', cursor: loading ? 'not-allowed' : 'pointer'
              }}>
              {loading ? '⚡ Thinking...' : 'Search ✨'}
            </button>
          </div>

          {/* Suggestions */}
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
              TRY THESE:
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => { setQuery(s); handleSearch(s); }}
                  style={{
                    padding: '0.3rem 0.75rem', borderRadius: '999px',
                    fontSize: '0.78rem', background: '#1e2d45',
                    border: '1px solid #1e2d45', color: '#94a3b8',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem',
            background: '#f8717111', border: '1px solid #f8717133', color: '#f87171'
          }}>{error}</div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{
            textAlign: 'center', padding: '3rem',
            background: '#111827', borderRadius: '16px', border: '1px solid #1e2d45'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤖</div>
            <p style={{ color: '#64748b' }}>AI is analyzing events for you...</p>
            <p style={{ color: '#1e2d45', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              RAG pipeline: retrieving → augmenting → generating
            </p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* AI Answer */}
            <div style={{
              background: '#111827', borderRadius: '16px',
              border: '1px solid #f59e0b33', padding: '1.75rem',
              boxShadow: '0 0 30px #f59e0b0a'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>🤖</span>
                <span style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 700,
                  fontSize: '0.9rem', color: '#f59e0b'
                }}>AI RESPONSE</span>
              </div>
              <div style={{ color: '#cbd5e1', lineHeight: 1.8, fontSize: '0.95rem' }}>
                <ReactMarkdown
                  components={{
                    h1: ({children}) => <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e2e8f0', margin: '1rem 0 0.5rem' }}>{children}</h1>,
                    h2: ({children}) => <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', margin: '0.875rem 0 0.4rem' }}>{children}</h2>,
                    h3: ({children}) => <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: '0.75rem 0 0.4rem' }}>{children}</h3>,
                    strong: ({children}) => <strong style={{ color: '#f1f5f9', fontWeight: 700 }}>{children}</strong>,
                    em: ({children}) => <em style={{ color: '#94a3b8' }}>{children}</em>,
                    ul: ({children}) => <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>{children}</ul>,
                    ol: ({children}) => <ol style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>{children}</ol>,
                    li: ({children}) => <li style={{ marginBottom: '0.25rem' }}>{children}</li>,
                    p: ({children}) => <p style={{ margin: '0.5rem 0' }}>{children}</p>,
                    code: ({children}) => <code style={{ background: '#1e2d45', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.875em', color: '#00d4ff' }}>{children}</code>,
                  }}
                >{result.answer}</ReactMarkdown>
              </div>
            </div>

            {/* Matched Events */}
            {result.events?.length > 0 && (
              <div>
                <h3 style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 700,
                  fontSize: '1.1rem', marginBottom: '1rem', color: '#94a3b8'
                }}>
                  MATCHED EVENTS ({result.events.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {result.events.map(event => (
                    <a key={event.id} href={event.url} target="_blank"
                      rel="noopener noreferrer" style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', padding: '1rem 1.25rem',
                        background: '#0d1220', borderRadius: '12px',
                        border: '1px solid #1e2d45', transition: 'all 0.2s',
                        textDecoration: 'none'
                      }}>
                      <div>
                        <div style={{
                          fontWeight: 600, color: '#e2e8f0',
                          marginBottom: '0.25rem'
                        }}>{event.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {event.type} · {event.field} · {event.location}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {event.prize && (
                          <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginBottom: '0.25rem' }}>
                            🏆 {event.prize}
                          </div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#00d4ff' }}>View →</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}