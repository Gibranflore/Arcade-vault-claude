export type GameProps = {
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: () => void;
  onReady: (handle: GameHandle) => void;
  isPaused: boolean;
};

export type GameHandle = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
};
