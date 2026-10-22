import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('protrack_token'));
  const [loading, setLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          if (res.data.currentWorkspace) {
            localStorage.setItem('protrack_workspace_id', res.data.currentWorkspace.id);
          }
        }
      } catch (err) {
        console.error('Failed to authenticate session:', err);
        localStorage.removeItem('protrack_token');
        localStorage.removeItem('protrack_workspace_id');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('protrack_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);

      if (res.data.currentWorkspace) {
        localStorage.setItem('protrack_workspace_id', res.data.currentWorkspace.id);
      }
      return res.data;
    }
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      localStorage.setItem('protrack_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);

      if (res.data.currentWorkspace) {
        localStorage.setItem('protrack_workspace_id', res.data.currentWorkspace.id);
      }
      return res.data;
    }
  };

  const logout = () => {
    localStorage.removeItem('protrack_token');
    localStorage.removeItem('protrack_workspace_id');
    setToken(null);
    setUser(null);
    window.location.href = '/auth/login';
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const refreshMe = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        refreshMe
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
