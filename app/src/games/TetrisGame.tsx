import { useRef, useEffect, useState, useCallback } from 'react';
import type { GameProps } from './types';

const COLS = 10;
const ROWS = 20;
const CELL = 24;
const W = COLS * CELL; // 240
const H = ROWS * CELL; // 480

type Cell = number; // 0 = empty, 1-7 = color index
type Piece = {
  shape: number[][];
  x: number;
  y: number;
  type: number;
};

const SHAPES: number[][][] = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]], // Z
  [[1, 0, 0], [1, 1, 1]], // J
  [[0, 0, 1], [1, 1, 1]], // L
];

const COLORS = ['#00f5ff', '#f5ff00', '#ff006e', '#39ff14', '#ff8c00', '#ff4444', '#4488ff'];

export function TetrisGame({ onScore, onLives, onLevel, onGameOver, onReady, isPaused }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);

  const stateRef = useRef({
    board: [] as Cell[][],
    piece: null as Piece | null,
    nextType: 0,
    score: 0,
    lives: 3,
    level: 1,
    dead: false,
    dropTimer: 0,
  });

  const newPiece = useCallback((type: number): Piece => {
    return {
      shape: SHAPES[type].map((r) => [...r]),
      x: Math.floor(COLS / 2) - Math.ceil(SHAPES[type][0].length / 2),
      y: 0,
      type,
    };
  }, []);

  const initBoard = useCallback(() => {
    return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0));
  }, []);

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.board = initBoard();
    s.nextType = Math.floor(Math.random() * SHAPES.length);
    s.piece = newPiece(Math.floor(Math.random() * SHAPES.length));
    s.score = 0;
    s.lives = 3;
    s.level = 1;
    s.dead = false;
    s.dropTimer = 0;
    onScore(0);
    onLives(3);
    onLevel(1);
  }, [initBoard, newPiece, onScore, onLives, onLevel]);

  const start = useCallback(() => { reset(); setRunning(true); }, [reset]);
  const pause = useCallback(() => {}, []);
  const resume = useCallback(() => {}, []);

  useEffect(() => {
    onReady({ start, pause, resume, reset: () => { reset(); setRunning(true); } });
  }, [onReady, start, pause, resume, reset]);

  const isValid = (piece: Piece, board: Cell[][], dx = 0, dy = 0, shape?: number[][]): boolean => {
    const s = shape ?? piece.shape;
    for (let r = 0; r < s.length; r++) {
      for (let c = 0; c < s[r].length; c++) {
        if (!s[r][c]) continue;
        const nx = piece.x + c + dx;
        const ny = piece.y + r + dy;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
        if (ny >= 0 && board[ny][nx]) return false;
      }
    }
    return true;
  };

  const rotate = (shape: number[][]): number[][] => {
    const rows = shape.length;
    const cols = shape[0].length;
    const result: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        result[c][rows - 1 - r] = shape[r][c];
      }
    }
    return result;
  };

  const lockPiece = useCallback(() => {
    const s = stateRef.current;
    if (!s.piece) return;
    const p = s.piece;
    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (p.shape[r][c]) {
          const ny = p.y + r;
          const nx = p.x + c;
          if (ny < 0) {
            // Game over
            s.dead = true;
            onGameOver();
            setRunning(false);
            return;
          }
          s.board[ny][nx] = p.type + 1;
        }
      }
    }

    // Check lines
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (s.board[r].every((c) => c !== 0)) {
        s.board.splice(r, 1);
        s.board.unshift(Array(COLS).fill(0));
        cleared++;
        r++; // recheck same row
      }
    }

    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800][cleared] * s.level;
      s.score += points;
      onScore(s.score);
      // Level up every 10 lines
      const newLevel = Math.floor(s.score / 1000) + 1;
      if (newLevel > s.level) {
        s.level = newLevel;
        onLevel(s.level);
      }
    }

    // Spawn next
    s.piece = newPiece(s.nextType);
    s.nextType = Math.floor(Math.random() * SHAPES.length);
    if (!isValid(s.piece, s.board)) {
      s.dead = true;
      onGameOver();
      setRunning(false);
    }
  }, [newPiece, onScore, onLevel, onGameOver]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s.piece || s.dead) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') {
        if (isValid(s.piece, s.board, -1, 0)) s.piece.x--;
      } else if (k === 'arrowright' || k === 'd') {
        if (isValid(s.piece, s.board, 1, 0)) s.piece.x++;
      } else if (k === 'arrowdown' || k === 's') {
        if (isValid(s.piece, s.board, 0, 1)) s.piece.y++;
      } else if (k === 'arrowup' || k === 'w') {
        const rotated = rotate(s.piece.shape);
        if (isValid(s.piece, s.board, 0, 0, rotated)) s.piece.shape = rotated;
      } else if (k === ' ') {
        e.preventDefault();
        while (isValid(s.piece, s.board, 0, 1)) s.piece.y++;
        lockPiece();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lockPiece]);

  // Game loop
  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let last = 0;

    const update = (time: number) => {
      const s = stateRef.current;
      const dt = time - last;
      last = time;

      if (!isPaused && !s.dead && s.piece) {
        s.dropTimer += dt;
        const dropInterval = Math.max(200, 800 - (s.level - 1) * 60);
        if (s.dropTimer >= dropInterval) {
          s.dropTimer = 0;
          if (isValid(s.piece, s.board, 0, 1)) {
            s.piece.y++;
          } else {
            lockPiece();
          }
        }
      }

      // Draw
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = '#11111a';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL, 0);
        ctx.lineTo(i * CELL, H);
        ctx.stroke();
      }
      for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * CELL);
        ctx.lineTo(W, i * CELL);
        ctx.stroke();
      }

      // Board
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (s.board[r][c]) {
            ctx.fillStyle = COLORS[s.board[r][c] - 1];
            ctx.shadowColor = COLORS[s.board[r][c] - 1];
            ctx.shadowBlur = 4;
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          }
        }
      }
      ctx.shadowBlur = 0;

      // Current piece
      if (s.piece) {
        ctx.fillStyle = COLORS[s.piece.type];
        ctx.shadowColor = COLORS[s.piece.type];
        ctx.shadowBlur = 6;
        for (let r = 0; r < s.piece.shape.length; r++) {
          for (let c = 0; c < s.piece.shape[r].length; c++) {
            if (s.piece.shape[r][c]) {
              ctx.fillRect((s.piece.x + c) * CELL + 1, (s.piece.y + r) * CELL + 1, CELL - 2, CELL - 2);
            }
          }
        }
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [running, isPaused, lockPiece]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="max-w-full max-h-full"
      style={{ imageRendering: 'pixelated', width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
}
