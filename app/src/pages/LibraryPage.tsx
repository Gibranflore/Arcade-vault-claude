import { useState, useRef, useMemo, useEffect } from 'react';
import { Search, Play, Trophy } from 'lucide-react';
import { GAMES, type GameDef, type GameCategory } from '../lib/games';
import { fetchLeaderboard } from '../lib/scores';
import type { ScoreRow } from '../lib/supabase';

type LibraryPageProps = {
  onSelectGame: (game: GameDef) => void;
};

const CATEGORIES: (GameCategory | 'Todos')[] = ['Todos', 'Clásico', 'Acción', 'Puzzle', 'Arcade'];

const accentMap = {
  cyan: { text: 'text-neon-cyan', border: 'border-neon-cyan', hoverBorder: 'hover:border-neon-cyan', shadow: 'rgba(0,245,255', bg: 'bg-neon-cyan/10' },
  magenta: { text: 'text-neon-magenta', border: 'border-neon-magenta', hoverBorder: 'hover:border-neon-magenta', shadow: 'rgba(255,0,110', bg: 'bg-neon-magenta/10' },
  yellow: { text: 'text-neon-yellow', border: 'border-neon-yellow', hoverBorder: 'hover:border-neon-yellow', shadow: 'rgba(245,255,0', bg: 'bg-neon-yellow/10' },
  green: { text: 'text-neon-green', border: 'border-neon-green', hoverBorder: 'hover:border-neon-green', shadow: 'rgba(57,255,20', bg: 'bg-neon-green/10' },
};

function GameCard({ game, onSelect }: { game: GameDef; onSelect: (g: GameDef) => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [highScore, setHighScore] = useState<ScoreRow | null>(null);
  const a = accentMap[game.accent];

  useEffect(() => {
    fetchLeaderboard(game.id, 1).then((rows) => setHighScore(rows[0] ?? null));
  }, [game.id]);

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
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onClick={() => onSelect(game)}
      className="card-3d group relative bg-vault-panel border-2 border-vault-border rounded-lg overflow-hidden cursor-pointer hover:shadow-[0_0_30px_var(--glow)] transition-all duration-300"
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

        <button
          className={`btn-pixel w-full ${a.text} border-2 ${a.border} group-hover:bg-white/5 transition-all active:scale-95`}
          style={{ ['--glow' as string]: `${a.shadow},0.4)` }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(game);
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <Play className="w-3 h-3" />
            JUGAR
          </span>
        </button>
      </div>
    </div>
  );
}

export function LibraryPage({ onSelectGame }: LibraryPageProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<GameCategory | 'Todos'>('Todos');

  const filtered = useMemo(() => {
    return GAMES.filter((g) => {
      const matchesSearch =
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'Todos' || g.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-10 pt-4">
        <h1 className="font-pixel text-2xl sm:text-4xl md:text-5xl text-neon-cyan animate-flicker mb-4 leading-tight">
          ARCADE VAULT
        </h1>
        <p className="font-mono text-sm sm:text-base text-gray-400 uppercase tracking-widest">
          Inserta una moneda para jugar
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" style={{ boxShadow: '0 0 6px #00f5ff' }} />
          <span className="w-2 h-2 bg-neon-magenta rounded-full animate-pulse" style={{ animationDelay: '0.3s', boxShadow: '0 0 6px #ff006e' }} />
          <span className="w-2 h-2 bg-neon-yellow rounded-full animate-pulse" style={{ animationDelay: '0.6s', boxShadow: '0 0 6px #f5ff00' }} />
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar juegos..."
            className="w-full bg-vault-panel border border-vault-border rounded pl-10 pr-3 py-2.5 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,245,255,0.3)] transition-all"
          />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-wide rounded transition-all active:scale-95 ${
                category === cat
                  ? 'text-neon-cyan border border-neon-cyan bg-neon-cyan/10'
                  : 'text-gray-400 border border-vault-border hover:border-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-pixel text-sm text-gray-500">NO SE ENCONTRARON JUEGOS</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} onSelect={onSelectGame} />
          ))}
        </div>
      )}
    </div>
  );
}
