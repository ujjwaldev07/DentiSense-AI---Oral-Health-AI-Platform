import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../api/endpoints.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('denta_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('denta_token') || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync token & user in state and storage
  const handleAuthSuccess = (authData) => {
    const { token: receivedToken, user: receivedUser } = authData;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('denta_token', receivedToken);
    localStorage.setItem('denta_user', JSON.stringify(receivedUser));
    setError(null);
  };

  // Re-hydrate current user from backend on initial mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const savedToken = localStorage.getItem('denta_token');
      if (savedToken) {
        try {
          const res = await authAPI.getMe();
          if (res?.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('denta_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          // Only clear session if token is explicitly rejected by backend as invalid or expired (401)
          if (err.status === 401 || err.response?.status === 401) {
            console.warn('Session expired (401), clearing authentication:', err.message);
            logout();
          } else {
            console.warn('Backend temporarily unavailable during session re-hydration; preserving cached credentials:', err.message);
          }
        }
      }
    };
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authAPI.login({ email, password });
      handleAuthSuccess(res.data);
      return res.data.user;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authAPI.register(userData);
      handleAuthSuccess(res.data);
      return res.data.user;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Demo Login for fast user/admin testing
  const loginDemo = async (role = 'user') => {
    if (role === 'admin') {
      return login('admin@dentalaware.org', 'Admin@12345');
    }
    return login('user@dentalaware.org', 'User@12345');
  };

  const logout = async () => {
    setIsLoading(true);
    let apiError = null;
    try {
      await authAPI.logout();
    } catch (err) {
      apiError = err;
      console.warn('Backend logout request failed (safely terminated client session):', err?.message);
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
      setIsLoading(false);
      localStorage.removeItem('denta_token');
      localStorage.removeItem('denta_user');
      localStorage.removeItem('auth_token');
    }
    if (apiError) {
      throw apiError;
    }
  };

  const updateProfile = async (profileData) => {
    setIsLoading(true);
    try {
      const res = await userAPI.updateProfile(profileData);
      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem('denta_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (preferences) => {
    setIsLoading(true);
    try {
      const res = await userAPI.updatePreferences(preferences);
      setUser((prev) => ({ ...prev, preferredLanguage: res.data.preferredLanguage }));
      return res.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (passwordData) => {
    setIsLoading(true);
    try {
      const res = await userAPI.updatePassword(passwordData);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    return authAPI.forgotPassword({ email });
  };

  const resetPassword = async (token, newPassword) => {
    return authAPI.resetPassword({ token, newPassword });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isAdmin: user?.role === 'admin',
        isLoading,
        error,
        login,
        register,
        signup: register,
        loginDemo,
        logout,
        updateProfile,
        updatePreferences,
        updatePassword,
        forgotPassword,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
