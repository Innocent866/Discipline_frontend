import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const storageKey = "discipline_token";
const userKey = "discipline_user";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(userKey);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(localStorage.getItem(storageKey) || "");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem(storageKey, token);
      if (user) localStorage.setItem(userKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(userKey);
    }
  }, [token, user]);

  const API_BASE = "https://displine-backend.onrender.com";

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken("");
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update profile");
    const data = await res.json();
    setUser(data.user);
    return data;
  };

  // Hydrate user on refresh if token exists
  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        setInitializing(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // token invalid or expired
          setToken("");
          setUser(null);
        }
      } catch {
        // network error — keep existing user if any
      } finally {
        setInitializing(false);
      }
    };
    hydrate();
  }, [token]);

  const value = useMemo(
    () => ({ user, token, login, logout, updateProfile, loading, initializing }),
    [user, token, loading, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

