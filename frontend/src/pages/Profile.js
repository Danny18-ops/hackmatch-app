import { useState, useEffect } from 'react';
import { registerUser, updatePrefs, fetchGithub } from '../api';

const EVENT_TYPE_PRESETS = ['hackathon', 'conference', 'meetup', 'workshop'];

const PROFILE_TABS = [
  { id: 'personal',    label: 'Personal',    icon: '👤' },
  { id: 'skills',      label: 'Skills',      icon: '💻' },
  { id: 'preferences', label: 'Preferences', icon: '⚙️' },
];

/* ── Shared micro-components ─────────────────────────────────── */

function FieldLabel({ children }) {
  return (
    <p style={{
      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em',
      color: 'var(--text2)', marginBottom: '0.45rem', textTransform: 'uppercase',
    }}>{children}</p>
  );
}

function TextInput({ label, placeholder, value, onChange, onKeyDown, type = 'text', prefix }) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div style={{ position: 'relative' }}>
        {prefix && (
          <span style={{
            position: 'absolute', left: '0.875rem', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text2)',
            fontSize: '0.85rem', pointerEvents: 'none', userSelect: 'none',
            whiteSpace: 'nowrap',
          }}>{prefix}</span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          style={{
            width: '100%', padding: prefix ? '0.75rem 1rem 0.75rem 6.6rem' : '0.75rem 1rem',
            borderRadius: '10px', background: 'var(--bg)',
            border: '1px solid var(--border)', color: 'var(--text)',
            fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
        />
      </div>
    </div>
  );
}

function SkillTag({ label, onRemove, color = '#8b5cf6' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      padding: '0.3rem 0.45rem 0.3rem 0.8rem',
      borderRadius: '7px', fontSize: '0.82rem', fontWeight: 500,
      background: `${color}18`, border: `1px solid ${color}55`,
      color, whiteSpace: 'nowrap',
    }}>
      {label}
      <button onClick={onRemove} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '15px', height: '15px', borderRadius: '50%',
        background: `${color}30`, border: 'none', color,
        cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800,
        lineHeight: 1, padding: 0, flexShrink: 0,
      }}>×</button>
    </span>
  );
}

/* ── Main component ──────────────────────────────────────────── */

