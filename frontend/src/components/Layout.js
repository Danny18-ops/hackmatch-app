import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Layout({ children }) {
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('hackmatch_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });
  const [username, setUsername] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hackmatch_theme', theme);
  }, [theme]);

  useEffect(() => {
    const u = localStorage.getItem('hackmatch_username');
    if (u) setUsername(u);
  }, []);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const navLinks = [
    { path: '/',        label: 'Home' },
    { path: '/events',  label: 'Events' },
    { path: '/search',  label: 'AI Search' },
    { path: '/profile', label: 'Profile' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: 'var(--bg)', color: 'var(--text)'
    }}>

      {/* ── Left Sidebar ── */}
      <aside style={{
        width: '220px', flexShrink: 0,
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '1.5rem 1rem',
        position: 'fixed', top: 0, left: 0,
        height: '100vh', zIndex: 100,
      }}>
        {/* Logo */}
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          marginBottom: '2rem', textDecoration: 'none'
        }}>
          <span style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1rem'
          }}>⚡</span>
          <span style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)'
          }}>HackMatch</span>
        </Link>

        {/* Nav Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {navLinks.map(link => (
            <Link key={link.path} to={link.path} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.7rem 1rem', borderRadius: '10px',
              fontSize: '0.9rem', fontWeight: 500,
              textDecoration: 'none',
              background: isActive(link.path) ? '#6366f115' : 'transparent',
              color: isActive(link.path) ? '#6366f1' : 'var(--text2)',
              borderLeft: isActive(link.path) ? '3px solid #6366f1' : '3px solid transparent',
              transition: 'all 0.2s',
            }}>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* User info / Sign In */}
          {username ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.75rem', borderRadius: '10px',
              background: '#6366f110', border: '1px solid #6366f130'
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.75rem',
                fontWeight: 700, color: '#fff'
              }}>{username[0].toUpperCase()}</div>
              <span style={{
                fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--text)', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>{username}</span>
            </div>
          ) : (
            <Link to="/profile" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0.7rem 1rem', borderRadius: '10px',
              fontSize: '0.85rem', fontWeight: 600,
              textDecoration: 'none', color: '#6366f1',
              background: '#6366f108', border: '1px solid #6366f130',
            }}>Sign In →</Link>
          )}

          {/* Theme toggle */}
          <button onClick={toggleTheme} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.7rem 1rem', borderRadius: '10px',
            fontSize: '0.85rem', fontWeight: 500,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text2)', cursor: 'pointer', width: '100%'
          }}>
            {theme === 'dark' ? '☀️' : '🌙'}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{
        marginLeft: '220px', flex: 1,
        minHeight: '100vh', overflow: 'auto'
      }}>
        {children}
      </main>
    </div>
  );
}