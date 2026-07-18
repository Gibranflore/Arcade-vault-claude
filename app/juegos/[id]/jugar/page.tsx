'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { getGame } from '@/app/lib/games';
import { GamePlayer } from '@/app/components/GamePlayer';

export default function GamePlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const game = getGame(id);

  if (!game) notFound();

  return <GamePlayer game={game} />;
}
