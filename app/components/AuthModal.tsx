'use client';

import { useState } from 'react';
import { X, Mail, Lock, User, Gamepad2 } from 'lucide-react';
import { useAuth } from '@/app/lib/auth';

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

type Tab = 'login' | 'register';

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp, playAsGuest } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGuest, setShowGuest] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setError(null);
      setLoading(false);
      setShowGuest(false);
    }
  }

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (tab === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error === 'Invalid login credentials' ? 'Credenciales inválidas' : error);
        setLoading(false);
      } else {
        onClose();
      }
    } else {
      if (username.trim().length < 3) {
        setError('El usuario debe tener al menos 3 caracteres');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, username);
      if (error) {
        setError(error === 'User already registered' ? 'Este correo ya está registrado' : error);
        setLoading(false);
      } else {
        onClose();
      }
    }
  };

  const handleGuest = () => {
    if (guestName.trim().length < 2) {
      setError('Introduce un nombre de invitado');
      return;
    }
    playAsGuest(guestName.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-vault-panel border-2 border-neon-cyan/50 rounded-lg p-6 sm:p-8 neon-border-cyan">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-neon-magenta transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <Gamepad2 className="w-10 h-10 text-neon-cyan mb-2" />
          <h2 className="font-pixel text-sm text-neon-cyan text-center">ARCADE VAULT</h2>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border-b border-vault-border">
          {(['login', 'register'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setError(null);
              }}
              className={`flex-1 py-3 font-pixel text-[10px] uppercase tracking-wide transition-all ${
                tab === t
                  ? 'text-neon-cyan border-b-2 border-neon-cyan'
                  : 'text-gray-500 border-b-2 border-transparent hover:text-gray-300'
              }`}
            >
              {t === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block font-mono text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tu nombre de jugador"
                  className="w-full bg-vault-bg border border-vault-border rounded pl-10 pr-3 py-2.5 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,245,255,0.3)] transition-all"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block font-mono text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="w-full bg-vault-bg border border-vault-border rounded pl-10 pr-3 py-2.5 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,245,255,0.3)] transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block font-mono text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-vault-bg border border-vault-border rounded pl-10 pr-3 py-2.5 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,245,255,0.3)] transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="text-neon-magenta font-mono text-xs text-center py-2 border border-neon-magenta/30 rounded bg-neon-magenta/5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-pixel w-full text-neon-cyan border-2 border-neon-cyan hover:bg-neon-cyan/10 hover:shadow-[0_0_20px_rgba(0,245,255,0.5)] disabled:opacity-50"
          >
            {loading ? 'CARGANDO...' : tab === 'login' ? 'ENTRAR' : 'REGISTRAR'}
          </button>
        </form>

        {/* Guest */}
        <div className="mt-6 pt-6 border-t border-vault-border">
          {!showGuest ? (
            <button
              onClick={() => setShowGuest(true)}
              className="w-full font-mono text-sm text-gray-400 hover:text-neon-yellow transition-colors text-center"
            >
              JUGAR COMO INVITADO
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Nombre de invitado"
                className="w-full bg-vault-bg border border-vault-border rounded px-3 py-2.5 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-neon-yellow focus:shadow-[0_0_10px_rgba(245,255,0,0.3)] transition-all"
              />
              <button
                onClick={handleGuest}
                className="btn-pixel w-full text-neon-yellow border-2 border-neon-yellow hover:bg-neon-yellow/10 hover:shadow-[0_0_20px_rgba(245,255,0,0.5)]"
              >
                JUGAR
              </button>
              <p className="font-mono text-[10px] text-gray-500 text-center">
                Las puntuaciones de invitado no se guardan en el Salón de la Fama
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
