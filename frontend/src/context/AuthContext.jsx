import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(
    () => localStorage.getItem('x402_refresh_token')
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API = 'http://localhost:8080';

  // On first load: if refresh token exists, get a new access token
  useEffect(() => {
    if (refreshToken) {
      refresh().then(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = () => {
    window.location.href = `${API}/oauth2/authorization/github`;
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem('x402_refresh_token');
  };

  const exchangeCode = async (code) => {
    const res = await fetch(`${API}/api/auth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (data.success || data.data) {
      setAccessToken(data.data.accessToken);
      setRefreshToken(data.data.refreshToken);
      localStorage.setItem('x402_refresh_token', data.data.refreshToken);
      await fetchUser(data.data.accessToken);
    }
    return data;
  };

  const fetchUser = async (token) => {
    const res = await fetch(`${API}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.data) setUser(data.data);
  };

  const refresh = useCallback(async () => {
    const storedToken = refreshToken || localStorage.getItem('x402_refresh_token');
    if (!storedToken) {
      setLoading(false);
      return null;
    }
    try {
      const res = await fetch(`${API}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedToken }),
      });
      const data = await res.json();
      console.log("Refresh response:", data);
      if (data.data?.accessToken) {
        setAccessToken(data.data.accessToken);
        if (data.data.refreshToken) {
          setRefreshToken(data.data.refreshToken);
          localStorage.setItem('x402_refresh_token', data.data.refreshToken);
        }
        await fetchUser(data.data.accessToken);
        return data.data.accessToken;
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    }
    // Refresh failed — clear everything
    logout();
    return null;
  }, [refreshToken]);

  const value = {
    accessToken, refreshToken, user, loading,
    login, logout, exchangeCode, refresh, fetchUser, API,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be inside AuthProvider');
  return context;
}