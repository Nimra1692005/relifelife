/**
 * ReliefLink Mobile — Auth Context
 * Manages role-based session state across the app.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { UserRole } from '../services/api';

export interface AuthUser {
  id: string;
  full_name: string;
  role: UserRole;
  city?: string;
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  setUser: (u: AuthUser | null) => void;
  setRole: (r: UserRole | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  const logout = useCallback(() => {
    setUser(null);
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, setUser, setRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
