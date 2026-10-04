import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api/auth.api";
import { setStoredAccessToken, getStoredAccessToken } from "../api/client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from cookie or stored token on initial app mount
  const restoreSession = useCallback(async () => {
    try {
      // Even if no localStorage token, backend cookie might be present
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch {
      // Failed to restore session (unauthenticated or expired cookie)
      setUser(null);
      setStoredAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    // Listen for auth expiration events dispatched by API client interceptor
    const handleAuthExpired = () => {
      setUser(null);
      setStoredAccessToken(null);
    };

    window.addEventListener("vortex_auth_expired", handleAuthExpired);
    return () => {
      window.removeEventListener("vortex_auth_expired", handleAuthExpired);
    };
  }, [restoreSession]);

  // Login handler
  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    setUser(data.user);
    return data.user;
  };

  // Register handler
  const register = async (formData) => {
    const createdUser = await authApi.register(formData);
    return createdUser;
  };

  // Logout handler
  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStoredAccessToken(null);
    }
  };

  // Update in-memory user
  const updateUser = (updatedUser) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
  };

  // Refresh current user from backend
  const refreshCurrentUser = async () => {
    try {
      const refreshed = await authApi.getCurrentUser();
      setUser(refreshed);
      return refreshed;
    } catch (err) {
      console.error("Failed to refresh user:", err);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        refreshCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
