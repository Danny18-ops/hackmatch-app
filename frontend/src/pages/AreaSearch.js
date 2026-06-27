import { useState, useRef, useEffect, useCallback } from 'react';
import useGoogleMaps from '../hooks/useGoogleMaps';
import { searchNearby, geocodeArea } from '../api';

const RADIUS_OPTIONS = [25, 50, 100, 250, 500];

const TYPE_COLORS = {
  hackathon:  '#6366f1',
  conference: '#8b5cf6',
  meetup:     '#22c55e',
  workshop:   '#f59e0b',
};

export default function AreaSearch() {
  const { loaded, hasKey, error: mapsError } = useGoogleMaps();

  const inputRef    = useRef(null);
  const mapDivRef   = useRef(null);
  const mapRef      = useRef(null);
  const markersRef  = useRef([]);
  const circleRef   = useRef(null);
  const infoRef     = useRef(null);

  const [center,   setCenter]   = useState(null);   // { lat, lng, label }
  const [radius,   setRadius]   = useState(100);
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [searched, setSearched] = useState(false);

  // ── Run the radius search against the backend ──────────────
  const runSearch = useCallback(async (c, r) => {
    if (!c) return;
    setLoading(true);
    setError('');
    try {
      const res = await searchNearby(c.lat, c.lng, r);
      setEvents(res.data.events || []);
      setSearched(true);
    } catch {
      setError('Search failed. The server may be waking up (free hosting sleeps after inactivity) — give it ~50s and try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initialise the map + Places Autocomplete once loaded ───
  useEffect(() => {
    if (!loaded || !window.google || mapRef.current || !mapDivRef.current) return;

    mapRef.current = new window.google.maps.Map(mapDivRef.current, {
      center: { lat: 39.5, lng: -98.35 },   // continental US
      zoom: 4,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    infoRef.current = new window.google.maps.InfoWindow();

    if (inputRef.current) {
      const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['(regions)'],
        fields: ['geometry', 'formatted_address', 'name'],
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place.geometry) return;
        const loc = place.geometry.location;
        const c = {
          lat: loc.lat(),
          lng: loc.lng(),
          label: place.formatted_address || place.name,
        };
        setCenter(c);
        runSearch(c, radius);
      });
    }
  // radius intentionally excluded — its current value is read in the handler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, runSearch]);

  // ── Redraw markers whenever results / center change ────────
  useEffect(() => {
    if (!loaded || !mapRef.current || !center) return;
    const map = mapRef.current;
    const g = window.google.maps;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (circleRef.current) circleRef.current.setMap(null);

    // Radius circle + center pin
    circleRef.current = new g.Circle({
      map, center: { lat: center.lat, lng: center.lng },
      radius: radius * 1000,
      strokeColor: '#6366f1', strokeOpacity: 0.5, strokeWeight: 1,
      fillColor: '#6366f1', fillOpacity: 0.08,
    });
    const centerPin = new g.Marker({
      map, position: { lat: center.lat, lng: center.lng },
      title: center.label,
      icon: {
        path: g.SymbolPath.CIRCLE, scale: 7,
        fillColor: '#6366f1', fillOpacity: 1,
        strokeColor: '#fff', strokeWeight: 2,
      },
    });
    markersRef.current.push(centerPin);

    const bounds = new g.LatLngBounds();
    bounds.extend({ lat: center.lat, lng: center.lng });

    events.forEach(ev => {
      if (ev.latitude == null || ev.longitude == null) return;
      const color = TYPE_COLORS[ev.type] || '#6366f1';
      const marker = new g.Marker({
        map, position: { lat: ev.latitude, lng: ev.longitude },
        title: ev.title,
        icon: {
          path: g.SymbolPath.CIRCLE, scale: 6,
          fillColor: color, fillOpacity: 1,
          strokeColor: '#fff', strokeWeight: 1.5,
        },
      });
      marker.addListener('click', () => {
        infoRef.current.setContent(
          `<div style="font-family:sans-serif;max-width:220px;color:#111">
             <strong>${ev.title}</strong><br/>
             <span style="font-size:12px;color:#555">${ev.type} · ${ev.location}</span><br/>
             <span style="font-size:12px;color:#6366f1">${ev.distance_km} km away</span><br/>
             <a href="${ev.url}" target="_blank" rel="noopener noreferrer"
                style="font-size:12px">View event →</a>
           </div>`
        );
        infoRef.current.open(map, marker);
      });
      markersRef.current.push(marker);
      bounds.extend({ lat: ev.latitude, lng: ev.longitude });
    });

    if (events.length > 0) {
      map.fitBounds(bounds, 60);
    } else {
      map.setCenter({ lat: center.lat, lng: center.lng });
      map.setZoom(8);
    }
  }, [events, center, radius, loaded]);

  // ── Manual search (typed area, resolved by the backend) ────
  const handleManualSearch = async () => {
    const q = inputRef.current?.value?.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    try {
      const res = await geocodeArea(q);
      const c = {
        lat: res.data.lat,
        lng: res.data.lng,
        label: res.data.formatted_address,
      };
      setCenter(c);
      await runSearch(c, radius);
    } catch (err) {
      const msg = err?.response?.data?.detail;
      setError(msg || 'Could not find that area. Try a city or region name.');
      setLoading(false);
    }
  };

  const onRadiusChange = (r) => {
    setRadius(r);
    if (center) runSearch(center, r);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontWeight: 800, fontSize: '1.75rem',
          color: 'var(--text)', marginBottom: '0.4rem'
        }}>
          📍 Search by Area
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.95rem' }}>
          Find in-person hackathons and events near a city, powered by Google Maps.
        </p>
      </div>

      {/* Search controls */}
      <div style={{
        background: 'var(--card)', borderRadius: '14px',
        border: '1px solid var(--border)', padding: '1.25rem',
        marginBottom: '1.5rem', display: 'flex',
        gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center'
      }}>
        <input
          ref={inputRef}
          onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
          placeholder={hasKey ? 'Search a city or region…' : 'Type a city (e.g. San Diego)…'}
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
          {RADIUS_OPTIONS.map(r => (
            <option key={r} value={r}>Within {r} km</option>
          ))}
        </select>
        <button
          onClick={handleManualSearch}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem', borderRadius: '10px',
            fontWeight: 700, fontSize: '0.9rem',
            background: loading ? 'var(--bg2)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: loading ? 'var(--text2)' : '#fff',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          }}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {/* No-key notice */}
      {!hasKey && (
        <div style={{
          padding: '0.9rem 1.1rem', borderRadius: '10px', marginBottom: '1.5rem',
          background: '#f59e0b15', border: '1px solid #f59e0b40',
          color: '#f59e0b', fontSize: '0.85rem'
        }}>
          🗺️ The interactive map needs a Google Maps key. Add
          <code style={{ margin: '0 0.3rem' }}>REACT_APP_GOOGLE_MAPS_API_KEY</code>
          to <code>frontend/.env</code> to enable it. You can still search by typing a city above.
        </div>
      )}
      {mapsError && (
        <div style={{
          padding: '0.9rem 1.1rem', borderRadius: '10px', marginBottom: '1.5rem',
          background: '#ef444415', border: '1px solid #ef444440', color: '#ef4444',
          fontSize: '0.85rem'
        }}>{mapsError}</div>
      )}

      {/* Map */}
      {hasKey && (
        <div
          ref={mapDivRef}
          style={{
            width: '100%', height: '380px', borderRadius: '14px',
            border: '1px solid var(--border)', marginBottom: '1.5rem',
            background: 'var(--card)',
          }}
        />
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem',
          background: '#ef444415', border: '1px solid #ef444440', color: '#ef4444'
        }}>{error}</div>
      )}

      {/* Results */}
      {searched && !loading && (
        <>
          <h3 style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700,
            fontSize: '1rem', color: 'var(--text2)', marginBottom: '1rem'
          }}>
            {events.length > 0
              ? `${events.length} event${events.length === 1 ? '' : 's'} within ${radius} km of ${center?.label || 'this area'}`
              : `No in-person events within ${radius} km. Try a larger radius or run the geocoder (POST /api/events/geocode).`}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {events.map(ev => (
              <a key={ev.id} href={ev.url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1rem 1.25rem', background: 'var(--card)',
                  borderRadius: '12px', border: '1px solid var(--border)',
                  textDecoration: 'none', gap: '1rem'
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
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6366f1' }}>
                    {ev.distance_km} km
                  </div>
                  {ev.prize && ev.prize !== '$0' && (
                    <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>🏆 {ev.prize}</div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {!searched && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text2)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🌎</div>
          <p>Search a city to discover events happening near you.</p>
        </div>
      )}
    </div>
  );
}
