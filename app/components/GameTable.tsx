"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import type { GameDef } from "@/app/lib/games";
import { getLeaderboard, type ScoreRow } from "@/app/lib/scores";

const accentMap = {
  cyan: "text-neon-cyan",
  magenta: "text-neon-magenta",
  yellow: "text-neon-yellow",
  green: "text-neon-green",
};

function GameTableRow({ game }: { game: GameDef }) {
  const [highScore, setHighScore] = useState<ScoreRow | null>(null);
  const a = accentMap[game.accent];

  useEffect(() => {
    let cancelled = false;
    getLeaderboard(game.id, 1).then((result) => {
      if (!cancelled) setHighScore(result[0] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [game.id]);

  return (
    <Link
      href={`/juegos/${game.id}`}
      className="grid grid-cols-[1fr_100px_70px_1fr_120px] sm:grid-cols-[1fr_120px_80px_1fr_140px] gap-2 px-4 py-3 items-center border-b border-vault-border/50 hover:bg-vault-bg/50 transition-all"
    >
      <div className="flex items-center gap-2">
        <game.icon className="w-4 h-4 shrink-0" style={{ color: game.color }} />
        <span className={`font-pixel text-[10px] ${a} truncate`}>
          {game.title}
        </span>
      </div>
      <span className="font-mono text-xs text-gray-400 uppercase truncate">
        {game.category}
      </span>
      <span className="font-mono text-xs text-gray-500">{game.year}</span>
      <span className="font-mono text-xs text-gray-400 truncate">
        {game.controls}
      </span>
      <span className="flex items-center gap-1.5 font-mono text-xs text-gray-300">
        {highScore ? (
          <>
            <Trophy className="w-3 h-3 text-neon-yellow/70 shrink-0" />
            {highScore.score.toLocaleString()}
          </>
        ) : (
          <span className="text-gray-600">—</span>
        )}
      </span>
    </Link>
  );
}

export function GameTable({ games }: { games: GameDef[] }) {
  if (games.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-pixel text-sm text-gray-500">
          NO SE ENCONTRARON JUEGOS
        </p>
      </div>
    );
  }

  return (
    <div className="bg-vault-panel border-2 border-vault-border rounded-lg overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="grid grid-cols-[1fr_100px_70px_1fr_120px] sm:grid-cols-[1fr_120px_80px_1fr_140px] gap-2 px-4 py-3 border-b border-vault-border bg-vault-bg/50">
          <span className="font-pixel text-[10px] text-gray-500 uppercase">
            Título
          </span>
          <span className="font-pixel text-[10px] text-gray-500 uppercase">
            Categoría
          </span>
          <span className="font-pixel text-[10px] text-gray-500 uppercase">
            Año
          </span>
          <span className="font-pixel text-[10px] text-gray-500 uppercase">
            Controles
          </span>
          <span className="font-pixel text-[10px] text-gray-500 uppercase">
            Mejor puntaje
          </span>
        </div>
        {games.map((game) => (
          <GameTableRow key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
