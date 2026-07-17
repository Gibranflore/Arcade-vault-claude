'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type MockUser = { id: string; email: string; username: string };
type GuestProfile = { id: string; name: string; isGuest: true };

type AuthContextType = {
  user: MockUser | null;
  guest: GuestProfile | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  playAsGuest: (name: string) => void;
  displayName: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Prefijo "mock_" para no chocar con claves de una futura integración real de Supabase.
const USER_KEY = 'mock_arcade_vault_user';
const USERS_KEY = 'mock_arcade_vault_users';
const GUEST_KEY = 'mock_arcade_vault_guest';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readJSON<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function getRegisteredUsers(): (MockUser & { password: string })[] {
  return readJSON(USERS_KEY) ?? [];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(() => readJSON(USER_KEY));
  const [guest, setGuest] = useState<GuestProfile | null>(() => readJSON(GUEST_KEY));

  const signIn: AuthContextType['signIn'] = async (email, password) => {
    if (!EMAIL_RE.test(email)) return { error: 'Correo inválido' };
    if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres' };

    const users = getRegisteredUsers();
    const existing = users.find((u) => u.email === email);
    const account: MockUser = existing
      ? { id: existing.id, email: existing.email, username: existing.username }
      : { id: crypto.randomUUID(), email, username: email.split('@')[0] };

    if (!existing) {
      users.push({ ...account, password });
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    setGuest(null);
    localStorage.removeItem(GUEST_KEY);
    setUser(account);
    localStorage.setItem(USER_KEY, JSON.stringify(account));
    return { error: null };
  };

  const signUp: AuthContextType['signUp'] = async (email, password, username) => {
    if (username.trim().length < 3) return { error: 'El usuario debe tener al menos 3 caracteres' };
    if (!EMAIL_RE.test(email)) return { error: 'Correo inválido' };
    if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres' };

    const users = getRegisteredUsers();
    if (users.some((u) => u.email === email)) return { error: 'Este correo ya está registrado' };

    const account: MockUser = { id: crypto.randomUUID(), email, username: username.trim() };
    users.push({ ...account, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    setGuest(null);
    localStorage.removeItem(GUEST_KEY);
    setUser(account);
    localStorage.setItem(USER_KEY, JSON.stringify(account));
    return { error: null };
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    setGuest(null);
    localStorage.removeItem(GUEST_KEY);
  };

  const playAsGuest = (name: string) => {
    const g: GuestProfile = { id: crypto.randomUUID(), name, isGuest: true };
    setGuest(g);
    localStorage.setItem(GUEST_KEY, JSON.stringify(g));
  };

  const displayName = user?.username ?? guest?.name ?? 'INVITADO';

  return (
    <AuthContext.Provider value={{ user, guest, signIn, signUp, signOut, playAsGuest, displayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
