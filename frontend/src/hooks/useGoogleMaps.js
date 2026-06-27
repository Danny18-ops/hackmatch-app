import { useEffect, useState } from 'react';

// Loads the Google Maps JS API (with the Places library) exactly once,
// no matter how many components use it. Set REACT_APP_GOOGLE_MAPS_API_KEY
// in frontend/.env to enable the map + autocomplete.
let loadPromise = null;

function loadGoogleMaps(apiKey) {
  if (window.google && window.google.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

export default function useGoogleMaps() {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const hasKey = Boolean(apiKey);
  const [loaded, setLoaded] = useState(
    () => Boolean(window.google && window.google.maps)
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (loaded || !hasKey) return;
    let active = true;
    loadGoogleMaps(apiKey)
      .then(() => active && setLoaded(true))
      .catch(() => active && setError('Could not load Google Maps.'));
    return () => { active = false; };
  }, [apiKey, hasKey, loaded]);

  return { loaded, hasKey, error };
}
