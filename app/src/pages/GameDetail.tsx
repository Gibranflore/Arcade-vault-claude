import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Trophy, Gamepad2 } from 'lucide-react';
import type { GameDef } from '../lib/games';
import { fetchLeaderboard } from '../lib/scores';
import type { ScoreRow } from '../lib/supabase';
import { useAuth } from '../lib/auth';

type GameDetailProps = {
  game: GameDef;
  onPlay: () => void;
  onBack: () => void;
};

const accentMap = {
  cyan: { text: 'text-neon-cyan', border: 'border-neon-cyan', bg: 'bg-neon-cyan/10', shadow: 'rgba(0,245,255' },
  magenta: { text: 'text-neon-magenta', border: 'border-neon-magenta', bg: 'bg-neon-magenta/10', shadow: 'rgba(255,0,110' },
  yellow: { text: 'text-neon-yellow', border: 'border-neon-yellow', bg: 'bg-neon-yellow/10', shadow: 'rgba(245,255,0' },
  green: { text: 'text-neon-green', border: 'border-neon-green', bg: 'bg-neon-green/10', shadow: 'rgba(57,255,20' },
};

export function GameDetail({ game, onPlay, onBack }: GameDetailProps) {
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const a = accentMap[game.accent];

  useEffect(() => {
    fetchLeaderboard(game.id, 10).then((rows) => {
      setScores(rows);
      setLoading(false);
    });
  }, [game.id]);

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 font-mono text-sm text-gray-400 hover:text-neon-cyan transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        VOLVER AL VAULT
      </button>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Main */}
        <div className="space-y-6">
          {/* Title section */}
          <div className="relative bg-vault-panel border-2 border-vault-border rounded-lg p-6 sm:p-8 overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `linear-gradient(${game.color}55 1px, transparent 1px), linear-gradient(90deg, ${game.color}55 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />
            <div className="relative flex flex-col sm:flex-row items-start gap-6">
              <div
                className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center rounded-lg border-2 flex-shrink-0"
                style={{ borderColor: game.color, background: `${game.color}11` }}
              >
                <game.icon className="w-12 h-12 sm:w-16 sm:h-16" style={{ color: game.color, filter: `drop-shadow(0 0 12px ${game.color})` }} />
              </div>
              <div className="flex-1">
                <span className="font-mono text-xs text-gray-500 uppercase tracking-wide">{game.category} · {game.year}</span>
                <h1 className={`font-pixel text-xl sm:text-2xl ${a.text} mt-2 mb-3 leading-tight`}>{game.title}</h1>
                <p className="font-mono text-sm text-gray-300 leading-relaxed">{game.longDescription}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-vault-bg border border-vault-border rounded">
                    <Gamepad2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-mono text-xs text-gray-400">{game.controls}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Play button */}
          <button
            onClick={onPlay}
            className={`btn-pixel w-full ${a.text} border-2 ${a.border} text-base py-4 hover:bg-white/5 transition-all animate-pulse-glow active:scale-95`}
            style={{ ['--glow' as string]: `${a.shadow},0.4)` }}
          >
            <span className="flex items-center justify-center gap-3">
              <Play className="w-5 h-5" />
              JUGAR AHORA
            </span>
          </button>
        </div>

        {/* Leaderboard sidebar */}
        <div className="bg-vault-panel border-2 border-vault-border rounded-lg p-5 h-fit">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-vault-border">
            <Trophy className="w-5 h-5 text-neon-yellow" />
            <h2 className="font-pixel text-xs text-neon-yellow">MEJORES PUNTUACIONES</h2>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-vault-bg rounded animate-pulse" />
              ))}
            </div>
          ) : scores.length === 0 ? (
            <p className="font-mono text-xs text-gray-500 text-center py-8">
              Aún no hay puntuaciones. ¡Sé el primero!
            </p>
          ) : (
            <div className="space-y-1.5">
              {scores.map((row, i) => {
                const isUser = user && row.user_id === user.id;
                const medal = i === 0 ? 'text-neon-yellow' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500';
                return (
                  <div
                    key={row.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded font-mono text-xs transition-colors ${
                      isUser ? 'bg-neon-cyan/10 border border-neon-cyan/30' : 'hover:bg-vault-bg'
                    }`}
                  >
                    <span className={`font-pixel text-[10px] ${medal} w-6 text-center`}>{i + 1}</span>
                    <span className="flex-1 text-gray-300 truncate">{row.player_name}</span>
                    <span className="text-white font-bold">{row.score.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
