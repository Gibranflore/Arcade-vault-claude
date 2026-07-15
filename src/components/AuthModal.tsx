import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Gamepad2, Github } from 'lucide-react';
import { useAuth } from '../lib/auth';

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

  useEffect(() => {
    if (open) {
      setError(null);
      setLoading(false);
      setShowGuest(false);
    }
  }, [open]);

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

        {/* Social */}
        <div className="mt-6 space-y-2">
          <p className="font-mono text-[10px] text-gray-500 text-center uppercase tracking-wide">o continúa con</p>
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-2 py-2.5 border border-vault-border rounded font-mono text-xs text-gray-300 hover:border-gray-500 hover:bg-vault-panel-light transition-all active:scale-95">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 border border-vault-border rounded font-mono text-xs text-gray-300 hover:border-gray-500 hover:bg-vault-panel-light transition-all active:scale-95">
              <Github className="w-4 h-4" />
              GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
