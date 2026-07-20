'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Menu, X, Trophy, Library, LogIn, LogOut, User as UserIcon, Info } from 'lucide-react';
import { useAuth } from '@/app/lib/auth';

type NavbarProps = {
  onOpenAuth: () => void;
};

export function Navbar({ onOpenAuth }: NavbarProps) {
  const { user, guest, displayName, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthed = !!user || !!guest;

  const navItems: { href: string; label: string; icon: typeof Library; active: boolean }[] = [
    { href: '/', label: 'Biblioteca', icon: Library, active: pathname === '/' },
    { href: '/salon-de-la-fama', label: 'Salón de la Fama', icon: Trophy, active: pathname === '/salon-de-la-fama' },
    { href: '/about', label: 'Acerca de', icon: Info, active: pathname === '/about' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-vault-bg/90 backdrop-blur-md border-b border-vault-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Gamepad2 className="w-7 h-7 text-neon-cyan group-hover:scale-110 transition-transform" />
            <span className="font-pixel text-xs sm:text-sm text-neon-cyan animate-flicker-slow">
              ARCADE VAULT
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 font-mono text-sm uppercase tracking-wide transition-colors ${
                  item.active ? 'text-neon-cyan' : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </span>
                {item.active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-neon-cyan rounded-full" style={{ boxShadow: '0 0 8px #00f5ff' }} />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthed ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 border border-vault-border rounded">
                  <UserIcon className="w-4 h-4 text-neon-green" />
                  <span className="font-mono text-sm text-gray-300">{displayName}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-3 py-1.5 font-mono text-sm text-gray-400 hover:text-neon-magenta transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 font-pixel text-[10px] uppercase text-neon-cyan border border-neon-cyan/50 hover:border-neon-cyan transition-all hover:shadow-[0_0_15px_rgba(0,245,255,0.4)] active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-neon-cyan transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-vault-border bg-vault-bg/95 backdrop-blur-md">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 font-mono text-sm uppercase tracking-wide rounded transition-colors ${
                  item.active
                    ? 'text-neon-cyan bg-neon-cyan/10 border-l-2 border-neon-cyan'
                    : 'text-gray-400 hover:text-white hover:bg-vault-panel'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-vault-border">
              {isAuthed ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-4 py-2">
                    <UserIcon className="w-4 h-4 text-neon-green" />
                    <span className="font-mono text-sm text-gray-300">{displayName}</span>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 font-mono text-sm uppercase text-gray-400 hover:text-neon-magenta transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onOpenAuth();
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 font-mono text-sm uppercase text-neon-cyan"
                >
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
