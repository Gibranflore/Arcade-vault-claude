'use client';

import { useState, type ReactNode } from 'react';
import { Background } from '@/app/components/Background';
import { Navbar } from '@/app/components/Navbar';
import { AuthModal } from '@/app/components/AuthModal';

export function AppChrome({ children }: { children: ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen relative">
      <Background />
      <Navbar onOpenAuth={() => setAuthOpen(true)} />

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 mt-12 border-t border-vault-border py-6 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="font-pixel text-[10px] text-neon-cyan/50 mb-2">ARCADE VAULT</p>
          <p className="font-mono text-xs text-gray-600">
            © {new Date().getFullYear()} · Inserta una moneda para jugar
          </p>
        </div>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
