import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { searchNearby } from '../api';

// Fix Leaflet's default marker icons under webpack/CRA (otherwise they 404).
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: iconRetina, iconUrl, shadowUrl });

const RADIUS_OPTIONS = [25, 50, 100, 250, 500];
const US_CENTER = { lat: 39.5, lng: -98.35 };

// Free geocoding via OpenStreetMap Nominatim — no API key.
async function geocodeCity(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('geocode failed');
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name };
}

// Imperatively move the map when the searched center changes.
function Recenter({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) map.setView([lat, lng], zoom);
  }, [lat, lng, zoom, map]);
  return null;
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

  return (
    <div style={{ minHeight: '100vh', padding: '2.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800,
          fontSize: '1.75rem', color: 'var(--text)', marginBottom: '0.4rem',
        }}>📍 Search by Area</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.95rem' }}>
          Find in-person events near a city — free map, no sign-up. Powered by
          OpenStreetMap.
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
            padding: '0.75rem 1.5rem', borderRadius: '10px',
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

      {/* Map */}
      <div style={{
        height: '380px', borderRadius: '14px', overflow: 'hidden',
        border: '1px solid var(--border)', marginBottom: '1.5rem',
      }}>
        <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={mapZoom}
          style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {center && <Recenter lat={center.lat} lng={center.lng} zoom={9} />}
          {center && (
            <Circle center={[center.lat, center.lng]} radius={radius * 1000}
              pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.08 }} />
          )}
          {events.map(ev => (
            ev.latitude != null && ev.longitude != null && (
              <Marker key={ev.id} position={[ev.latitude, ev.longitude]}>
                <Popup>
                  <strong>{ev.title}</strong><br />
                  <span style={{ fontSize: '12px', color: '#555' }}>
                    {ev.type} · {ev.location}{ev.distance_km != null ? ` · ${ev.distance_km} km` : ''}
                  </span><br />
                  <a href={ev.url} target="_blank" rel="noopener noreferrer">View event →</a>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>

      {/* Results / empty state */}
      {searched && !loading && (
        events.length > 0 ? (
          <>
            <h3 style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700,
              fontSize: '1rem', color: 'var(--text2)', marginBottom: '1rem',
            }}>
              {events.length} event{events.length === 1 ? '' : 's'} within {radius} km
              {center ? ` of ${center.label.split(',')[0]}` : ''}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {events.map(ev => (
                <a key={ev.id} href={ev.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem 1.25rem', background: 'var(--card)',
                    borderRadius: '12px', border: '1px solid var(--border)',
                    textDecoration: 'none', gap: '1rem',
                  }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>
                      {ev.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
                      {ev.type} · {ev.field} · 📍 {ev.location}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {ev.distance_km != null && (
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6366f1' }}>
                        {ev.distance_km} km
                      </div>
                    )}
                    {ev.prize && ev.prize !== '$0' && (
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>🏆 {ev.prize}</div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </>
        ) : !error && (
          <div style={{
            textAlign: 'center', padding: '2.5rem',
            background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</div>
            <p style={{ color: 'var(--text)', fontWeight: 600 }}>
              Sorry, no events available right now.
            </p>
            <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
              No events within {radius} km of {center ? center.label.split(',')[0] : 'this area'}.
              Try a larger radius or a different city.
            </p>
          </div>
        )
      )}

      {!searched && !loading && (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text2)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🌎</div>
          <p>Search a city to discover in-person events near you.</p>
        </div>
      )}
    </div>
  );
}
