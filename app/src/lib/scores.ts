import { supabase, type ScoreRow } from './supabase';
import { GAMES } from './games';

const GUEST_SCORES_KEY = 'arcade_vault_guest_scores';

type GuestScore = {
  id: string;
  game_id: string;
  player_name: string;
  score: number;
  created_at: string;
};

function getGuestScores(): GuestScore[] {
  try {
    return JSON.parse(localStorage.getItem(GUEST_SCORES_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveGuestScores(scores: GuestScore[]) {
  localStorage.setItem(GUEST_SCORES_KEY, JSON.stringify(scores));
}

export async function fetchLeaderboard(gameId: string, limit = 10): Promise<ScoreRow[]> {
  const { data, error } = await supabase
    .from('scores')
    .select('id, game_id, player_name, score, user_id, created_at')
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('Error al cargar tabla de puntuaciones:', error.message);
    return [];
  }
  return (data ?? []) as ScoreRow[];
}

export async function fetchUserBest(gameId: string, userId: string): Promise<ScoreRow | null> {
  const { data, error } = await supabase
    .from('scores')
    .select('id, game_id, player_name, score, user_id, created_at')
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .order('score', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('Error al cargar mejor puntuación:', error.message);
    return null;
  }
  return data as ScoreRow | null;
}

export async function submitScore(
  gameId: string,
  playerName: string,
  score: number,
  userId: string | null,
): Promise<{ success: boolean; error: string | null }> {
  if (score <= 0) return { success: false, error: 'Puntuación inválida' };

  const { error } = await supabase.from('scores').insert({
    game_id: gameId,
    player_name: playerName,
    score,
    user_id: userId,
  });

  if (error) return { success: false, error: error.message };

  // Also store in localStorage for guests
  const guestScores = getGuestScores();
  guestScores.push({
    id: crypto.randomUUID(),
    game_id: gameId,
    player_name: playerName,
    score,
    created_at: new Date().toISOString(),
  });
  saveGuestScores(guestScores);

  return { success: true, error: null };
}

export function getGuestLeaderboard(gameId: string, limit = 10): GuestScore[] {
  return getGuestScores()
    .filter((s) => s.game_id === gameId)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getGameIds(): string[] {
  return GAMES.map((g) => g.id);
}
