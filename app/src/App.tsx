import { useState, useCallback } from 'react';
import { AuthProvider } from './lib/auth';
import { Background } from './components/Background';
import { Navbar, type Page } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { LibraryPage } from './pages/LibraryPage';
import { GameDetail } from './pages/GameDetail';
import { GamePlayer } from './pages/GamePlayer';
import { HallOfFame } from './pages/HallOfFame';
import type { GameDef } from './lib/games';

type View =
  | { name: 'library' }
  | { name: 'hall-of-fame' }
  | { name: 'detail'; game: GameDef }
  | { name: 'player'; game: GameDef };

function AppContent() {
  const [view, setView] = useState<View>({ name: 'library' });
  const [authOpen, setAuthOpen] = useState(false);

  const currentPage: Page = view.name === 'hall-of-fame' ? 'hall-of-fame' : 'library';

  const navigate = useCallback((page: Page) => {
    if (page === 'library') setView({ name: 'library' });
    else if (page === 'hall-of-fame') setView({ name: 'hall-of-fame' });
  }, []);

  const selectGame = useCallback((game: GameDef) => {
    setView({ name: 'detail', game });
  }, []);

  const playGame = useCallback((game: GameDef) => {
    setView({ name: 'player', game });
  }, []);

  const backToVault = useCallback(() => {
    setView({ name: 'library' });
  }, []);

  return (
    <div className="min-h-screen relative">
      <Background />
      <Navbar page={currentPage} onNavigate={navigate} onOpenAuth={() => setAuthOpen(true)} />

      <main className="relative z-10">
        {view.name === 'library' && <LibraryPage onSelectGame={selectGame} />}
        {view.name === 'hall-of-fame' && <HallOfFame />}
        {view.name === 'detail' && (
          <GameDetail game={view.game} onPlay={() => playGame(view.game)} onBack={backToVault} />
        )}
        {view.name === 'player' && <GamePlayer game={view.game} onExit={backToVault} />}
      </main>

      {/* Footer */}
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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
