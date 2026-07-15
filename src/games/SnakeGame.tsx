import { useRef, useEffect, useState, useCallback } from 'react';
import type { GameProps } from './types';

const GRID = 20;
const CELL = 16;
const W = GRID * CELL; // 320
const H = GRID * CELL; // 320

type Pt = { x: number; y: number };
type Dir = 'up' | 'down' | 'left' | 'right';

export function SnakeGame({ onScore, onLives, onGameOver, onReady, isPaused }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);

  const stateRef = useRef({
    snake: [] as Pt[],
    dir: 'right' as Dir,
    nextDir: 'right' as Dir,
    food: { x: 10, y: 10 } as Pt,
    score: 0,
    lives: 3,
    dead: false,
    speed: 150,
  });

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
    s.dir = 'right';
    s.nextDir = 'right';
    s.score = 0;
    s.lives = 3;
    s.dead = false;
    s.speed = 150;
    placeFood();
    onScore(0);
    onLives(3);
  }, [onScore, onLives]);

  const placeFood = useCallback(() => {
    const s = stateRef.current;
    let f: Pt;
    do {
      f = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (s.snake.some((p) => p.x === f.x && p.y === f.y));
    s.food = f;
  }, []);

  const start = useCallback(() => {
    reset();
    setRunning(true);
    setPaused(false);
  }, [reset]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  const resetGame = useCallback(() => {
    reset();
    setRunning(true);
    setPaused(false);
  }, [reset]);

  useEffect(() => {
    onReady({ start, pause, resume, reset: resetGame });
  }, [onReady, start, pause, resume, resetGame]);

  useEffect(() => {
    setPaused(isPaused);
  }, [isPaused]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') { if (s.dir !== 'down') s.nextDir = 'up'; }
      else if (k === 'arrowdown' || k === 's') { if (s.dir !== 'up') s.nextDir = 'down'; }
      else if (k === 'arrowleft' || k === 'a') { if (s.dir !== 'right') s.nextDir = 'left'; }
      else if (k === 'arrowright' || k === 'd') { if (s.dir !== 'left') s.nextDir = 'right'; }
      if (['arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Game loop
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      if (paused) return;
      const s = stateRef.current;
      if (s.dead) return;

      s.dir = s.nextDir;
      const head = { ...s.snake[0] };
      if (s.dir === 'up') head.y--;
      else if (s.dir === 'down') head.y++;
      else if (s.dir === 'left') head.x--;
      else if (s.dir === 'right') head.x++;

      // Wall collision
      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
        s.lives--;
        onLives(s.lives);
        if (s.lives <= 0) {
          s.dead = true;
          onGameOver();
          setRunning(false);
        } else {
          s.snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
          s.dir = 'right';
          s.nextDir = 'right';
        }
        return;
      }

      // Self collision
      if (s.snake.some((p) => p.x === head.x && p.y === head.y)) {
        s.lives--;
        onLives(s.lives);
        if (s.lives <= 0) {
          s.dead = true;
          onGameOver();
          setRunning(false);
        } else {
          s.snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
          s.dir = 'right';
          s.nextDir = 'right';
        }
        return;
      }

      s.snake.unshift(head);

      if (head.x === s.food.x && head.y === s.food.y) {
        s.score += 10;
        onScore(s.score);
        placeFood();
        if (s.score % 50 === 0 && s.speed > 60) s.speed -= 10;
      } else {
        s.snake.pop();
      }
    }, stateRef.current.speed);

    return () => clearInterval(interval);
  }, [running, paused, onScore, onLives, onGameOver, placeFood]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const render = () => {
      const s = stateRef.current;
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = '#11111a';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= GRID; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL, 0);
        ctx.lineTo(i * CELL, H);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL);
        ctx.lineTo(W, i * CELL);
        ctx.stroke();
      }

      // Food
      ctx.fillStyle = '#ff006e';
      ctx.shadowColor = '#ff006e';
      ctx.shadowBlur = 10;
      ctx.fillRect(s.food.x * CELL + 2, s.food.y * CELL + 2, CELL - 4, CELL - 4);
      ctx.shadowBlur = 0;

      // Snake
      s.snake.forEach((p, i) => {
        const alpha = 1 - (i / s.snake.length) * 0.4;
        ctx.fillStyle = i === 0 ? '#39ff14' : `rgba(57,255,20,${alpha})`;
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = i === 0 ? 8 : 0;
        ctx.fillRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2);
      });
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
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
