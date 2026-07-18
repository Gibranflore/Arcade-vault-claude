'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Play, Trophy } from 'lucide-react';
import type { GameDef } from '@/app/lib/games';
import { getLeaderboard } from '@/app/lib/scores';

const accentMap = {
  cyan: { text: 'text-neon-cyan', border: 'border-neon-cyan', shadow: 'rgba(0,245,255' },
  magenta: { text: 'text-neon-magenta', border: 'border-neon-magenta', shadow: 'rgba(255,0,110' },
  yellow: { text: 'text-neon-yellow', border: 'border-neon-yellow', shadow: 'rgba(245,255,0' },
  green: { text: 'text-neon-green', border: 'border-neon-green', shadow: 'rgba(57,255,20' },
};

export function GameCard({ game }: { game: GameDef }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const highScore = getLeaderboard(game.id, 1)[0] ?? null;
  const a = accentMap[game.accent];

  const handleMove = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const ry = ((x - cx) / cx) * 8;
    const rx = -((y - cy) / cy) * 8;
    setTilt({ rx, ry });
  };

  const handleLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <Link
      href={`/juegos/${game.id}`}
      ref={cardRef}
      onMouseMove={handleMove}
      className="card-3d group relative block bg-vault-panel border-2 border-vault-border rounded-lg overflow-hidden cursor-pointer hover:shadow-[0_0_30px_var(--glow)] transition-all duration-300"
      style={{
        transform: `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        ['--glow' as string]: `${a.shadow},0.3)`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = game.color;
        e.currentTarget.style.boxShadow = `0 0 30px ${a.shadow},0.3)`;
      }}
      onMouseLeave={(e) => {
        handleLeave();
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative h-40 sm:h-44 flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${game.color}22, ${game.color}05, #0a0a0f)`,
        }}
      >
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(${game.color}33 1px, transparent 1px), linear-gradient(90deg, ${game.color}33 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
        <game.icon
          className="w-16 h-16 relative z-10 transition-transform duration-300 group-hover:scale-125"
          style={{ color: game.color, filter: `drop-shadow(0 0 10px ${game.color})` }}
        />
        {/* Year badge */}
        <span className="absolute top-2 left-2 font-pixel text-[8px] text-gray-400 bg-black/50 px-2 py-1 rounded">
          {game.year}
        </span>
        {/* High score badge */}
        {highScore && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded">
            <Trophy className="w-3 h-3 text-neon-yellow" />
            <span className="font-pixel text-[8px] text-neon-yellow">{highScore.score.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-pixel text-xs ${a.text} leading-tight`}>{game.title}</h3>
          <span className="font-mono text-[10px] text-gray-500 uppercase whitespace-nowrap mt-1">{game.category}</span>
        </div>
        <p className="font-mono text-xs text-gray-400 leading-relaxed line-clamp-2">{game.description}</p>

        {/* High score label */}
        {highScore && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500">
            <Trophy className="w-3 h-3 text-neon-yellow/70" />
            <span>MEJOR PUNTUACIÓN: <span className="text-gray-300">{highScore.player_name}</span></span>
          </div>
        )}

        <span
          className={`btn-pixel w-full ${a.text} border-2 ${a.border} group-hover:bg-white/5 transition-all active:scale-95 flex items-center justify-center gap-2`}
        >
          <Play className="w-3 h-3" />
          JUGAR
        </span>
      </div>
    </Link>
  );
}

export function ComingSoonCard({ game }: { game: GameDef }) {
  return (
    <div className="relative bg-vault-panel/60 border-2 border-vault-border rounded-lg overflow-hidden opacity-60 grayscale cursor-not-allowed select-none">
      <div
        className="relative h-40 sm:h-44 flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${game.color}22, ${game.color}05, #0a0a0f)` }}
      >
        <game.icon className="w-16 h-16 relative z-10" style={{ color: game.color }} />
        <span className="absolute top-2 left-2 font-pixel text-[8px] text-gray-400 bg-black/50 px-2 py-1 rounded">
          {game.year}
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-pixel text-xs text-gray-300 leading-tight">{game.title}</h3>
          <span className="font-mono text-[10px] text-gray-500 uppercase whitespace-nowrap mt-1">{game.category}</span>
        </div>
        <p className="font-mono text-xs text-gray-500 leading-relaxed line-clamp-2">{game.description}</p>
        <span className="btn-pixel w-full text-gray-500 border-2 border-vault-border flex items-center justify-center gap-2">
          PRÓXIMAMENTE
        </span>
      </div>
    </div>
  );
}
