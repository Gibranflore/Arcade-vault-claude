'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { GAMES, COMING_SOON_GAMES, type GameCategory } from '@/app/lib/games';
import { GameCard, ComingSoonCard } from '@/app/components/GameCard';

const CATEGORIES: (GameCategory | 'Todos')[] = ['Todos', 'Clásico', 'Acción', 'Puzzle', 'Arcade'];

export default function Home() {
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
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {/* Próximamente */}
      {COMING_SOON_GAMES.length > 0 && (
        <div className="mt-16">
          <div className="text-center mb-6">
            <h2 className="font-pixel text-lg sm:text-xl text-gray-400">PRÓXIMAMENTE</h2>
            <p className="font-mono text-xs text-gray-600 mt-2">Más juegos llegando pronto a la bóveda</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {COMING_SOON_GAMES.map((game) => (
              <ComingSoonCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
