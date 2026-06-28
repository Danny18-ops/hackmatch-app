import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { searchNearby } from '../api';

const RADIUS_OPTIONS = [25, 50, 100, 250, 500];
const US_CENTER = { lat: 39.5, lng: -98.35 };

const TYPE_COLORS = {
  hackathon:  { bg: '#6366f115', border: '#6366f140', text: '#6366f1' },
  conference: { bg: '#8b5cf615', border: '#8b5cf640', text: '#8b5cf6' },
  meetup:     { bg: '#22c55e15', border: '#22c55e40', text: '#22c55e' },
  workshop:   { bg: '#f59e0b15', border: '#f59e0b40', text: '#f59e0b' },
};

// Clean branded marker (avoids Leaflet's default PNG icons entirely).
const markerIcon = L.divIcon({
  className: 'hm-marker',
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#6366f1;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Free geocoding via OpenStreetMap Nominatim — no API key.
async function geocodeCity(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('geocode failed');
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name };
}

function Recenter({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) map.setView([lat, lng], zoom);
  }, [lat, lng, zoom, map]);
  return null;
}

function ResultCard({ ev }) {
  const colors = TYPE_COLORS[ev.type] || TYPE_COLORS.hackathon;
  return (
    <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{
      display: 'flex', flexDirection: 'column', gap: '0.7rem',
      padding: '1.25rem', background: 'var(--card)', borderRadius: '14px',
      border: '1px solid var(--border)', textDecoration: 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          padding: '0.25rem 0.7rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
          background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>{ev.type}</span>
        {ev.distance_km != null && (
          <span style={{
            padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
            background: '#6366f115', border: '1px solid #6366f140', color: '#6366f1',
          }}>{ev.distance_km} km</span>
        )}
      </div>

      <h3 style={{
        fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700,
        fontSize: '1rem', color: 'var(--text)', lineHeight: 1.4,
      }}>{ev.title}</h3>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text2)' }}>
        <span>📍 {ev.location}</span>
        {ev.field && <span>🏷️ {ev.field}</span>}
        {ev.start_date && <span>📅 {ev.start_date}</span>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        {ev.prize && ev.prize !== '$0'
          ? <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>🏆 {ev.prize}</span>
          : <span />}
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6366f1' }}>View Event →</span>
      </div>
    </a>
  );
}

export default function AreaSearch() {
  const [query,    setQuery]    = useState('');
  const [center,   setCenter]   = useState(null);   // { lat, lng, label }
  const [radius,   setRadius]   = useState(100);
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [searched, setSearched] = useState(false);

  const runSearch = async (c, r) => {
    setLoading(true);
    setError('');
    try {
      const res = await searchNearby(c.lat, c.lng, r);
      setEvents(res.data.events || []);
      setSearched(true);
    } catch {
      setError('Search failed. The server may be waking up — try again in a moment.');
      setEvents([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    try {
      const place = await geocodeCity(q);
      if (!place) {
        setError(`Couldn't find "${q}". Try a city or region name.`);
        setLoading(false);
        return;
      }
      setCenter(place);
      await runSearch(place, radius);
    } catch {
      setError('Could not look up that location. Please try again.');
      setLoading(false);
    }
  };

  const onRadiusChange = (r) => {
    setRadius(r);
    if (center) runSearch(center, r);
  };

  const mapCenter = center || US_CENTER;
  const mapZoom = center ? 9 : 4;
  const cityLabel = center ? center.label.split(',')[0] : 'this area';

  return (
    <div style={{ minHeight: '100vh', padding: '2.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800,
          fontSize: '1.75rem', color: 'var(--text)', marginBottom: '0.4rem',
        }}>📍 Search by Area</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.95rem' }}>
          Find in-person events near a city — free map, no sign-up. Powered by OpenStreetMap.
        </p>
      </div>

      {/* Controls */}
      <div style={{
        background: 'var(--card)', borderRadius: '14px',
        border: '1px solid var(--border)', padding: '1.25rem',
        marginBottom: '1.5rem', display: 'flex',
        gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Type a city (e.g. San Diego)…"
          style={{
            flex: '1 1 280px', padding: '0.75rem 1rem', borderRadius: '10px',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: '0.95rem', outline: 'none',
          }}
        />
        <select
          value={radius}
          onChange={e => onRadiusChange(Number(e.target.value))}
          style={{
            padding: '0.75rem 1rem', borderRadius: '10px',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: '0.9rem', cursor: 'pointer',
          }}>
          {RADIUS_OPTIONS.map(r => <option key={r} value={r}>Within {r} km</option>)}
        </select>
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: '0.75rem 1.75rem', borderRadius: '10px',
            fontWeight: 700, fontSize: '0.9rem', border: 'none',
            background: loading ? 'var(--bg2)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: loading ? 'var(--text2)' : '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem',
          background: '#ef444415', border: '1px solid #ef444440', color: '#ef4444',
        }}>{error}</div>
      )}

      {/* Cohesive map + results panel */}
      <div style={{
        background: 'var(--card)', borderRadius: '16px',
        border: '1px solid var(--border)', overflow: 'hidden',
      }}>
        {/* Map */}
        <div style={{ height: '420px' }}>
          <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={mapZoom}
            style={{ height: '100%', width: '100%' }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {center && <Recenter lat={center.lat} lng={center.lng} zoom={9} />}
            {center && (
              <Circle center={[center.lat, center.lng]} radius={radius * 1000}
                pathOptions={{ color: '#6366f1', weight: 1, fillColor: '#6366f1', fillOpacity: 0.06 }} />
            )}
            {events.map(ev => (
              ev.latitude != null && ev.longitude != null && (
                <Marker key={ev.id} position={[ev.latitude, ev.longitude]} icon={markerIcon}>
                  <Popup>
                    <strong style={{ fontSize: '13px' }}>{ev.title}</strong><br />
                    <span style={{ fontSize: '12px', opacity: 0.75 }}>
                      {ev.type} · {ev.location}{ev.distance_km != null ? ` · ${ev.distance_km} km` : ''}
                    </span><br />
                    <a href={ev.url} target="_blank" rel="noopener noreferrer">View event →</a>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>

        {/* Results header + grid */}
        <div style={{ padding: '1.5rem' }}>
          {!searched && !loading && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text2)' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🌎</div>
              <p>Search a city to discover in-person events near you.</p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text2)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</div>
              <p>Finding events near {cityLabel}…</p>
            </div>
          )}

          {searched && !loading && events.length > 0 && (
            <>
              <h3 style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700,
                fontSize: '1.05rem', color: 'var(--text)', marginBottom: '1rem',
              }}>
                {events.length} event{events.length === 1 ? '' : 's'} within {radius} km of {cityLabel}
              </h3>
              <div style={{
                display: 'grid', gap: '1rem',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              }}>
                {events.map(ev => <ResultCard key={ev.id} ev={ev} />)}
              </div>
            </>
          )}

          {searched && !loading && events.length === 0 && !error && (
            <div style={{
              textAlign: 'center', padding: '2.5rem 1.5rem',
              border: '1px dashed var(--border)', borderRadius: '14px', background: 'var(--bg2)',
            }}>
              <div style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>🗺️</div>
              <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: '1rem' }}>
                Sorry, no events available right now.
              </p>
              <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: '0.4rem', maxWidth: '360px', margin: '0.4rem auto 0' }}>
                No in-person events within {radius} km of {cityLabel}. Try a larger radius
                or a different city.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.1rem', flexWrap: 'wrap' }}>
                {[250, 500].filter(r => r > radius).map(r => (
                  <button key={r} onClick={() => onRadiusChange(r)} style={{
                    padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600,
                    background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer',
                  }}>Expand to {r} km</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
