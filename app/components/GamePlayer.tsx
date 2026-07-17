'use client';

import Link from 'next/link';
import { X, Clock } from 'lucide-react';
import type { GameDef } from '@/app/lib/games';
import { useAuth } from '@/app/lib/auth';

const accentMap = {
  cyan: 'text-neon-cyan',
  magenta: 'text-neon-magenta',
  yellow: 'text-neon-yellow',
  green: 'text-neon-green',
};

export function GamePlayer({ game }: { game: GameDef }) {
  const { displayName } = useAuth();
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
        </div>
      </div>

      {/* Controls bar */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-3">
        <Link
          href={`/juegos/${game.id}`}
          className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-gray-400 hover:text-neon-magenta border border-vault-border hover:border-neon-magenta/50 rounded transition-all active:scale-95"
        >
          <X className="w-3.5 h-3.5" />
          SALIR
        </Link>
      </div>

      {/* CRT Monitor Bezel */}
      <div className="relative w-full max-w-3xl">
        {/* Outer bezel */}
        <div className="bg-gradient-to-b from-[#1a1a28] to-[#0d0d15] p-3 sm:p-5 rounded-2xl border-2 border-vault-border shadow-2xl">
          {/* Inner screen */}
          <div className="crt-screen relative bg-black rounded-xl overflow-hidden border border-vault-border">
            <div className="relative aspect-[4/3] sm:aspect-[3/2] flex items-center justify-center">
              {/* Próximamente placeholder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 px-4">
                <Clock className="w-14 h-14 mb-4 text-gray-500" />
                <game.icon
                  className="w-16 h-16 mb-4"
                  style={{ color: game.color, filter: `drop-shadow(0 0 15px ${game.color})` }}
                />
                <h2 className={`font-pixel text-lg ${a} mb-2 text-center`}>{game.title}</h2>
                <p className="font-pixel text-sm text-gray-400 mb-4 tracking-wide">PRÓXIMAMENTE</p>
                <p className="font-mono text-xs text-gray-500">Controles: {game.controls}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
