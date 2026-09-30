/**
 * Auth state for the whole app.
 *
 * Wrap the app in <AuthProvider> once (see main.jsx). Any component can then call:
 *   const { user, loading, login, signup, logout, refreshUser } = useAuth();
 *
 * - `user` is the signed-in user object, or null when signed out.
 * - `loading` is true only while the app checks for an existing session on
 *   first load, so protected pages don't flash "please sign in" for a signed-in user.
 *
 * The login token lives in an httpOnly cookie that the browser sends
 * automatically, so no token is stored or handled in JavaScript here.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, ask the server whether the browser already has a valid session.
  useEffect(() => {
    let cancelled = false;
    api("/api/auth/me")
      .then((data) => !cancelled && setUser(data.user))
      .catch(() => {}) // 401 simply means "not signed in"
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    const data = await api("/api/auth/signup", { method: "POST", body: { name, email, password } });
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await api("/api/auth/login", { method: "POST", body: { email, password } });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }, []);

  /** Reload the user from the server, e.g. after a purchase adds books to their library. */
  const refreshUser = useCallback(async () => {
    try {
      const data = await api("/api/auth/me");
      setUser(data.user);
    } catch {
      /* keep the current user; a failed refresh should not sign anyone out */
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, signup, login, logout, refreshUser }),
    [user, loading, signup, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook to read auth state and actions. Must be used inside <AuthProvider>. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
