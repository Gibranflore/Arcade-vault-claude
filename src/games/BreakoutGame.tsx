import { useRef, useEffect, useState, useCallback } from 'react';
import type { GameProps } from './types';

const W = 480;
const H = 360;
const PADDLE_W = 80;
const PADDLE_H = 12;
const BALL_R = 6;
const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const BRICK_H = 16;
const BRICK_PAD = 4;
const BRICK_TOP = 40;

export function BreakoutGame({ onScore, onLives, onLevel, onGameOver, onReady, isPaused }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);

  const stateRef = useRef({
    paddleX: W / 2 - PADDLE_W / 2,
    ballX: W / 2,
    ballY: H - 50,
    dx: 3,
    dy: -3,
    bricks: [] as { x: number; y: number; alive: boolean; color: string }[],
    score: 0,
    lives: 3,
    level: 1,
    dead: false,
    won: false,
  });

  const colors = ['#ff006e', '#f5ff00', '#00f5ff', '#39ff14', '#ff8c00'];

  const initBricks = useCallback((level: number) => {
    const bricks = [];
    const brickW = (W - BRICK_PAD * (BRICK_COLS + 1)) / BRICK_COLS;
    const rows = Math.min(BRICK_ROWS + Math.floor(level / 2), 7);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: c * (brickW + BRICK_PAD) + BRICK_PAD,
          y: r * (BRICK_H + BRICK_PAD) + BRICK_TOP,
          alive: true,
          color: colors[r % colors.length],
        });
      }
    }
    return bricks;
  }, []);

  const reset = useCallback((fullReset: boolean) => {
    const s = stateRef.current;
    s.paddleX = W / 2 - PADDLE_W / 2;
    s.ballX = W / 2;
    s.ballY = H - 50;
    const speed = 3 + (s.level - 1) * 0.5;
    s.dx = speed * (Math.random() > 0.5 ? 1 : -1);
    s.dy = -speed;
    if (fullReset) {
      s.score = 0;
      s.lives = 3;
      s.level = 1;
      onScore(0);
      onLives(3);
      onLevel(1);
    }
    s.bricks = initBricks(s.level);
    s.dead = false;
    s.won = false;
  }, [initBricks, onScore, onLives, onLevel]);

  const start = useCallback(() => {
    reset(true);
    setRunning(true);
  }, [reset]);

  const pause = useCallback(() => {}, []);
  const resume = useCallback(() => {}, []);

  useEffect(() => {
    onReady({ start, pause, resume, reset: () => { reset(true); setRunning(true); } });
  }, [onReady, start, pause, resume, reset]);

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let lastTime = 0;

    const update = (time: number) => {
      const s = stateRef.current;
      const dt = time - lastTime;
      lastTime = time;

      if (!isPaused && !s.dead && !s.won && dt >= 16) {
        // Ball movement
        s.ballX += s.dx;
        s.ballY += s.dy;

        // Wall collisions
        if (s.ballX - BALL_R < 0) { s.ballX = BALL_R; s.dx = -s.dx; }
        if (s.ballX + BALL_R > W) { s.ballX = W - BALL_R; s.dx = -s.dx; }
        if (s.ballY - BALL_R < 0) { s.ballY = BALL_R; s.dy = -s.dy; }

        // Paddle collision
        if (
          s.ballY + BALL_R > H - 20 &&
          s.ballY + BALL_R < H - 8 &&
          s.ballX > s.paddleX &&
          s.ballX < s.paddleX + PADDLE_W &&
          s.dy > 0
        ) {
          s.dy = -Math.abs(s.dy);
          const hit = (s.ballX - (s.paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
          s.dx = hit * 4;
        }

        // Bottom = lose life
        if (s.ballY - BALL_R > H) {
          s.lives--;
          onLives(s.lives);
          if (s.lives <= 0) {
            s.dead = true;
            onGameOver();
            setRunning(false);
            return;
          } else {
            s.paddleX = W / 2 - PADDLE_W / 2;
            s.ballX = W / 2;
            s.ballY = H - 50;
            s.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
            s.dy = -3;
          }
        }

        // Brick collisions
        for (const brick of s.bricks) {
          if (!brick.alive) continue;
          if (
            s.ballX + BALL_R > brick.x &&
            s.ballX - BALL_R < brick.x + (W - BRICK_PAD * (BRICK_COLS + 1)) / BRICK_COLS &&
            s.ballY + BALL_R > brick.y &&
            s.ballY - BALL_R < brick.y + BRICK_H
          ) {
            brick.alive = false;
            s.dy = -s.dy;
            s.score += 10;
            onScore(s.score);
            break;
          }
        }

        // Win check
        if (s.bricks.every((b) => !b.alive)) {
          s.won = true;
          s.level++;
          onLevel(s.level);
          setTimeout(() => {
            reset(false);
          }, 500);
        }
      }

      // Draw
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, W, H);

      // Bricks
      const brickW = (W - BRICK_PAD * (BRICK_COLS + 1)) / BRICK_COLS;
      for (const brick of s.bricks) {
        if (!brick.alive) continue;
        ctx.fillStyle = brick.color;
        ctx.shadowColor = brick.color;
        ctx.shadowBlur = 5;
        ctx.fillRect(brick.x, brick.y, brickW, BRICK_H);
      }
      ctx.shadowBlur = 0;

      // Paddle
      ctx.fillStyle = '#00f5ff';
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(s.paddleX, H - 20, PADDLE_W, PADDLE_H);
      ctx.shadowBlur = 0;

      // Ball
      ctx.fillStyle = '#f5ff00';
      ctx.shadowColor = '#f5ff00';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [running, isPaused, onScore, onLives, onLevel, onGameOver, reset]);

  // Mouse / touch controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const move = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const scale = W / rect.width;
      const x = (clientX - rect.left) * scale;
      stateRef.current.paddleX = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W / 2));
    };
    const onMouse = (e: MouseEvent) => move(e.clientX);
    const onTouch = (e: TouchEvent) => { e.preventDefault(); move(e.touches[0].clientX); };
    canvas.addEventListener('mousemove', onMouse);
    canvas.addEventListener('touchmove', onTouch);
    return () => {
      canvas.removeEventListener('mousemove', onMouse);
      canvas.removeEventListener('touchmove', onTouch);
    };
  }, []);

  // Keyboard fallback
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') s.paddleX = Math.max(0, s.paddleX - 20);
      else if (k === 'arrowright' || k === 'd') s.paddleX = Math.min(W - PADDLE_W, s.paddleX + 20);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
