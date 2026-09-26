import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext({});

export const ACCENTS = ["#00a884", "#7c5cff", "#0ea5e9", "#f43f5e", "#f59e0b", "#10b981", "#ec4899", "#6366f1"];

export const WALLPAPERS = [
  { key: "doodle",   label: "Doodle" },
  { key: "plain",    label: "Plain" },
  { key: "aurora",   label: "Aurora" },
  { key: "sunset",   label: "Sunset" },
  { key: "ocean",    label: "Ocean" },
  { key: "midnight", label: "Midnight" },
  { key: "grid",     label: "Grid" },
];

const read = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

function resolve(theme) {
  if (theme !== "system") return theme;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setThemePref] = useState(() => read("arhub-theme", "dark"));
  const [resolved, setResolved] = useState(() => resolve(read("arhub-theme", "dark")));
  const [accent, setAccentRaw] = useState(() => read("arhub-accent", ACCENTS[0]));
  const [wallpaper, setWallpaperRaw] = useState(() => read("arhub-wallpaper", "doodle"));
  const [fontScale, setFontScaleRaw] = useState(() => read("arhub-font", "md"));

  useEffect(() => {
    const apply = () => {
      const r = resolve(theme);
      setResolved(r);
      document.documentElement.setAttribute("data-theme", r);
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", r === "dark" ? "#0b141a" : "#ffffff");
    };
    apply();
    write("arhub-theme", theme);
    if (theme !== "system") return;
    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    mq?.addEventListener?.("change", apply);
    return () => mq?.removeEventListener?.("change", apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
    write("arhub-accent", accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.setAttribute("data-font", fontScale);
    write("arhub-font", fontScale);
  }, [fontScale]);

  const setTheme = useCallback((t) => setThemePref(t), []);
  const toggleTheme = useCallback(() => setThemePref(t => (resolve(t) === "dark" ? "light" : "dark")), []);
  const setAccent = useCallback((a) => setAccentRaw(a), []);
  const setWallpaper = useCallback((w) => { setWallpaperRaw(w); write("arhub-wallpaper", w); }, []);
  const setFontScale = useCallback((f) => setFontScaleRaw(f), []);

  return (
    <ThemeContext.Provider value={{
      theme: resolved, themePref: theme, setTheme, toggleTheme,
      accent, setAccent, wallpaper, setWallpaper, fontScale, setFontScale,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
