'use client';

import { useMemo, useState } from 'react';
import { Trophy, Medal, Crown, Star } from 'lucide-react';
import { GAMES, type GameDef } from '@/app/lib/games';
import { getLeaderboard, getUserBest } from '@/app/lib/scores';
import { useAuth } from '@/app/lib/auth';

const accentMap = {
  cyan: 'text-neon-cyan',
  magenta: 'text-neon-magenta',
  yellow: 'text-neon-yellow',
  green: 'text-neon-green',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getMedalStyle(rank: number): { icon: typeof Crown; color: string; bg: string } {
  if (rank === 0) return { icon: Crown, color: 'text-neon-yellow', bg: 'bg-neon-yellow/10 border-neon-yellow/30' };
  if (rank === 1) return { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-300/10 border-gray-300/30' };
  if (rank === 2) return { icon: Medal, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30' };
  return { icon: Star, color: 'text-gray-500', bg: '' };
}

export function HallOfFame() {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<GameDef>(GAMES[0]);

  const scores = getLeaderboard(selectedGame.id, 10);
  const userBest = user ? getUserBest(selectedGame.id, user.id) : null;

  const userRank = useMemo(() => {
    if (!userBest) return null;
    const idx = scores.findIndex((s) => s.user_id === user?.id);
    return idx >= 0 ? idx + 1 : null;
  }, [scores, userBest, user]);

  const a = accentMap[selectedGame.accent];

  return (
    <div className="page-enter max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="text-center mb-8 pt-4">
        <Trophy className="w-12 h-12 text-neon-yellow mx-auto mb-4" style={{ filter: 'drop-shadow(0 0 15px #f5ff00)' }} />
        <h1 className="font-pixel text-xl sm:text-3xl text-neon-yellow animate-flicker mb-2">SALÓN DE LA FAMA</h1>
        <p className="font-mono text-xs text-gray-500 uppercase tracking-wide">Las mejores puntuaciones de todos los tiempos</p>
      </div>

      {/* Game tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGame(g)}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wide rounded transition-all active:scale-95 ${
              selectedGame.id === g.id
                ? `${accentMap[g.accent]} border-2 bg-white/5`
                : 'text-gray-400 border border-vault-border hover:border-gray-600'
            }`}
            style={selectedGame.id === g.id ? { borderColor: g.color } : {}}
          >
            <g.icon className="w-3.5 h-3.5" />
            {g.title}
          </button>
        ))}
      </div>

      {/* User's best */}
      {user && userBest && (
        <div className="mb-6 bg-vault-panel border-2 border-neon-cyan/30 rounded-lg p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-neon-cyan" />
            <span className="font-pixel text-[10px] text-neon-cyan uppercase">TU MEJOR MARCA</span>
          </div>
          <div className="flex-1 flex items-center justify-end gap-4">
            <span className="font-mono text-sm text-gray-300">{user.username}</span>
            <span className={`font-pixel text-sm ${a}`}>{userBest.score.toLocaleString()}</span>
            {userRank && <span className="font-mono text-xs text-gray-500">Rango #{userRank}</span>}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-vault-panel border-2 border-vault-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[60px_1fr_120px_100px] sm:grid-cols-[80px_1fr_160px_120px] gap-2 px-4 py-3 border-b border-vault-border bg-vault-bg/50">
          <span className="font-pixel text-[10px] text-gray-500 uppercase">Rango</span>
          <span className="font-pixel text-[10px] text-gray-500 uppercase">Jugador</span>
          <span className="font-pixel text-[10px] text-gray-500 uppercase text-right">Puntuación</span>
          <span className="font-pixel text-[10px] text-gray-500 uppercase text-right hidden sm:block">Fecha</span>
        </div>

        {/* Rows */}
        {scores.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="font-pixel text-xs text-gray-500">SIN PUNTUACIONES AÚN</p>
            <p className="font-mono text-xs text-gray-600 mt-2">¡Sé el primero en marcar récord!</p>
          </div>
        ) : (
          <div>
            {scores.map((row, i) => {
              const medal = getMedalStyle(i);
              const isUser = user && row.user_id === user.id;
              return (
                <div
                  key={row.id}
                  className={`grid grid-cols-[60px_1fr_120px_100px] sm:grid-cols-[80px_1fr_160px_120px] gap-2 px-4 py-3 items-center border-b border-vault-border/50 transition-all animate-stagger-in ${
                    isUser ? 'bg-neon-cyan/5' : 'hover:bg-vault-bg/50'
                  } ${i < 3 ? medal.bg : ''}`}
                  style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
                >
                  <div className="flex items-center gap-1">
                    <medal.icon className={`w-4 h-4 ${medal.color}`} />
                    <span className={`font-pixel text-[10px] ${medal.color}`}>{i + 1}</span>
                  </div>
                  <span className={`font-mono text-sm truncate ${isUser ? 'text-neon-cyan' : 'text-gray-300'}`}>
                    {row.player_name}
                    {isUser && <span className="ml-2 font-pixel text-[8px] text-neon-cyan">TÚ</span>}
                  </span>
                  <span className={`font-pixel text-xs text-right ${i < 3 ? medal.color : 'text-white'}`}>
                    {row.score.toLocaleString()}
                  </span>
                  <span className="font-mono text-[10px] text-gray-500 text-right hidden sm:block">
                    {formatDate(row.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
