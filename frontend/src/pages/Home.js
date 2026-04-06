import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const features = [
  { icon: '🤖', title: 'AI-Powered Matching', desc: 'RAG pipeline analyzes your skills and interests to surface the most relevant events for you.' },
  { icon: '🐙', title: 'GitHub Integration', desc: 'Connect your GitHub profile to auto-detect your tech stack and get smarter recommendations.' },
  { icon: '🔍', title: 'Natural Language Search', desc: 'Ask in plain English and get intelligent results instantly.' },
  { icon: '🌐', title: 'All Event Types', desc: 'Hackathons, conferences, meetups, and workshops all in one place.' },
  { icon: '📊', title: 'Skill Gap Analysis', desc: 'See what skills an event requires and find resources to level up.' },
  { icon: '🔔', title: 'Deadline Alerts', desc: 'Never miss a registration deadline with smart reminders.' },
];

const categories = [
  { label: 'AI / ML',       icon: '🧠', color: '#6366f1' },
  { label: 'Web3',          icon: '⛓️',  color: '#8b5cf6' },
  { label: 'Cybersecurity', icon: '🛡️',  color: '#f59e0b' },
  { label: 'Web Dev',       icon: '🌐', color: '#22c55e' },
  { label: 'Mobile',        icon: '📱', color: '#ec4899' },
  { label: 'Open Source',   icon: '💻', color: '#06b6d4' },
];

export default function Home() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = 45;
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev >= target) { clearInterval(timer); return target; }
        return prev + 2;
      });
    }, 40);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: '3rem 2.5rem' }}>

      {/* ── Hero ── */}
      <section style={{
        minHeight: '80vh', display: 'flex',
        flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px', opacity: 0.4,
        }} />
        <div style={{
          position: 'absolute', width: '500px', height: '500px',
          borderRadius: '50%', top: '5%', left: '50%',
          transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, #6366f120 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.35rem 0.9rem', borderRadius: '999px',
            border: '1px solid var(--border)', background: 'var(--card)',
            fontSize: '0.75rem', color: 'var(--text2)', marginBottom: '2rem',
            fontWeight: 600, letterSpacing: '0.06em'
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#22c55e', display: 'inline-block'
            }} />
            AI-POWERED EVENT DISCOVERY
          </div>

          <h1 style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            lineHeight: 1.15, marginBottom: '1.5rem',
            color: 'var(--text)', letterSpacing: '-0.02em',
          }}>
            Find hackathons that{' '}
            <span style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              match your skills
            </span>
          </h1>

          <p style={{
            fontSize: '1.05rem', color: 'var(--text2)',
            maxWidth: '500px', margin: '0 auto 2.5rem',
            lineHeight: 1.75, fontWeight: 400,
          }}>
            HackMatch uses AI to connect you with the right hackathons,
            conferences, and meetups based on what you actually know and love.
          </p>

          <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/events" style={{
              padding: '0.8rem 1.75rem', borderRadius: '10px',
              fontWeight: 600, fontSize: '0.95rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', transition: 'all 0.2s',
              boxShadow: '0 4px 20px #6366f140',
              textDecoration: 'none'
            }}>
              Browse Events →
            </Link>
            <Link to="/search" style={{
              padding: '0.8rem 1.75rem', borderRadius: '10px',
              fontWeight: 600, fontSize: '0.95rem',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text)', transition: 'all 0.2s',
              textDecoration: 'none'
            }}>
              Try AI Search ✨
            </Link>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: '3rem', justifyContent: 'center',
            marginTop: '4rem', flexWrap: 'wrap'
          }}>
            {[
              { value: `${count}+`, label: 'Live Events' },
              { value: '6',         label: 'Categories' },
              { value: 'RAG',       label: 'AI Pipeline' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontWeight: 800, fontSize: '1.75rem',
                  color: 'var(--text)'
                }}>{s.value}</div>
                <div style={{
                  fontSize: '0.8rem', color: 'var(--text2)',
                  marginTop: '0.2rem', fontWeight: 500
                }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section style={{ padding: '4rem 0', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 700, fontSize: '1.75rem',
            color: 'var(--text)', marginBottom: '0.5rem'
          }}>Browse by Category</h2>
          <p style={{ color: 'var(--text2)', fontSize: '0.95rem' }}>
            Find events in your area of expertise
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem'
        }}>
          {categories.map(cat => (
            <Link
              to={`/events?field=${encodeURIComponent(cat.label)}`}
              key={cat.label}
              style={{
                padding: '1.5rem 1rem', borderRadius: '14px',
                textAlign: 'center',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                transition: 'all 0.2s', cursor: 'pointer',
                textDecoration: 'none'
              }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.6rem' }}>{cat.icon}</div>
              <div style={{
                fontWeight: 600, fontSize: '0.875rem',
                color: cat.color
              }}>{cat.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{
        padding: '4rem 0',
        maxWidth: '900px', margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 700, fontSize: '1.75rem',
            color: 'var(--text)', marginBottom: '0.5rem'
          }}>Why HackMatch?</h2>
          <p style={{ color: 'var(--text2)', fontSize: '0.95rem' }}>
            Built with RAG pipelines, vector search, and GitHub integration
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem'
        }}>
          {features.map(f => (
            <div key={f.title} style={{
              padding: '1.5rem', borderRadius: '14px',
              background: 'var(--card)', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.875rem' }}>{f.icon}</div>
              <h3 style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 700, fontSize: '1rem',
                marginBottom: '0.4rem', color: 'var(--text)'
              }}>{f.title}</h3>
              <p style={{
                fontSize: '0.875rem', color: 'var(--text2)', lineHeight: 1.65
              }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '4rem 0', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 800, fontSize: '1.85rem',
            marginBottom: '1rem', color: 'var(--text)'
          }}>Ready to find your next event?</h2>
          <p style={{
            color: 'var(--text2)', marginBottom: '2rem',
            fontSize: '0.95rem', lineHeight: 1.7
          }}>
            Set up your profile, connect GitHub, and let AI match you
            with hackathons you'll actually want to join.
          </p>
          <Link to="/profile" style={{
            padding: '0.875rem 2.25rem', borderRadius: '10px',
            fontWeight: 700, fontSize: '1rem',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', boxShadow: '0 4px 20px #6366f140',
            display: 'inline-block', textDecoration: 'none'
          }}>
            Create Your Profile →
          </Link>
        </div>
      </section>
    </div>
  );
}