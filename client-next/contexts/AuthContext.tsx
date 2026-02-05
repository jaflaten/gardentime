'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  email: string | null;
  firstName: string | null;
  token: string | null;
  login: (token: string, username: string, email: string, firstName?: string | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    const storedFirstName = localStorage.getItem('firstName');

    if (storedToken && storedUsername && storedEmail) {
      // Check if token is expired
      if (isTokenExpired(storedToken)) {
        console.warn('Stored token is expired, clearing auth data');
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        localStorage.removeItem('firstName');
      } else {
        setToken(storedToken);
        setUsername(storedUsername);
        setEmail(storedEmail);
        setFirstName(storedFirstName);
        setIsAuthenticated(true);
      }
    }

    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUsername: string, newEmail: string, newFirstName?: string | null) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('username', newUsername);
    localStorage.setItem('email', newEmail);
    if (newFirstName) {
      localStorage.setItem('firstName', newFirstName);
    } else {
      localStorage.removeItem('firstName');
    }
    setToken(newToken);
    setUsername(newUsername);
    setEmail(newEmail);
    setFirstName(newFirstName || null);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('firstName');
    setToken(null);
    setUsername(null);
    setEmail(null);
    setFirstName(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        username,
        email,
        firstName,
        token,
        login,
        logout,
        isLoading,
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
