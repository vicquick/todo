import { createContext, useContext, useEffect, useState } from "react";

/**
 * Theme state: per-session override on top of the system preference.
 * First load reads prefers-color-scheme; a manual toggle is remembered in
 * sessionStorage, so every fresh browser session follows the system again.
 */
const THEME_KEY = "cairn.theme";

type Ctx = { dark: boolean; toggle: () => void };

const ThemeCtx = createContext<Ctx>({ dark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const stored = sessionStorage.getItem(THEME_KEY);
      if (stored === "dark" || stored === "light") return stored === "dark";
    } catch {}
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      sessionStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {}
  }, [dark]);

  return (
    <ThemeCtx.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
