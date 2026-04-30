import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, errorMsg } from "@/lib/api";

const AuthContext = createContext(null);

/* Hex (#RRGGBB) → Tailwind/shadcn HSL string "H S% L%" used in CSS variables */
function hexToHslString(hex) {
  if (!hex || typeof hex !== "string") return null;
  const m = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(m)) return null;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyWhiteLabel(accentHex) {
  const root = document.documentElement;
  if (accentHex) {
    const hsl = hexToHslString(accentHex);
    if (hsl) {
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);
      root.style.setProperty("--accent", hsl);
      root.setAttribute("data-whitelabel", "1");
      return;
    }
  }
  root.style.removeProperty("--primary");
  root.style.removeProperty("--ring");
  root.style.removeProperty("--accent");
  root.removeAttribute("data-whitelabel");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      return data;
    } catch (e) {
      setUser(false);
      return null;
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  // White-label: tint primary to user's academy accent color when logged in.
  useEffect(() => {
    if (user && typeof user === "object" && user.academy_accent_color) {
      applyWhiteLabel(user.academy_accent_color);
    } else {
      applyWhiteLabel(null);
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data);
      return { ok: true, user: data };
    } catch (e) {
      return { ok: false, error: errorMsg(e) };
    }
  };

  const register = async (payload) => {
    try {
      const { data } = await api.post("/auth/register", payload);
      setUser(data);
      return { ok: true, user: data };
    } catch (e) {
      return { ok: false, error: errorMsg(e) };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) { /* ignore */ }
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
