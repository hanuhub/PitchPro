import axios from "axios";

// Same-origin is preferred (works on iOS Safari, which blocks third-party cookies
// between render.com subdomains). When REACT_APP_BACKEND_URL is empty, axios will
// use relative URLs like `/api/...` against the frontend origin — Render's rewrite
// rule (see render.yaml → routes) proxies those to the backend service, so the
// browser sees everything as first-party.
const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

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
