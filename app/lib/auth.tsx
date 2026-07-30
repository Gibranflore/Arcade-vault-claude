"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/app/lib/supabase/client";

type SupabaseUser = { id: string; email: string; username: string };
type GuestProfile = { id: string; name: string; isGuest: true };

type AuthContextType = {
  user: SupabaseUser | null;
  guest: GuestProfile | null;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    username: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  playAsGuest: (name: string) => void;
  displayName: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_KEY = "mock_arcade_vault_guest";

function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [guest, setGuest] = useState<GuestProfile | null>(() =>
    readJSON(GUEST_KEY),
  );

  useEffect(() => {
    const resolveUser = async (
      authUser: { id: string; email?: string } | null,
    ) => {
      if (!authUser) {
        setUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", authUser.id)
        .single();

      setUser({
        id: authUser.id,
        email: authUser.email ?? "",
        username: profile?.username ?? "",
      });
    };

    supabase.auth.getUser().then(({ data }) => resolveUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn: AuthContextType["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };

    setGuest(null);
    localStorage.removeItem(GUEST_KEY);
    return { error: null };
  };

  const signUp: AuthContextType["signUp"] = async (
    email,
    password,
    username,
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim() } },
    });
    if (error) return { error: error.message };

    setGuest(null);
    localStorage.removeItem(GUEST_KEY);
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const playAsGuest = (name: string) => {
    const g: GuestProfile = { id: crypto.randomUUID(), name, isGuest: true };
    setGuest(g);
    localStorage.setItem(GUEST_KEY, JSON.stringify(g));
  };

  const displayName = user?.username ?? guest?.name ?? "INVITADO";

  return (
    <AuthContext.Provider
      value={{ user, guest, signIn, signUp, signOut, playAsGuest, displayName }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
