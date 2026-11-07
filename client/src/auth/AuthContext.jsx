import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  // Restore the session on first load.
  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch((e) => {
        if (e.status === 401) setToken(null); // keep the token if the server is merely unreachable
      })
      .finally(() => setLoading(false));
  }, []);

  const finish = useCallback((d) => {
    setToken(d.token);
    setUser(d.user);
  }, []);

  const login = useCallback(
    async (email, password) => finish(await api('/auth/login', { method: 'POST', body: { email, password } })),
    [finish]
  );
  const register = useCallback(
    async (displayName, email, password) =>
      finish(await api('/auth/register', { method: 'POST', body: { displayName, email, password } })),
    [finish]
  );
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
