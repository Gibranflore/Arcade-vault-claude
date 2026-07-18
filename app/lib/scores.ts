export type ScoreRow = {
  id: string;
  game_id: string;
  player_name: string;
  score: number;
  user_id: string | null;
  created_at: string;
};

export const MOCK_SCORES: Record<string, ScoreRow[]> = {
  snake: [
    { id: 'snake-1', game_id: 'snake', player_name: 'NEO_VIPER', score: 4820, user_id: 'u1', created_at: '2026-06-02T10:15:00Z' },
    { id: 'snake-2', game_id: 'snake', player_name: 'PIXELQUEEN', score: 4310, user_id: 'u2', created_at: '2026-06-05T14:02:00Z' },
    { id: 'snake-3', game_id: 'snake', player_name: 'GLITCHRUNNER', score: 3990, user_id: null, created_at: '2026-06-08T09:44:00Z' },
    { id: 'snake-4', game_id: 'snake', player_name: 'RETROFOX', score: 3650, user_id: 'u3', created_at: '2026-06-10T18:20:00Z' },
    { id: 'snake-5', game_id: 'snake', player_name: 'SCANLINE', score: 3210, user_id: null, created_at: '2026-06-12T11:05:00Z' },
    { id: 'snake-6', game_id: 'snake', player_name: 'BYTEBANDIT', score: 2870, user_id: 'u4', created_at: '2026-06-14T20:30:00Z' },
    { id: 'snake-7', game_id: 'snake', player_name: 'CRTKID', score: 2440, user_id: null, created_at: '2026-06-16T08:12:00Z' },
  ],
  breakout: [
    { id: 'breakout-1', game_id: 'breakout', player_name: 'BRICKWIZARD', score: 9120, user_id: 'u5', created_at: '2026-06-01T12:00:00Z' },
    { id: 'breakout-2', game_id: 'breakout', player_name: 'PADDLEMASTER', score: 8450, user_id: 'u2', created_at: '2026-06-04T16:45:00Z' },
    { id: 'breakout-3', game_id: 'breakout', player_name: 'VOIDBOUNCE', score: 7600, user_id: null, created_at: '2026-06-07T13:22:00Z' },
    { id: 'breakout-4', game_id: 'breakout', player_name: 'NEONSHARD', score: 6980, user_id: 'u1', created_at: '2026-06-09T19:10:00Z' },
    { id: 'breakout-5', game_id: 'breakout', player_name: 'ARCADEGHOST', score: 6320, user_id: null, created_at: '2026-06-11T07:55:00Z' },
    { id: 'breakout-6', game_id: 'breakout', player_name: 'STATICPULSE', score: 5710, user_id: 'u6', created_at: '2026-06-13T21:40:00Z' },
  ],
  tetris: [
    { id: 'tetris-1', game_id: 'tetris', player_name: 'BLOCKSAGE', score: 128400, user_id: 'u3', created_at: '2026-06-02T09:30:00Z' },
    { id: 'tetris-2', game_id: 'tetris', player_name: 'LINECLEAR_X', score: 115200, user_id: 'u1', created_at: '2026-06-05T17:18:00Z' },
    { id: 'tetris-3', game_id: 'tetris', player_name: 'TSPINQUEEN', score: 98700, user_id: null, created_at: '2026-06-08T22:05:00Z' },
    { id: 'tetris-4', game_id: 'tetris', player_name: 'DROPZONE', score: 87650, user_id: 'u7', created_at: '2026-06-10T10:50:00Z' },
    { id: 'tetris-5', game_id: 'tetris', player_name: 'STACKGOBLIN', score: 76300, user_id: null, created_at: '2026-06-12T15:33:00Z' },
    { id: 'tetris-6', game_id: 'tetris', player_name: 'PERFECTCLEAR', score: 65900, user_id: 'u2', created_at: '2026-06-15T06:20:00Z' },
    { id: 'tetris-7', game_id: 'tetris', player_name: 'GRAVITYFLUX', score: 54100, user_id: null, created_at: '2026-06-17T12:12:00Z' },
    { id: 'tetris-8', game_id: 'tetris', player_name: 'CYANLOCK', score: 43200, user_id: 'u8', created_at: '2026-06-18T20:05:00Z' },
  ],
};

export function getLeaderboard(gameId: string, limit = 10): ScoreRow[] {
  return (MOCK_SCORES[gameId] ?? [])
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getUserBest(gameId: string, userId: string): ScoreRow | null {
  const best = (MOCK_SCORES[gameId] ?? [])
    .filter((s) => s.user_id === userId)
    .sort((a, b) => b.score - a.score)[0];
  return best ?? null;
}
