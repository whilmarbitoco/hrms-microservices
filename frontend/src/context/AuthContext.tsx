import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { api } from '../lib/api';

export interface JwtClaims {
  role?: string | null;
  employee_id?: string | null;
  permissions?: string[];
  is_active?: boolean;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string | null;
  employee_id?: string | null;
  is_active?: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  claims: JwtClaims | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwtClaims(token: string | null): JwtClaims {
  if (!token) return {};
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<JwtClaims | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      setClaims(parseJwtClaims(token));

      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (error) {
        console.error('Failed to fetch user profile', error);
        localStorage.removeItem('access_token');
        setUser(null);
        setClaims(null);
      } finally {
        setIsLoading(false);
      }
    };

    void initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('access_token', token);
    setClaims(parseJwtClaims(token));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      localStorage.removeItem('access_token');
      setUser(null);
      setClaims(null);
    }
  };

  const hasPermission = (permission: string) => {
    const permissions = claims?.permissions ?? [];
    return permissions.includes(permission);
  };

  const value = useMemo(
    () => ({ user, claims, isLoading, login, logout, hasPermission }),
    [user, claims, isLoading]
  );

  return (
    <AuthContext.Provider value={value}>
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
