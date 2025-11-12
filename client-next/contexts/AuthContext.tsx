'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  email: string | null;
  token: string | null;
  login: (token: string, username: string, email: string) => void;
  logout: () => void;
  isLoading: boolean; // Add loading state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Helper to check if JWT token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  useEffect(() => {
    // Check for existing auth token on mount
    const storedToken = localStorage.getItem('authToken');
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');

    if (storedToken && storedUsername && storedEmail) {
      // Check if token is expired
      if (isTokenExpired(storedToken)) {
        console.warn('Stored token is expired, clearing auth data');
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
      } else {
        setToken(storedToken);
        setUsername(storedUsername);
        setEmail(storedEmail);
        setIsAuthenticated(true);
      }
    }

    setIsLoading(false); // Auth check complete
  }, []);

  const login = (newToken: string, newUsername: string, newEmail: string) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('username', newUsername);
    localStorage.setItem('email', newEmail);
    setToken(newToken);
    setUsername(newUsername);
    setEmail(newEmail);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    setToken(null);
    setUsername(null);
    setEmail(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        username,
        email,
        token,
        login,
        logout,
        isLoading, // Expose loading state
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
