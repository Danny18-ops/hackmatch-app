import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendChat } from '../api';

const GREETING = {
  role: 'assistant',
  content:
    "Hi! I'm the HackMatch assistant 👋 Ask me to find a hackathon (e.g. \"beginner AI hackathon\") or how the app works.",
};

// Render an assistant reply as Markdown (bold, bullet lists, clickable links).
function MarkdownMessage({ text }) {
  return (
    <ReactMarkdown
      components={{
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noopener noreferrer"
            style={{ color: '#6366f1', fontWeight: 600, wordBreak: 'break-word' }}>
            {children}
          </a>
        ),
        strong: ({ children }) => <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{children}</strong>,
        ul: ({ children }) => <ul style={{ paddingLeft: '1.1rem', margin: '0.35rem 0' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ paddingLeft: '1.1rem', margin: '0.35rem 0' }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: '0.2rem' }}>{children}</li>,
        p: ({ children }) => <p style={{ margin: '0.3rem 0' }}>{children}</p>,
        code: ({ children }) => (
          <code style={{ background: 'var(--bg)', padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.85em' }}>
            {children}
          </code>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef(null);

  // Auto-scroll to the newest message.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, loading, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      // Send only the real exchange (skip the local greeting).
      const history = next.filter(m => m !== GREETING).map(m => ({ role: m.role, content: m.content }));
      const res = await sendChat(history);
      setMessages([...next, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages([...next, {
        role: 'assistant',
        content: "Sorry, I couldn't reach the assistant. The server may be waking up — try again in a moment.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '5.5rem', right: '1.5rem', zIndex: 1000,
          width: 'min(360px, calc(100vw - 3rem))', height: 'min(520px, calc(100vh - 8rem))',
          display: 'flex', flexDirection: 'column',
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.9rem 1rem', borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
          }}>
            <span style={{ fontSize: '1.1rem' }}>⚡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>HackMatch Assistant</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Find events · ask anything</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" style={{
              background: 'transparent', border: 'none', color: '#fff',
              fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1,
            }}>✕</button>
          </div>

          {/* Messages */}
          <div ref={bodyRef} style={{
            flex: 1, overflowY: 'auto', padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '0.6rem',
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '0.6rem 0.8rem', borderRadius: '12px',
                fontSize: '0.85rem', lineHeight: 1.5,
                whiteSpace: m.role === 'user' ? 'pre-wrap' : 'normal',
                wordBreak: 'break-word',
                background: m.role === 'user' ? '#6366f1' : 'var(--bg2)',
                color: m.role === 'user' ? '#fff' : 'var(--text)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                borderBottomRightRadius: m.role === 'user' ? '4px' : '12px',
                borderBottomLeftRadius: m.role === 'user' ? '12px' : '4px',
              }}>
                {m.role === 'assistant' ? <MarkdownMessage text={m.content} /> : m.content}
              </div>
            ))}
            {loading && (
              <div style={{
                alignSelf: 'flex-start', padding: '0.6rem 0.9rem',
                borderRadius: '12px', background: 'var(--bg2)',
                border: '1px solid var(--border)', color: 'var(--text2)',
                fontSize: '0.85rem', letterSpacing: '0.15em',
              }}>
                <span className="hm-typing">···</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            display: 'flex', gap: '0.5rem', padding: '0.75rem',
            borderTop: '1px solid var(--border)', background: 'var(--card)',
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about events…"
              style={{
                flex: 1, padding: '0.6rem 0.8rem', borderRadius: '10px',
                background: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: '0.85rem', outline: 'none',
              }}
            />
            <button onClick={send} disabled={loading || !input.trim()} style={{
              padding: '0 1rem', borderRadius: '10px', border: 'none',
              fontWeight: 700, fontSize: '0.85rem', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              background: loading || !input.trim() ? 'var(--bg2)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: loading || !input.trim() ? 'var(--text2)' : '#fff',
            }}>Send</button>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1000,
          width: '56px', height: '56px', borderRadius: '50%', border: 'none',
          cursor: 'pointer', fontSize: '1.5rem', color: '#fff',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          boxShadow: '0 6px 20px rgba(99,102,241,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {open ? '✕' : '💬'}
      </button>
    </>
  );
}
