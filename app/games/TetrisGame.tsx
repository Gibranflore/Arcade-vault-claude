"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { GameProps } from "./types";
import { DEFAULT_TETRIS_SKIN, type TetrisSkin } from "./tetrisSkins";

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const SIDEBAR_W = 150;
const BOARD_W = COLS * BLOCK;
const W = BOARD_W + SIDEBAR_W;
const H = ROWS * BLOCK;

const PIECES = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [2, 2],
    [2, 2],
  ],
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ],
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ],
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ],
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ],
] as const;

const LINE_SCORES = [0, 100, 300, 500, 800];

type Board = number[][];
type Piece = { type: number; shape: number[][]; x: number; y: number };
type GamePhase = "playing" | "gameover";

type TetrisState = {
  board: Board;
  current: Piece;
  next: Piece;
  score: number;
  lines: number;
  level: number;
  phase: GamePhase;
  dropInterval: number;
  dropAccum: number;
};

function createBoard(): Board {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece(): Piece {
  const type = Math.floor(Math.random() * 7) + 1;
  const shape = PIECES[type]!.map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}

function collide(board: Board, shape: number[][], ox: number, oy: number) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape: number[][]) {
  const rows = shape.length;
  const cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate(s: TetrisState) {
  const rotated = rotateCW(s.current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(s.board, rotated, s.current.x + kick, s.current.y)) {
      s.current.shape = rotated;
      s.current.x += kick;
      return;
    }
  }
}

function merge(s: TetrisState) {
  for (let r = 0; r < s.current.shape.length; r++)
    for (let c = 0; c < s.current.shape[r].length; c++)
      if (s.current.shape[r][c])
        s.board[s.current.y + r][s.current.x + c] = s.current.shape[r][c];
}

function clearLines(s: TetrisState) {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (s.board[r].every((v) => v !== 0)) {
      s.board.splice(r, 1);
      s.board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    s.lines += cleared;
    s.score += (LINE_SCORES[cleared] || 0) * s.level;
    s.level = Math.floor(s.lines / 10) + 1;
    s.dropInterval = Math.max(100, 1000 - (s.level - 1) * 90);
  }
}

function ghostY(s: TetrisState) {
  let gy = s.current.y;
  while (!collide(s.board, s.current.shape, s.current.x, gy + 1)) gy++;
  return gy;
}

function createInitialState(): TetrisState {
  return {
    board: createBoard(),
    current: randomPiece(),
    next: randomPiece(),
    score: 0,
    lines: 0,
    level: 1,
    phase: "playing",
    dropInterval: 1000,
    dropAccum: 0,
  };
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colorIndex: number,
  size: number,
  skin: TetrisSkin,
  alpha = 1,
) {
  if (!colorIndex) return;
  const color = skin.pieceColors[colorIndex - 1];
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  ctx.globalAlpha = 1;
}

