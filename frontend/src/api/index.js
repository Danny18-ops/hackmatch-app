import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000' });

export const getEvents = (params) => API.get('/api/events/', { params });
export const searchEvents = (query, user_id) => API.post('/api/search/query', { query, user_id });
export const matchEvents = (user_id) => API.post('/api/search/match', { user_id });
export const registerUser = (data) => API.post('/api/users/register', data);
export const getUser = (id) => API.get(`/api/users/${id}`);
export const updatePrefs = (id, data) => API.put(`/api/users/${id}/preferences`, data);
