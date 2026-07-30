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
};

async function withPlayerNames(rows: ScoreQueryRow[]): Promise<ScoreRow[]> {
  if (rows.length === 0) return [];

  const supabase = createClient();
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", userIds);

  const usernameById = new Map((profiles ?? []).map((p) => [p.id, p.username]));

  return rows.map((row) => ({
    ...row,
    player_name: usernameById.get(row.user_id) ?? "???",
  }));
}

export async function getLeaderboard(
  gameId: string,
  limit = 10,
): Promise<ScoreRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("scores")
    .select("id, game_id, user_id, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit)
    .returns<ScoreQueryRow[]>();

  return withPlayerNames(data ?? []);
}

export async function getUserBest(
  gameId: string,
  userId: string,
): Promise<ScoreRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("scores")
    .select("id, game_id, user_id, score, created_at")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .order("score", { ascending: false })
    .limit(1)
    .returns<ScoreQueryRow[]>();

  const rows = await withPlayerNames(data ?? []);
  return rows[0] ?? null;
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
