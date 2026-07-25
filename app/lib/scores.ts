import { createClient } from "@/app/lib/supabase/client";

export type ScoreRow = {
  id: string;
  game_id: string;
  player_name: string;
  score: number;
  user_id: string | null;
  created_at: string;
};

type ScoreQueryRow = {
  id: string;
  game_id: string;
  user_id: string;
  score: number;
  created_at: string;
  profiles: { username: string } | null;
};

function toScoreRow(row: ScoreQueryRow): ScoreRow {
  return {
    id: row.id,
    game_id: row.game_id,
    player_name: row.profiles?.username ?? "???",
    score: row.score,
    user_id: row.user_id,
    created_at: row.created_at,
  };
}

export async function getLeaderboard(
  gameId: string,
  limit = 10,
): Promise<ScoreRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("scores")
    .select("id, game_id, user_id, score, created_at, profiles(username)")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit)
    .returns<ScoreQueryRow[]>();

  return (data ?? []).map(toScoreRow);
}

export async function getUserBest(
  gameId: string,
  userId: string,
): Promise<ScoreRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("scores")
    .select("id, game_id, user_id, score, created_at, profiles(username)")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .order("score", { ascending: false })
    .limit(1)
    .returns<ScoreQueryRow[]>();

  const best = data?.[0];
  return best ? toScoreRow(best) : null;
}

export async function submitScore(
  gameId: string,
  userId: string,
  score: number,
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("scores")
    .insert({ game_id: gameId, user_id: userId, score });
  return { error: error?.message ?? null };
}
