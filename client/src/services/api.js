import axios from 'axios';

// Empty in development (Vite proxies /api). In production it is the Render URL.
const ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const api = axios.create({
  baseURL: `${ORIGIN}/api`,
  withCredentials: true, // sends the httpOnly login cookie
  timeout: 20000,
});

// Turns any Axios error into a sentence we can show to a person.
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'The server took too long to answer.';
  if (err?.request) return 'Cannot reach the server. Check your connection.';
  return fallback;
}

// Field errors from validation, as { fieldName: message }
export function fieldErrors(err) {
  const out = {};
  for (const e of err?.response?.data?.errors || []) {
    if (e.field && !out[e.field]) out[e.field] = e.message;
  }
  return out;
}