export default function Profile() {
  /* auth */
  const [authTab,   setAuthTab]   = useState('signup');
  const [step,      setStep]      = useState('auth');
  const [profileTab, setProfileTab] = useState('personal');

  /* user */
  const [userId,   setUserId]   = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  /* ui */
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  /* auth form */
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  /* personal info (localStorage only — backend doesn't store these) */
  const [personal, setPersonal] = useState({
    full_name: '', university: '', degree: '', linkedin_url: '',
  });

  /* github */
  const [github,       setGithub]       = useState('');
  const [githubResult, setGithubResult] = useState(null);

  /* skills + event types */
  const [prefs, setPrefs] = useState({ skills: [], interests: [], event_types: [] });
  const [skillInput,     setSkillInput]     = useState('');
  const [eventTypeInput, setEventTypeInput] = useState('');

  /* ── skill helpers ── */
  const addSkill = (raw) => {
    const s = raw.trim();
    if (!s) return;
    setPrefs(p => ({ ...p, skills: p.skills.includes(s) ? p.skills : [...p.skills, s] }));
    setSkillInput('');
  };
  const removeSkill = (s) => setPrefs(p => ({ ...p, skills: p.skills.filter(x => x !== s) }));

  /* ── event-type helpers ── */
  const addEventType = (raw) => {
    const et = raw.trim().toLowerCase();
    if (!et) return;
    setPrefs(p => ({ ...p, event_types: p.event_types.includes(et) ? p.event_types : [...p.event_types, et] }));
    setEventTypeInput('');
  };
  const removeEventType = (et) => setPrefs(p => ({ ...p, event_types: p.event_types.filter(x => x !== et) }));
  const togglePreset = (et) => {
    if (prefs.event_types.includes(et)) removeEventType(et);
    else addEventType(et);
  };

  /* ── restore session ── */
  useEffect(() => {
    const savedInfo = localStorage.getItem('hackmatch_user_info');
    const savedId   = localStorage.getItem('hackmatch_user_id');
    if (savedInfo && savedId) {
      try {
        const data = JSON.parse(savedInfo);
        setUserId(parseInt(savedId));
        setUserInfo(data);
        setPrefs({
          skills:      data.skills      || [],
          interests:   data.interests   || [],
          event_types: data.event_types || [],
        });
        setGithub(data.github_username || '');
        setPersonal({
          full_name:    data.full_name    || '',
          university:   data.university   || '',
          degree:       data.degree       || '',
          linkedin_url: data.linkedin_url || '',
        });
        setStep('setup');
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  /* ── sign up ── */
  const handleSignUp = async () => {
    if (!form.username || !form.email) { setError('Please enter username and email'); return; }
    setLoading(true); setError('');
    try {
      const res = await registerUser(form);
      setUserId(res.data.id);
      setUserInfo(res.data);
      localStorage.setItem('hackmatch_user_id',   res.data.id);
      localStorage.setItem('hackmatch_username',  res.data.username);
      localStorage.setItem('hackmatch_user_info', JSON.stringify(res.data));
      setStep('setup');
      setSuccess(`Welcome, ${res.data.username}!`);
    } catch (e) {
      setError(e.response?.data?.detail || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  /* ── sign in ── */
  const handleSignIn = async () => {
    if (!form.username) { setError('Please enter your username'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/users/username/${form.username}`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();
      setUserId(data.id);
      setUserInfo(data);
      localStorage.setItem('hackmatch_user_id',   data.id);
      localStorage.setItem('hackmatch_username',  data.username);
      localStorage.setItem('hackmatch_user_info', JSON.stringify(data));
      setPrefs({
        skills:      data.skills      || [],
        interests:   data.interests   || [],
        event_types: data.event_types || [],
      });
      setGithub(data.github_username || '');
      setPersonal({
        full_name:    data.full_name    || '',
        university:   data.university   || '',
        degree:       data.degree       || '',
        linkedin_url: data.linkedin_url || '',
      });
      setStep('setup');
      setSuccess(`Welcome back, ${data.username}!`);
    } catch {
      setError('User not found. Please check your username or sign up.');
    } finally { setLoading(false); }
  };

  /* ── save prefs ── */
  const handleSavePrefs = async () => {
    if (!userId) { setError('Session expired. Please sign in again.'); setStep('auth'); return; }
    setLoading(true); setError('');
    try {
      await updatePrefs(userId, {
        skills:         prefs.skills,
        interests:      prefs.interests,
        event_types:    prefs.event_types,
        github_username: github || undefined,
      });
      const updatedInfo = { ...userInfo, ...prefs, ...personal, github_username: github };
      localStorage.setItem('hackmatch_user_info', JSON.stringify(updatedInfo));
      setSuccess('Profile saved! Taking you to your matches...');
      setStep('done');
      setTimeout(() => { window.location.href = `/events?matched=true&user_id=${userId}`; }, 1200);
    } catch {
      setError('Could not save preferences. Please try again.');
    } finally { setLoading(false); }
  };

  /* ── github fetch ── */
  const handleGithub = async () => {
    const uname = github.replace('https://github.com/', '').replace(/\/$/, '').trim();
    if (!uname)  { setError('Please enter your GitHub username'); return; }
    if (!userId) { setError('Session expired. Please sign in again.'); setStep('auth'); return; }
    setGithub(uname); setLoading(true); setError('');
    try {
      await updatePrefs(userId, { ...prefs, github_username: uname });
      const res = await fetchGithub(userId);
      setGithubResult(res.data);
      const merged = [...new Set([...prefs.skills, ...res.data.detected_skills])];
      setPrefs(p => ({ ...p, skills: merged }));
      const updatedInfo = { ...userInfo, github_username: uname, skills: merged };
      localStorage.setItem('hackmatch_user_info', JSON.stringify(updatedInfo));
      setSuccess(`Detected ${res.data.detected_skills.length} skills from your GitHub repos!`);
    } catch {
      setError('Could not fetch GitHub. Make sure the username is correct.');
    } finally { setLoading(false); }
  };

  /* ── sign out ── */
  const handleSignOut = () => {
    localStorage.removeItem('hackmatch_user_id');
    localStorage.removeItem('hackmatch_username');
    localStorage.removeItem('hackmatch_user_info');
    setStep('auth'); setUserInfo(null); setUserId(null);
    setPrefs({ skills: [], interests: [], event_types: [] });
    setPersonal({ full_name: '', university: '', degree: '', linkedin_url: '' });
    setGithub(''); setGithubResult(null);
    setSuccess(''); setError('');
    setForm({ username: '', email: '', password: '' });
  };

  /* ════════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', padding: '2rem 2.5rem', background: 'var(--bg)' }}>

      {/* Page title */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800,
          fontSize: '1.6rem', color: 'var(--text)', letterSpacing: '-0.02em',
          marginBottom: '0.25rem',
        }}>
          {step === 'auth' ? (
            <>Welcome to{' '}
              <span style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>HackMatch</span>
            </>
          ) : 'My Profile'}
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>
          {step === 'auth'    ? 'Create an account or sign in to get personalized event matches'
          : step === 'setup'  ? 'Manage your profile and event preferences'
          : 'All set!'}
        </p>
      </div>

      {/* Toast messages */}
      {error && (
        <div style={{
          padding: '0.7rem 1rem', borderRadius: '10px', marginBottom: '1rem',
          background: '#ef444412', border: '1px solid #ef444430',
          color: '#ef4444', fontSize: '0.875rem',
        }}>{error}</div>
      )}
      {success && (
        <div style={{
          padding: '0.7rem 1rem', borderRadius: '10px', marginBottom: '1rem',
          background: '#22c55e12', border: '1px solid #22c55e30',
          color: '#22c55e', fontSize: '0.875rem',
        }}>{success}</div>
      )}

      {/* ══ AUTH STEP ══════════════════════════════════════════ */}
      {step === 'auth' && (
        <div style={{
          maxWidth: '480px',
          background: 'var(--card)', borderRadius: '20px',
          border: '1px solid var(--border)', overflow: 'hidden',
        }}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {['signup', 'signin'].map(t => (
              <button key={t} onClick={() => { setAuthTab(t); setError(''); }} style={{
                flex: 1, padding: '1rem', fontSize: '0.875rem', fontWeight: 600,
                background: authTab === t ? 'var(--card)' : 'var(--bg2)',
                color: authTab === t ? '#6366f1' : 'var(--text2)',
                borderBottom: authTab === t ? '2px solid #6366f1' : '2px solid transparent',
                cursor: 'pointer', border: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>
                {t === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
            ))}
          </div>

          <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {authTab === 'signup' ? (
              <>
                <TextInput label="Username" placeholder="choose a username"
                  value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                <TextInput label="Email" type="email" placeholder="your@email.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                <TextInput label="Password" type="password" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button onClick={handleSignUp} disabled={loading} style={{
                  padding: '0.85rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.925rem',
                  background: loading ? 'var(--border)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: loading ? 'var(--text2)' : '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}>
                  {loading ? 'Creating account...' : 'Create Account →'}
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text2)' }}>
                  Already have an account?{' '}
                  <span onClick={() => { setAuthTab('signin'); setError(''); }}
                    style={{ color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}>Sign in</span>
                </p>
              </>
            ) : (
              <>
                <TextInput label="Username" placeholder="your username"
                  value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                <TextInput label="Password" type="password" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button onClick={handleSignIn} disabled={loading} style={{
                  padding: '0.85rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.925rem',
                  background: loading ? 'var(--border)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: loading ? 'var(--text2)' : '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}>
                  {loading ? 'Signing in...' : 'Sign In →'}
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text2)' }}>
                  Don't have an account?{' '}
                  <span onClick={() => { setAuthTab('signup'); setError(''); }}
                    style={{ color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}>Sign up</span>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ SETUP STEP ═════════════════════════════════════════ */}
      {step === 'setup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* User header card */}
          {userInfo && (
            <div style={{
              background: 'var(--card)', borderRadius: '14px',
              border: '1px solid var(--border)', padding: '1rem 1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                {/* Avatar */}
                <div style={{
                  width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.15rem', fontWeight: 700, color: '#fff',
                }}>
                  {userInfo.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                    {personal.full_name || userInfo.username}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: '0.1rem' }}>
                    {personal.university
                      ? `${personal.university}${personal.degree ? ' · ' + personal.degree : ''}`
                      : userInfo.email}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <button onClick={handleSignOut} style={{
                  padding: '0.35rem 0.875rem', borderRadius: '8px',
                  fontSize: '0.78rem', fontWeight: 600,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  color: 'var(--text2)', cursor: 'pointer',
                }}>Sign Out</button>
              </div>
            </div>
          )}

          {/* Tab panel */}
          <div style={{
            background: 'var(--card)', borderRadius: '14px',
            border: '1px solid var(--border)', overflow: 'hidden',
          }}>
            {/* Tab bar */}
            <div style={{
              display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg2)',
            }}>
              {PROFILE_TABS.map(tab => (
                <button key={tab.id} onClick={() => setProfileTab(tab.id)} style={{
                  flex: 1, padding: '0.8rem 0.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  fontSize: '0.82rem', fontWeight: 600,
                  background: profileTab === tab.id ? 'var(--card)' : 'transparent',
                  color: profileTab === tab.id ? '#6366f1' : 'var(--text2)',
                  borderBottom: profileTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                  cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}>
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div style={{ padding: '1.75rem', minHeight: '320px' }}>

              {/* ── TAB: PERSONAL ─────────────────────────────── */}
              {profileTab === 'personal' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  {/* 2-col grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <TextInput label="Full Name" placeholder="Jane Doe"
                      value={personal.full_name}
                      onChange={e => setPersonal(p => ({ ...p, full_name: e.target.value }))} />
                    <TextInput label="University" placeholder="e.g. UC San Diego"
                      value={personal.university}
                      onChange={e => setPersonal(p => ({ ...p, university: e.target.value }))} />
                    <TextInput label="Degree" placeholder="e.g. B.S. Computer Science"
                      value={personal.degree}
                      onChange={e => setPersonal(p => ({ ...p, degree: e.target.value }))} />
                    <TextInput label="LinkedIn URL" placeholder="linkedin.com/in/yourname"
                      value={personal.linkedin_url}
                      onChange={e => setPersonal(p => ({ ...p, linkedin_url: e.target.value }))} />
                  </div>

                  {/* GitHub section */}
                  <div>
                    <FieldLabel>GitHub</FieldLabel>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <TextInput
                        prefix="github.com/"
                        placeholder="your_username"
                        value={github}
                        onChange={e => setGithub(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleGithub()}
                      />
                      <button onClick={handleGithub} disabled={loading} style={{
                        padding: '0.75rem 1.1rem', borderRadius: '10px',
                        fontWeight: 600, fontSize: '0.82rem', flexShrink: 0,
                        background: '#6366f115', border: '1px solid #6366f140',
                        color: '#6366f1', cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap',
                      }}>
                        {loading ? '...' : 'Fetch Skills'}
                      </button>
                    </div>
                    {/* Connected status */}
                    {github && (
                      <div style={{
                        marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.78rem', color: '#22c55e', fontWeight: 500,
                      }}>
                        <span style={{
                          width: '7px', height: '7px', borderRadius: '50%',
                          background: '#22c55e', display: 'inline-block', flexShrink: 0,
                        }} />
                        Connected: github.com/{github}
                      </div>
                    )}
                    {githubResult && (
                      <div style={{
                        marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text2)',
                      }}>
                        {githubResult.detected_skills.length} skills detected from{' '}
                        {githubResult.repos_analyzed} repos
                      </div>
                    )}
                  </div>

                  {/* Skills preview */}
                  {prefs.skills.length > 0 && (
                    <div>
                      <FieldLabel>Skills preview</FieldLabel>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {prefs.skills.map(s => (
                          <span key={s} style={{
                            padding: '0.25rem 0.7rem', borderRadius: '6px',
                            fontSize: '0.78rem', fontWeight: 500,
                            background: '#8b5cf615', border: '1px solid #8b5cf640',
                            color: '#8b5cf6',
                          }}>{s}</span>
                        ))}
                      </div>
                      <p style={{
                        marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text2)',
                      }}>
                        {prefs.skills.length} skill{prefs.skills.length !== 1 ? 's' : ''} ·{' '}
                        <span style={{ color: '#6366f1', cursor: 'pointer' }}
                          onClick={() => setProfileTab('skills')}>edit in Skills tab →</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB: SKILLS ───────────────────────────────── */}
              {profileTab === 'skills' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  {/* GitHub auto-detect */}
                  <div>
                    <FieldLabel>Auto-detect from GitHub</FieldLabel>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <TextInput
                        prefix="github.com/"
                        placeholder="your_username"
                        value={github}
                        onChange={e => setGithub(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleGithub()}
                      />
                      <button onClick={handleGithub} disabled={loading} style={{
                        padding: '0.75rem 1.1rem', borderRadius: '10px',
                        fontWeight: 600, fontSize: '0.82rem', flexShrink: 0,
                        background: '#6366f115', border: '1px solid #6366f140',
                        color: '#6366f1', cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap',
                      }}>
                        {loading ? '...' : 'Fetch Skills'}
                      </button>
                    </div>
                    {githubResult && (
                      <div style={{
                        marginTop: '0.55rem', padding: '0.55rem 0.875rem',
                        borderRadius: '8px', background: '#22c55e10', border: '1px solid #22c55e30',
                        fontSize: '0.78rem', color: '#22c55e', fontWeight: 500,
                      }}>
                        {githubResult.detected_skills.length} skills detected from{' '}
                        {githubResult.repos_analyzed} repos
                      </div>
                    )}
                  </div>

                  {/* Free-text input */}
                  <div>
                    <FieldLabel>Add skills manually</FieldLabel>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <input
                        placeholder="e.g. Docker, AWS, scikit-learn, Flutter..."
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addSkill(skillInput.replace(/,$/, ''));
                          }
                        }}
                        style={{
                          flex: 1, padding: '0.75rem 1rem', borderRadius: '10px',
                          background: 'var(--bg)', border: '1px solid var(--border)',
                          color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
                        }}
                      />
                      <button onClick={() => addSkill(skillInput)} style={{
                        padding: '0.75rem 1.1rem', borderRadius: '10px',
                        fontWeight: 600, fontSize: '0.82rem',
                        background: '#8b5cf615', border: '1px solid #8b5cf640',
                        color: '#8b5cf6', cursor: 'pointer', whiteSpace: 'nowrap',
                      }}>Add</button>
                    </div>
                    <p style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--muted)' }}>
                      Press Enter or comma to add · Click × on a tag to remove
                    </p>
                  </div>

                  {/* Tags */}
                  {prefs.skills.length > 0 ? (
                    <div>
                      <p style={{
                        fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em',
                        color: '#8b5cf6', textTransform: 'uppercase', marginBottom: '0.7rem',
                      }}>
                        {prefs.skills.length} skill{prefs.skills.length !== 1 ? 's' : ''} added
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {prefs.skills.map(s => (
                          <SkillTag key={s} label={s} color="#8b5cf6" onRemove={() => removeSkill(s)} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                      No skills added yet — fetch from GitHub or type one above.
                    </p>
                  )}
                </div>
              )}

              {/* ── TAB: PREFERENCES ──────────────────────────── */}
              {profileTab === 'preferences' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <FieldLabel>Event types you're interested in</FieldLabel>

                  {/* Quick-select preset chips */}
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text2)', marginBottom: '0.6rem' }}>
                      Quick select:
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {EVENT_TYPE_PRESETS.map(et => {
                        const active = prefs.event_types.includes(et);
                        return (
                          <button key={et} onClick={() => togglePreset(et)} style={{
                            padding: '0.4rem 1rem', borderRadius: '8px',
                            fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
                            background: active ? '#f59e0b18' : 'var(--bg)',
                            border: `1px solid ${active ? '#f59e0b60' : 'var(--border)'}`,
                            color: active ? '#f59e0b' : 'var(--text2)',
                            transition: 'all 0.15s',
                          }}>{et}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Free-text custom event type */}
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text2)', marginBottom: '0.6rem' }}>
                      Add custom event type:
                    </p>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <input
                        placeholder="e.g. exhibition, bootcamp, webinar..."
                        value={eventTypeInput}
                        onChange={e => setEventTypeInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addEventType(eventTypeInput.replace(/,$/, ''));
                          }
                        }}
                        style={{
                          flex: 1, padding: '0.75rem 1rem', borderRadius: '10px',
                          background: 'var(--bg)', border: '1px solid var(--border)',
                          color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
                        }}
                      />
                      <button onClick={() => addEventType(eventTypeInput)} style={{
                        padding: '0.75rem 1.1rem', borderRadius: '10px',
                        fontWeight: 600, fontSize: '0.82rem',
                        background: '#f59e0b15', border: '1px solid #f59e0b40',
                        color: '#f59e0b', cursor: 'pointer', whiteSpace: 'nowrap',
                      }}>Add</button>
                    </div>
                    <p style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--muted)' }}>
                      Press Enter to add any event type
                    </p>
                  </div>

                  {/* Selected event type tags */}
                  {prefs.event_types.length > 0 ? (
                    <div>
                      <p style={{
                        fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em',
                        color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.7rem',
                      }}>
                        {prefs.event_types.length} type{prefs.event_types.length !== 1 ? 's' : ''} selected
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {prefs.event_types.map(et => (
                          <SkillTag key={et} label={et} color="#f59e0b" onRemove={() => removeEventType(et)} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                      No event types selected yet — pick from above or type a custom one.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Save button */}
            <div style={{
              padding: '1rem 1.75rem', borderTop: '1px solid var(--border)', background: 'var(--bg2)',
            }}>
              <button onClick={handleSavePrefs} disabled={loading} style={{
                width: '100%', padding: '0.8rem', borderRadius: '10px',
                fontWeight: 700, fontSize: '0.925rem',
                background: loading ? 'var(--border)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: loading ? 'var(--text2)' : '#fff',
                cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>
                {loading ? 'Saving...' : 'Save & Find My Events →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DONE STEP ══════════════════════════════════════════ */}
      {step === 'done' && (
        <div style={{
          maxWidth: '480px',
          background: 'var(--card)', borderRadius: '20px',
          border: '1px solid var(--border)', padding: '2.5rem', textAlign: 'center',
        }}>
          <div style={{
            width: '68px', height: '68px', borderRadius: '50%', margin: '0 auto 1.25rem',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
          }}>🚀</div>
          <h2 style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800,
            fontSize: '1.6rem', color: 'var(--text)', marginBottom: '0.6rem',
          }}>You're all set!</h2>
          <p style={{ color: 'var(--text2)', lineHeight: 1.7, fontSize: '0.9rem' }}>
            Redirecting you to your personalized event matches...
          </p>
        </div>
      )}
    </div>
  );
}
