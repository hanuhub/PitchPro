import { createContext, useContext, useEffect, useState } from "react";

const THEMES = [
  { id: "stadium",  name: "Stadium",  desc: "Leather red · Pitch green",  color: "#D82234" },
  { id: "midnight", name: "Midnight", desc: "Sky blue · Lavender",        color: "#38BDF8" },
  { id: "carbon",   name: "Carbon",   desc: "Amber · Lime",                color: "#F59E0B" },
  { id: "forest",   name: "Forest",   desc: "Emerald · Warm yellow",       color: "#10B981" },
];

const ThemeContext = createContext(null);
const STORAGE_KEY = "pitchpro-theme";

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return "stadium";
    return localStorage.getItem(STORAGE_KEY) || "stadium";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  const setTheme = (id) => setThemeState(id);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext) || { theme: "stadium", setTheme: () => {}, themes: THEMES };
}
