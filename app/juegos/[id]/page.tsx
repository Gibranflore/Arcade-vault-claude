'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { getGame } from '@/app/lib/games';
import { GameDetail } from '@/app/components/GameDetail';

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const game = getGame(id);

  if (!game) notFound();

  return <GameDetail game={game} />;
}
