import { useState, useRef, useCallback } from 'react';
import { Pause, X, Play, RotateCcw, Save, Home, Heart } from 'lucide-react';
import type { GameDef } from '../lib/games';
import { useAuth } from '../lib/auth';
import { submitScore } from '../lib/scores';
import { SnakeGame } from '../games/SnakeGame';
import { BreakoutGame } from '../games/BreakoutGame';
import { InvadersGame } from '../games/InvadersGame';
import { TetrisGame } from '../games/TetrisGame';
import { PacmanGame } from '../games/PacmanGame';
import { AsteroidsGame } from '../games/AsteroidsGame';

type GamePlayerProps = {
  game: GameDef;
  onExit: () => void;
};

type GameHandle = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
};

type GameState = 'idle' | 'playing' | 'paused' | 'over';

const accentMap = {
  cyan: 'text-neon-cyan',
  magenta: 'text-neon-magenta',
  yellow: 'text-neon-yellow',
  green: 'text-neon-green',
};

export function GamePlayer({ game, onExit }: GamePlayerProps) {
  const { user, guest, displayName } = useAuth();
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const gameRef = useRef<GameHandle | null>(null);

  const handleScoreChange = useCallback((s: number) => setScore(s), []);
  const handleLivesChange = useCallback((l: number) => setLives(l), []);
  const handleLevelChange = useCallback((l: number) => setLevel(l), []);
  const handleGameOver = useCallback(() => setGameState('over'), []);

  const handleStart = useCallback(() => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setSaved(false);
    setSaveError(null);
    setGameState('playing');
    gameRef.current?.start();
  }, []);

  const handlePause = useCallback(() => {
    if (gameState === 'playing') {
      gameRef.current?.pause();
      setGameState('paused');
    }
  }, [gameState]);

  const handleResume = useCallback(() => {
    gameRef.current?.resume();
    setGameState('playing');
  }, []);

  const handleRestart = useCallback(() => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setSaved(false);
    setSaveError(null);
    setGameState('playing');
    gameRef.current?.reset();
  }, []);

  const handleSaveScore = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    const userId = user?.id ?? null;
    const { success, error } = await submitScore(game.id, displayName, score, userId);
    if (success) {
      setSaved(true);
    } else {
      setSaveError(error ?? 'Error al guardar');
    }
    setSaving(false);
  }, [game.id, displayName, score, user]);

  const renderGame = () => {
    const commonProps = {
      onScore: handleScoreChange,
      onLives: handleLivesChange,
      onLevel: handleLevelChange,
      onGameOver: handleGameOver,
      onReady: (handle: GameHandle) => { gameRef.current = handle; },
      isPaused: gameState === 'paused',
    };

    switch (game.id) {
      case 'snake': return <SnakeGame {...commonProps} />;
      case 'breakout': return <BreakoutGame {...commonProps} />;
      case 'invaders': return <InvadersGame {...commonProps} />;
      case 'tetris': return <TetrisGame {...commonProps} />;
      case 'pacman': return <PacmanGame {...commonProps} />;
      case 'asteroids': return <AsteroidsGame {...commonProps} />;
      default: return <div className="text-gray-500 font-mono p-8">Juego no disponible</div>;
    }
  };

  const a = accentMap[game.accent];

  return (
    <div className="page-enter min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-6">
      {/* HUD */}
      <div className="w-full max-w-3xl mb-4">
        <div className="flex items-center justify-between bg-vault-panel border border-vault-border rounded-lg px-4 py-3">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col">
              <span className="font-pixel text-[8px] text-gray-500 uppercase">Jugador</span>
              <span className="font-mono text-sm text-white truncate max-w-[100px]">{displayName}</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-pixel text-[8px] text-gray-500 uppercase">Juego</span>
              <span className={`font-mono text-sm ${a}`}>{game.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-end">
              <span className="font-pixel text-[8px] text-gray-500 uppercase">Puntuación</span>
              <span className={`font-pixel text-sm ${a}`}>{score.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-pixel text-[8px] text-gray-500 uppercase">Vidas</span>
              <span className="flex items-center gap-0.5">
                {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
                  <Heart key={i} className="w-3 h-3 text-neon-magenta fill-neon-magenta" />
                ))}
                {lives <= 0 && <span className="font-mono text-sm text-gray-500">0</span>}
              </span>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-pixel text-[8px] text-gray-500 uppercase">Nivel</span>
              <span className="font-pixel text-sm text-white">{level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-gray-400 hover:text-neon-magenta border border-vault-border hover:border-neon-magenta/50 rounded transition-all active:scale-95"
        >
          <X className="w-3.5 h-3.5" />
          SALIR
        </button>
        {gameState === 'playing' && (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-gray-400 hover:text-neon-yellow border border-vault-border hover:border-neon-yellow/50 rounded transition-all active:scale-95"
          >
            <Pause className="w-3.5 h-3.5" />
            PAUSA
          </button>
        )}
        {gameState === 'paused' && (
          <button
            onClick={handleResume}
            className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-gray-400 hover:text-neon-cyan border border-vault-border hover:border-neon-cyan/50 rounded transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5" />
            CONTINUAR
          </button>
        )}
      </div>

      {/* CRT Monitor Bezel */}
      <div className="relative w-full max-w-3xl">
        {/* Outer bezel */}
        <div className="bg-gradient-to-b from-[#1a1a28] to-[#0d0d15] p-3 sm:p-5 rounded-2xl border-2 border-vault-border shadow-2xl">
          {/* Inner screen */}
          <div className="crt-screen relative bg-black rounded-xl overflow-hidden border border-vault-border">
            {/* Game canvas */}
            <div className="relative aspect-[4/3] sm:aspect-[3/2] flex items-center justify-center">
              {renderGame()}

              {/* Idle overlay */}
              {gameState === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                  <game.icon className="w-16 h-16 mb-4" style={{ color: game.color, filter: `drop-shadow(0 0 15px ${game.color})` }} />
                  <h2 className={`font-pixel text-lg ${a} mb-6 text-center px-4`}>{game.title}</h2>
                  <button
                    onClick={handleStart}
                    className={`btn-pixel ${a} border-2 ${game.accent === 'cyan' ? 'border-neon-cyan' : game.accent === 'magenta' ? 'border-neon-magenta' : game.accent === 'yellow' ? 'border-neon-yellow' : 'border-neon-green'} hover:bg-white/5 animate-pulse-glow active:scale-95`}
                  >
                    <span className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      INICIAR
                    </span>
                  </button>
                  <p className="font-mono text-xs text-gray-500 mt-4">Controles: {game.controls}</p>
                </div>
              )}

              {/* Paused overlay */}
              {gameState === 'paused' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
                  <Pause className="w-12 h-12 text-neon-yellow mb-4" />
                  <h2 className="font-pixel text-lg text-neon-yellow mb-4">PAUSA</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={handleResume}
                      className="btn-pixel text-neon-cyan border-2 border-neon-cyan hover:bg-neon-cyan/10 active:scale-95"
                    >
                      CONTINUAR
                    </button>
                    <button
                      onClick={onExit}
                      className="btn-pixel text-neon-magenta border-2 border-neon-magenta hover:bg-neon-magenta/10 active:scale-95"
                    >
                      SALIR
                    </button>
                  </div>
                </div>
              )}

              {/* Game over modal */}
              {gameState === 'over' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 px-4">
                  <h2 className="font-pixel text-xl sm:text-2xl text-neon-magenta mb-2 text-center animate-flicker">FIN DEL JUEGO</h2>
                  <div className="my-4 text-center">
                    <p className="font-pixel text-[10px] text-gray-500 uppercase mb-1">Puntuación Final</p>
                    <p className={`font-pixel text-2xl ${a}`}>{score.toLocaleString()}</p>
                  </div>

                  {saved ? (
                    <div className="mb-4">
                      <p className="typewriter font-pixel text-xs text-neon-green">PUNTUACIÓN GUARDADA</p>
                    </div>
                  ) : saveError ? (
                    <p className="font-mono text-xs text-neon-magenta mb-4">{saveError}</p>
                  ) : null}

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                    {!saved && (
                      <button
                        onClick={handleSaveScore}
                        disabled={saving || score <= 0}
                        className="btn-pixel flex-1 text-neon-green border-2 border-neon-green hover:bg-neon-green/10 active:scale-95 disabled:opacity-50"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Save className="w-3.5 h-3.5" />
                          {saving ? 'GUARDANDO...' : 'GUARDAR'}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={handleRestart}
                      className="btn-pixel flex-1 text-neon-cyan border-2 border-neon-cyan hover:bg-neon-cyan/10 active:scale-95"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <RotateCcw className="w-3.5 h-3.5" />
                        DE NUEVO
                      </span>
                    </button>
                  </div>
                  <button
                    onClick={onExit}
                    className="btn-pixel mt-3 w-full max-w-xs text-gray-400 border-2 border-vault-border hover:border-gray-500 active:scale-95"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Home className="w-3.5 h-3.5" />
                      VOLVER AL VAULT
                    </span>
                  </button>

                  {!user && !guest && (
                    <p className="font-mono text-[10px] text-gray-600 mt-4 text-center max-w-xs">
                      Inicia sesión para guardar tus puntuaciones en el Salón de la Fama
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
