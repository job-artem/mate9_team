import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type User = { username: string; first_name: string; last_name: string };

type AuthState = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/auth/me/");
      if (!r.ok) {
        setUser(null);
        return;
      }
      const data = (await r.json()) as { user: User };
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout/", { method: "POST" }).catch(() => {});
    setUser(null);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo<AuthState>(() => ({ user, loading, refresh, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

