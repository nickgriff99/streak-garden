import { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

/*
  State plan for this app, written here because auth state is the one
  piece that lives outside a normal component tree.

  - Server-derived data (habits, checkins, computed growth stage): fetched
    with plain `fetch` through small custom hooks (useHabits, useCheckins)
    that hold the result in useState + useEffect. No Redux, no React Query.
  - Auth state (current user, token): this context. Persisted to
    localStorage so a page refresh does not log the user out.
  - UI-only state (modals, form inputs, hover): plain useState in whatever
    component owns that piece of UI.
*/

const AuthContext = createContext(null);

const STORAGE_KEY = 'streak-garden-auth';

function readStoredAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = readStoredAuth();
    if (stored) {
      setUser(stored.user);
      setTokenState(stored.token);
      apiClient.setToken(stored.token);
    }
    setIsLoading(false);
  }, []);

  function persist(nextUser, nextToken) {
    setUser(nextUser);
    setTokenState(nextToken);
    apiClient.setToken(nextToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, token: nextToken }));
  }

  async function signup(email, password) {
    const data = await apiClient.post('/api/auth/signup', { email, password });
    persist(data.user, data.token);
  }

  async function login(email, password) {
    const data = await apiClient.post('/api/auth/login', { email, password });
    persist(data.user, data.token);
  }

  function logout() {
    setUser(null);
    setTokenState(null);
    apiClient.setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const value = { user, token, isLoading, signup, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
