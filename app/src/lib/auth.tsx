import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type GuestProfile = { id: string; name: string; isGuest: true };

type AuthContextType = {
  session: Session | null;
  user: User | null;
  guest: GuestProfile | null;
  isGuest: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  playAsGuest: (name: string) => void;
  clearGuest: () => void;
  displayName: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_KEY = 'arcade_vault_guest';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [guest, setGuest] = useState<GuestProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      (async () => {
        setSession(sess);
      })();
    });

    // Restore guest
    const stored = localStorage.getItem(GUEST_KEY);
    if (stored) {
      try {
        setGuest(JSON.parse(stored));
      } catch {
        localStorage.removeItem(GUEST_KEY);
      }
    }

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn: AuthContextType['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthContextType['signUp'] = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      setSession(data.session);
    }
    return { error: null };
  };

  const signOut = async () => {
    setGuest(null);
    localStorage.removeItem(GUEST_KEY);
    await supabase.auth.signOut();
  };

  const playAsGuest = (name: string) => {
    const g: GuestProfile = { id: crypto.randomUUID(), name, isGuest: true };
    setGuest(g);
    localStorage.setItem(GUEST_KEY, JSON.stringify(g));
  };

  const clearGuest = () => {
    setGuest(null);
    localStorage.removeItem(GUEST_KEY);
  };

  const user = session?.user ?? null;
  const isGuest = !user && !!guest;
  const displayName = user?.user_metadata?.username ?? guest?.name ?? 'INVITADO';

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        guest,
        isGuest,
        loading,
        signIn,
        signUp,
        signOut,
        playAsGuest,
        clearGuest,
        displayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