export function TetrisGame({
  onScore,
  onLives,
  onLevel,
  onGameOver,
  onReady,
  isPaused,
  skin = DEFAULT_TETRIS_SKIN,
}: GameProps & { skin?: TetrisSkin }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const stateRef = useRef(createInitialState());
  const skinRef = useRef(skin);
  useEffect(() => {
    skinRef.current = skin;
  }, [skin]);

  const reset = useCallback(() => {
    stateRef.current = createInitialState();
    onScore(0);
    onLives(1);
    onLevel(1);
  }, [onScore, onLives, onLevel]);

  const start = useCallback(() => {
    reset();
    setRunning(true);
  }, [reset]);
  const pause = useCallback(() => {}, []);
  const resume = useCallback(() => {}, []);

  useEffect(() => {
    onReady({
      start,
      pause,
      resume,
      reset: () => {
        reset();
        setRunning(true);
      },
    });
  }, [onReady, start, pause, resume, reset]);

  const lockPiece = useCallback(
    (s: TetrisState) => {
      merge(s);
      clearLines(s);
      s.current = s.next;
      s.next = randomPiece();
      if (collide(s.board, s.current.shape, s.current.x, s.current.y)) {
        s.phase = "gameover";
        onLives(0);
        onGameOver();
        setRunning(false);
      }
    },
    [onLives, onGameOver],
  );

  const softDrop = useCallback(
    (s: TetrisState) => {
      if (!collide(s.board, s.current.shape, s.current.x, s.current.y + 1)) {
        s.current.y++;
        s.score += 1;
      } else {
        lockPiece(s);
      }
    },
    [lockPiece],
  );

  const hardDrop = useCallback(
    (s: TetrisState) => {
      const gy = ghostY(s);
      s.score += (gy - s.current.y) * 2;
      s.current.y = gy;
      lockPiece(s);
    },
    [lockPiece],
  );

  useEffect(() => {
    if (!running) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (isPaused || s.phase !== "playing") return;
      switch (e.code) {
        case "ArrowLeft":
          if (!collide(s.board, s.current.shape, s.current.x - 1, s.current.y))
            s.current.x--;
          break;
        case "ArrowRight":
          if (!collide(s.board, s.current.shape, s.current.x + 1, s.current.y))
            s.current.x++;
          break;
        case "ArrowDown":
          softDrop(s);
          break;
        case "ArrowUp":
          tryRotate(s);
          break;
        case "Space":
          e.preventDefault();
          hardDrop(s);
          break;
        default:
          return;
      }
      onScore(s.score);
      onLevel(s.level);
    };
    window.addEventListener("keydown", handleKeyDown);

    const canvas = canvasRef.current;
    if (!canvas)
      return () => window.removeEventListener("keydown", handleKeyDown);
    const ctx = canvas.getContext("2d");
    if (!ctx) return () => window.removeEventListener("keydown", handleKeyDown);

    let raf = 0;
    let last: number | null = null;

    const update = (dtMs: number) => {
      const s = stateRef.current;
      if (isPaused || s.phase !== "playing") return;
      s.dropAccum += dtMs;
      if (s.dropAccum >= s.dropInterval) {
        s.dropAccum = 0;
        if (!collide(s.board, s.current.shape, s.current.x, s.current.y + 1)) {
          s.current.y++;
        } else {
          lockPiece(s);
        }
        onScore(s.score);
        onLevel(s.level);
      }
    };

    const draw = () => {
      const s = stateRef.current;
      const skin = skinRef.current;
      ctx.fillStyle = skin.bg;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = skin.gridLine;
      ctx.lineWidth = 0.5;
      for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * BLOCK, 0);
        ctx.lineTo(c * BLOCK, ROWS * BLOCK);
        ctx.stroke();
      }
      for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * BLOCK);
        ctx.lineTo(BOARD_W, r * BLOCK);
        ctx.stroke();
      }

      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          drawBlock(ctx, c, r, s.board[r][c], BLOCK, skin);

      const gy = ghostY(s);
      for (let r = 0; r < s.current.shape.length; r++)
        for (let c = 0; c < s.current.shape[r].length; c++)
          if (s.current.shape[r][c])
            drawBlock(
              ctx,
              s.current.x + c,
              gy + r,
              s.current.shape[r][c],
              BLOCK,
              skin,
              0.2,
            );

      for (let r = 0; r < s.current.shape.length; r++)
        for (let c = 0; c < s.current.shape[r].length; c++)
          if (s.current.shape[r][c])
            drawBlock(
              ctx,
              s.current.x + c,
              s.current.y + r,
              s.current.shape[r][c],
              BLOCK,
              skin,
            );

      ctx.fillStyle = skin.sidebarText;
      ctx.font = "12px monospace";
      ctx.fillText("SIGUIENTE", BOARD_W + 20, 30);

      const NB = 24;
      const shape = s.next.shape;
      const offX = BOARD_W + 20 + Math.floor((4 - shape[0].length) / 2) * NB;
      const offY = 50 + Math.floor((4 - shape.length) / 2) * NB;
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          ctx.globalAlpha = 1;
          ctx.fillStyle = skin.pieceColors[shape[r][c] - 1];
          ctx.fillRect(offX + c * NB + 1, offY + r * NB + 1, NB - 2, NB - 2);
        }
    };

    const loop = (ts: number) => {
      const dt = last === null ? 0 : ts - last;
      last = ts;

      if (!isPaused) update(dt);
      draw();

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(raf);
    };
  }, [running, isPaused, onScore, onLevel, softDrop, hardDrop, lockPiece]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="max-w-full max-h-full"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        touchAction: "none",
      }}
    />
  );
}
