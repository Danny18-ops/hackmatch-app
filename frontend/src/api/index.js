import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
const TOKEN_KEY = 'hackmatch_token';

const API = axios.create({
  baseURL: API_BASE_URL,
  // Render's free tier sleeps after ~15 min idle and takes ~50s to wake on the
  // first request. A generous timeout lets that first request succeed.
  timeout: 60000,
});

// Attach the stored JWT (if present) as a Bearer header on every request.
const _savedToken = localStorage.getItem(TOKEN_KEY);
if (_savedToken) API.defaults.headers.common.Authorization = `Bearer ${_savedToken}`;

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete API.defaults.headers.common.Authorization;
  }
}

// Retry once on cold-start failures (timeout / network drop / 5xx) so a sleeping
// backend doesn't surface as an error on the user's first visit.
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const cfg = error.config || {};
    const retryable =
      !error.response ||
      error.code === 'ECONNABORTED' ||
      (error.response && error.response.status >= 500);
    if (retryable && !cfg._retried) {
      cfg._retried = true;
      await new Promise((r) => setTimeout(r, 2500));
      return API(cfg);
    }
    return Promise.reject(error);
  }
);

// Fire a warm-up ping as soon as the app loads so the backend starts waking
// immediately, before the user navigates to a data page.
API.get('/').catch(() => {});

export const getEvents = (params) => API.get('/api/events/', { params });
export const getEventStats = () => API.get('/api/events/stats');
export const authRegister = (data) => API.post('/api/auth/register', data);
export const authLogin = (data) => API.post('/api/auth/login', data);
export const authMe = () => API.get('/api/auth/me');
export const searchEvents = (query, user_id) => API.post('/api/search/query', { query, user_id });
export const searchNearby = (lat, lng, radius_km, params = {}) =>
  API.get('/api/events/nearby', { params: { lat, lng, radius_km, ...params } });
export const geocodeArea = (q) => API.get('/api/search/geocode', { params: { q } });
export const matchEvents = (user_id) => API.post('/api/search/match', { user_id });
export const registerUser = (data) => API.post('/api/users/register', data);
export const getUser = (id) => API.get(`/api/users/${id}`);
export const getUserByUsername = (username) => API.get(`/api/users/username/${username}`);
export const updatePrefs = (id, data) => API.put(`/api/users/${id}/preferences`, data);
export const fetchGithub = (id) => API.get(`/api/users/${id}/github-skills`);
