import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=checking / false=guest / obj=user
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      setUser(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.token) localStorage.setItem("kwb_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    setUser(data);
    // Register response does not include token — try to login for token fallback
    try {
      const r = await api.post("/auth/login", { email: payload.email, password: payload.password });
      if (r.data?.token) localStorage.setItem("kwb_token", r.data.token);
    } catch { /* ignore */ }
    return data;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch { /* noop */ }
    localStorage.removeItem("kwb_token");
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, checking, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
