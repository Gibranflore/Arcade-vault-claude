import { useRef, useEffect, useState, useCallback } from 'react';
import type { GameProps } from './types';

const COLS = 19;
const ROWS = 21;
const CELL = 16;
const W = COLS * CELL; // 304
const H = ROWS * CELL; // 336

const MAZE = [
  '###################',
  '#........#........#',
  '#o##.###.#.###.##o#',
  '#.................#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '####.###.#.###.####',
  '   #.#.......#.#   ',
  '####.#.##.##.#.####',
  '    ....#G#....    ',
  '####.#.#####.#.####',
  '   #.#.......#.#   ',
  '####.#.#####.#.####',
  '#........#........#',
  '#.##.###.#.###.##.#',
  '#o.#.....P.....#.o#',
  '##.#.#.#####.#.#.##',
  '#....#...#...#....#',
  '#.######.#.######.#',
  '#.................#',
  '###################',
];

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

type Ghost = { x: number; y: number; color: string; dir: keyof typeof DIRS };

export function PacmanGame({ onScore, onLives, onGameOver, onReady, isPaused }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);

  const stateRef = useRef({
    dots: [] as boolean[][],
    powerPellets: [] as boolean[][],
    px: 9, py: 15,
    dir: 'left' as keyof typeof DIRS,
    nextDir: 'left' as keyof typeof DIRS,
    ghosts: [] as Ghost[],
    score: 0,
    lives: 3,
    dead: false,
    moveTimer: 0,
    powerTimer: 0,
    dotsLeft: 0,
  });

  const initLevel = useCallback(() => {
    const dots: boolean[][] = [];
    const power: boolean[][] = [];
    let dotsLeft = 0;
    for (let r = 0; r < ROWS; r++) {
      dots[r] = [];
      power[r] = [];
      for (let c = 0; c < COLS; c++) {
        const ch = MAZE[r]?.[c] ?? '#';
        if (ch === '.') { dots[r][c] = true; dotsLeft++; }
        else dots[r][c] = false;
        if (ch === 'o') { power[r][c] = true; dotsLeft++; }
        else power[r][c] = false;
      }
    }
    stateRef.current.dots = dots;
    stateRef.current.powerPellets = power;
    stateRef.current.dotsLeft = dotsLeft;
  }, []);

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.px = 9; s.py = 15;
    s.dir = 'left';
    s.nextDir = 'left';
    s.score = 0;
    s.lives = 3;
    s.dead = false;
    s.moveTimer = 0;
    s.powerTimer = 0;
    s.ghosts = [
      { x: 9, y: 9, color: '#ff006e', dir: 'up' },
      { x: 8, y: 9, color: '#00f5ff', dir: 'up' },
      { x: 10, y: 9, color: '#f5ff00', dir: 'up' },
      { x: 9, y: 10, color: '#ff8c00', dir: 'up' },
    ];
    initLevel();
    onScore(0);
    onLives(3);
  }, [initLevel, onScore, onLives]);

  const start = useCallback(() => { reset(); setRunning(true); }, [reset]);
  const pause = useCallback(() => {}, []);
  const resume = useCallback(() => {}, []);

  useEffect(() => {
    onReady({ start, pause, resume, reset: () => { reset(); setRunning(true); } });
  }, [onReady, start, pause, resume, reset]);

  const isWall = (x: number, y: number): boolean => {
    if (y < 0 || y >= ROWS || x < 0 || x >= COLS) return true;
    const ch = MAZE[y]?.[x] ?? '#';
    return ch === '#';
  };

  const canMove = (x: number, y: number, dir: keyof typeof DIRS): boolean => {
    const d = DIRS[dir];
    return !isWall(x + d.x, y + d.y);
  };

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') s.nextDir = 'up';
      else if (k === 'arrowdown' || k === 's') s.nextDir = 'down';
      else if (k === 'arrowleft' || k === 'a') s.nextDir = 'left';
      else if (k === 'arrowright' || k === 'd') s.nextDir = 'right';
      if (['arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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

      if (!isPaused && !s.dead) {
        s.moveTimer += dt;
        if (s.moveTimer >= 150) {
          s.moveTimer = 0;

          // Pacman movement
          if (canMove(s.px, s.py, s.nextDir)) s.dir = s.nextDir;
          if (canMove(s.px, s.py, s.dir)) {
            const d = DIRS[s.dir];
            s.px += d.x;
            s.py += d.y;
            // Tunnel wrap
            if (s.px < 0) s.px = COLS - 1;
            if (s.px >= COLS) s.px = 0;
          }

          // Eat dot
          if (s.dots[s.py]?.[s.px]) {
            s.dots[s.py][s.px] = false;
            s.score += 10;
            s.dotsLeft--;
            onScore(s.score);
          }
          // Eat power pellet
          if (s.powerPellets[s.py]?.[s.px]) {
            s.powerPellets[s.py][s.px] = false;
            s.score += 50;
            s.dotsLeft--;
            s.powerTimer = 5000;
            onScore(s.score);
          }

          // Win
          if (s.dotsLeft <= 0) {
            initLevel();
            s.ghosts.forEach((g, i) => {
              g.x = 8 + i;
              g.y = 9;
            });
          }

          // Ghost movement
          s.ghosts.forEach((g) => {
            const dirs: (keyof typeof DIRS)[] = ['up', 'down', 'left', 'right'];
            const valid = dirs.filter((d) => d !== opposite(g.dir) && canMove(g.x, g.y, d));
            if (valid.length === 0) {
              const rev = opposite(g.dir);
              if (canMove(g.x, g.y, rev)) {
                g.dir = rev;
                const d = DIRS[rev];
                g.x += d.x;
                g.y += d.y;
              }
            } else {
              // Chase or flee
              if (s.powerTimer > 0) {
                // Flee from pacman
                let best = valid[0];
                let bestDist = -1;
                for (const d of valid) {
                  const dd = DIRS[d];
                  const nx = g.x + dd.x;
                  const ny = g.y + dd.y;
                  const dist = Math.abs(nx - s.px) + Math.abs(ny - s.py);
                  if (dist > bestDist) { bestDist = dist; best = d; }
                }
                g.dir = best;
              } else {
                // Move toward pacman
                let best = valid[0];
                let bestDist = Infinity;
                for (const d of valid) {
                  const dd = DIRS[d];
                  const nx = g.x + dd.x;
                  const ny = g.y + dd.y;
                  const dist = Math.abs(nx - s.px) + Math.abs(ny - s.py);
                  if (dist < bestDist) { bestDist = dist; best = d; }
                }
                g.dir = best;
              }
              const d = DIRS[g.dir];
              g.x += d.x;
              g.y += d.y;
              // Tunnel
              if (g.x < 0) g.x = COLS - 1;
              if (g.x >= COLS) g.x = 0;
            }
          });

          // Collision with ghosts
          for (const g of s.ghosts) {
            if (g.x === s.px && g.y === s.py) {
              if (s.powerTimer > 0) {
                // Eat ghost
                s.score += 200;
                onScore(s.score);
                g.x = 9; g.y = 9;
              } else {
                s.lives--;
                onLives(s.lives);
                if (s.lives <= 0) {
                  s.dead = true;
                  onGameOver();
                  setRunning(false);
                } else {
                  s.px = 9; s.py = 15;
                  s.dir = 'left'; s.nextDir = 'left';
                }
              }
            }
          }
        }

        if (s.powerTimer > 0) s.powerTimer -= dt;
      }

      // Draw
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, W, H);

      // Maze
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const ch = MAZE[r]?.[c] ?? '#';
          if (ch === '#') {
            ctx.fillStyle = '#1a1a8e';
            ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
            ctx.fillStyle = '#0a0a3e';
            ctx.fillRect(c * CELL + 2, r * CELL + 2, CELL - 4, CELL - 4);
          }
        }
      }

      // Dots
      ctx.fillStyle = '#f5ff00';
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (s.dots[r]?.[c]) {
            ctx.beginPath();
            ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 2, 0, Math.PI * 2);
            ctx.fill();
          }
          if (s.powerPellets[r]?.[c]) {
            ctx.shadowColor = '#f5ff00';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // Pacman
      ctx.fillStyle = '#f5ff00';
      ctx.shadowColor = '#f5ff00';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      const cx = s.px * CELL + CELL / 2;
      const cy = s.py * CELL + CELL / 2;
      const mouthAngle = Math.sin(time / 100) * 0.3 + 0.3;
      let startAngle = 0;
      if (s.dir === 'right') startAngle = 0;
      else if (s.dir === 'down') startAngle = Math.PI / 2;
      else if (s.dir === 'left') startAngle = Math.PI;
      else if (s.dir === 'up') startAngle = -Math.PI / 2;
      ctx.arc(cx, cy, CELL / 2 - 1, startAngle + mouthAngle, startAngle - mouthAngle + Math.PI * 2);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ghosts
      s.ghosts.forEach((g) => {
        const isFleeing = s.powerTimer > 0;
        ctx.fillStyle = isFleeing ? '#00f5ff' : g.color;
        ctx.shadowColor = isFleeing ? '#00f5ff' : g.color;
        ctx.shadowBlur = 6;
        const gx = g.x * CELL;
        const gy = g.y * CELL;
        ctx.beginPath();
        ctx.arc(gx + CELL / 2, gy + CELL / 2, CELL / 2 - 1, Math.PI, 0);
        ctx.lineTo(gx + CELL, gy + CELL);
        ctx.lineTo(gx, gy + CELL);
        ctx.closePath();
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(gx + 4, gy + 5, 4, 4);
        ctx.fillRect(gx + CELL - 8, gy + 5, 4, 4);
        ctx.shadowBlur = 0;
      });

      raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [running, isPaused, onScore, onLives, onGameOver, initLevel]);

  const opposite = (dir: keyof typeof DIRS): keyof typeof DIRS => {
    return dir === 'up' ? 'down' : dir === 'down' ? 'up' : dir === 'left' ? 'right' : 'left';
  };

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
