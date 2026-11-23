"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PlanId } from "@/lib/platform/plans";
import type { PlatformRole } from "@/lib/platform/users-store";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  plan: PlanId;
  role: PlatformRole;
  mcpActivatedAt: string | null;
};

type Session = {
  loggedIn: boolean;
  ready: boolean;
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

/** Real email/password session via httpOnly cookie + /api/auth/* */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setLoggedIn(false);
        setUser(null);
        return;
      }
      const data = (await res.json()) as { user: SessionUser };
      setUser(data.user);
      setLoggedIn(true);
    } catch {
      setLoggedIn(false);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refresh().finally(() => setReady(true));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json()) as { user?: SessionUser; error?: string };
      if (!res.ok) return { error: data.error ?? "Login failed" };
      setUser(data.user ?? null);
      setLoggedIn(true);
      return {};
    } catch {
      return { error: "Network error — is the app running?" };
    }
  }, []);

  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password, name }),
        });
        const data = (await res.json()) as {
          user?: SessionUser;
          error?: string;
        };
        if (!res.ok) return { error: data.error ?? "Signup failed" };
        setUser(data.user ?? null);
        setLoggedIn(true);
        return {};
      } catch {
        return { error: "Network error — is the app running?" };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }
    setLoggedIn(false);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ loggedIn, ready, user, login, signup, logout, refresh }),
    [loggedIn, ready, user, login, signup, logout, refresh],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    return {
      loggedIn: false,
      ready: true,
      user: null,
      login: async () => ({ error: "No session provider" }),
      signup: async () => ({ error: "No session provider" }),
      logout: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}
