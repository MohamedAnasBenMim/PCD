import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import DashboardLayout from '../components/DashboardLayout';

type User = {
  id?: string;
  sub?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  role?: string;
} | null;

type AuthContextValue = {
  token: string | null;
  user: User;
  login: (token: string, user?: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function parseJwt(token: string) {
  try {
    const payload = token.split('.')[1];
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: any }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (t) {
      setToken(t);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      } else {
        const p = parseJwt(t);
        setUser(
          p
            ? { sub: p.sub, email: p.email, firstName: p.firstName, lastName: p.lastName, role: p.role }
            : null,
        );
      }
    }
  }, []);

  function login(t: string, userFromApi?: User) {
    localStorage.setItem('token', t);
    setToken(t);
    const p = parseJwt(t);
    const u =
      userFromApi ||
      (p
        ? { sub: p.sub, email: p.email, firstName: p.firstName, lastName: p.lastName, role: p.role }
        : null);
    setUser(u);
    try {
      if (u) localStorage.setItem('user', JSON.stringify(u));
    } catch {}
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function RequireAuth({ children }: { children: any }) {
  const auth = useAuth();
  if (!auth.token || auth.user?.role !== 'doctor') return <Navigate to="/login" replace />;
  return children;
}

export function ProtectedLayout() {
  return (
    <RequireAuth>
      <DashboardLayout />
    </RequireAuth>
  );
}

export default AuthProvider;
