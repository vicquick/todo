import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as api from "../api/client";
import { tokenStore, setUnauthorizedHandler, AuthUser } from "../api/client";

type AuthState = {
  user: AuthUser | null;
  status: "initializing" | "authenticated" | "unauthenticated";
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("initializing");
  const inFlight = useRef<Promise<AuthUser> | null>(null);

  const fetchMeOnce = useCallback(async () => {
    if (inFlight.current) return inFlight.current;
    const p = api.getMe();
    inFlight.current = p;
    try {
      const me = await p;
      setUser(me);
      setStatus("authenticated");
      return me;
    } finally {
      inFlight.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  // restore session on boot
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus("unauthenticated");
    });
    const t = tokenStore.get();
    if (!t) {
      setStatus("unauthenticated");
      return;
    }
    fetchMeOnce().catch(() => {
      tokenStore.clear();
      setStatus("unauthenticated");
    });
    return () => setUnauthorizedHandler(null);
  }, [fetchMeOnce]);

  const value = useMemo<AuthState>(() => ({
    user,
    status,
    login: async (u, p) => {
      await api.login(u, p);
      await fetchMeOnce();
    },
    signup: async (u, e, p) => {
      await api.signup(u, e, p);
    },
    logout,
    refreshMe: async () => { await fetchMeOnce(); },
  }), [user, status, fetchMeOnce, logout]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
