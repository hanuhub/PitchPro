import axios from "axios";

// Base URL for the API.
// - When REACT_APP_BACKEND_URL is empty: uses relative `/api/...` (same origin).
// - When set to a full URL: cross-origin calls (e.g. preview environments).
// Either way, auth is carried by Authorization: Bearer <token> from localStorage.
// This avoids cross-site cookie issues (iOS Safari ITP, in-app browsers, etc).
const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
export const API_BASE = `${BACKEND_URL}/api`;

const TOKEN_KEY = "pitchpro_token";

export function saveToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (_) {
    /* localStorage unavailable (private mode iOS) — fine, cookie will still work if same-origin */
  }
}

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch (_) { return null; }
}

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // still send cookies as a secondary channel
});

// Attach Authorization header on every request if we have a token.
api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

// On a 401, drop the token so the UI can redirect to login cleanly.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) saveToken(null);
    return Promise.reject(err);
  },
);

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  }
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export function errorMsg(err) {
  return formatApiErrorDetail(err?.response?.data?.detail) || err?.message || "Request failed";
}
