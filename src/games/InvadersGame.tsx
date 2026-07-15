import { useRef, useEffect, useState, useCallback } from 'react';
import type { GameProps } from './types';

const W = 480;
const H = 360;
const PLAYER_W = 32;
const PLAYER_H = 20;
const BULLET_H = 12;
const BULLET_W = 4;
const ENEMY_W = 28;
const ENEMY_H = 20;
const ENEMY_ROWS = 4;
const ENEMY_COLS = 8;

export function InvadersGame({ onScore, onLives, onLevel, onGameOver, onReady, isPaused }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);

  const stateRef = useRef({
    playerX: W / 2 - PLAYER_W / 2,
    bullets: [] as { x: number; y: number }[],
    enemies: [] as { x: number; y: number; alive: boolean }[],
    enemyBullets: [] as { x: number; y: number }[],
    enemyDir: 1,
    enemyMoveTimer: 0,
    enemyFireTimer: 0,
    score: 0,
    lives: 3,
    level: 1,
    dead: false,
    canFire: true,
    fireCooldown: 0,
  });

  const initEnemies = useCallback((level: number) => {
    const enemies = [];
    const startX = 40;
    const startY = 30 + Math.min(level - 1, 3) * 10;
    for (let r = 0; r < ENEMY_ROWS; r++) {
      for (let c = 0; c < ENEMY_COLS; c++) {
        enemies.push({
          x: startX + c * (ENEMY_W + 10),
          y: startY + r * (ENEMY_H + 10),
          alive: true,
        });
      }
    }
    return enemies;
  }, []);

  const reset = useCallback((full: boolean) => {
    const s = stateRef.current;
    s.playerX = W / 2 - PLAYER_W / 2;
    s.bullets = [];
    s.enemyBullets = [];
    s.enemyDir = 1;
    s.enemyMoveTimer = 0;
    s.enemyFireTimer = 0;
    s.canFire = true;
    s.fireCooldown = 0;
    if (full) {
      s.score = 0;
      s.lives = 3;
      s.level = 1;
      onScore(0);
      onLives(3);
      onLevel(1);
    }
    s.enemies = initEnemies(s.level);
    s.dead = false;
  }, [initEnemies, onScore, onLives, onLevel]);

  const start = useCallback(() => { reset(true); setRunning(true); }, [reset]);
  const pause = useCallback(() => {}, []);
  const resume = useCallback(() => {}, []);

  useEffect(() => {
    onReady({ start, pause, resume, reset: () => { reset(true); setRunning(true); } });
  }, [onReady, start, pause, resume, reset]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') s.playerX = Math.max(0, s.playerX - 16);
      else if (k === 'arrowright' || k === 'd') s.playerX = Math.min(W - PLAYER_W, s.playerX + 16);
      else if (k === ' ' || k === 'arrowup' || k === 'w') {
        e.preventDefault();
        if (s.canFire && !s.dead) {
          s.bullets.push({ x: s.playerX + PLAYER_W / 2 - BULLET_W / 2, y: H - PLAYER_H - 10 });
          s.canFire = false;
          s.fireCooldown = 20;
        }
      }
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

    const update = () => {
      const s = stateRef.current;
      if (isPaused || s.dead) {
        // Still draw
        drawScene(ctx, s);
        raf = requestAnimationFrame(update);
        return;
      }

      // Fire cooldown
      if (s.fireCooldown > 0) {
        s.fireCooldown--;
        if (s.fireCooldown === 0) s.canFire = true;
      }

      // Move bullets up
      s.bullets = s.bullets.filter((b) => b.y > 0);
      s.bullets.forEach((b) => b.y -= 6);

      // Move enemy bullets down
      s.enemyBullets = s.enemyBullets.filter((b) => b.y < H);
      s.enemyBullets.forEach((b) => b.y += 3);

      // Enemy movement
      s.enemyMoveTimer++;
      const moveInterval = Math.max(20, 60 - s.level * 5);
      if (s.enemyMoveTimer >= moveInterval) {
        s.enemyMoveTimer = 0;
        const alive = s.enemies.filter((e) => e.alive);
        if (alive.length > 0) {
          const minX = Math.min(...alive.map((e) => e.x));
          const maxX = Math.max(...alive.map((e) => e.x + ENEMY_W));
          let shouldFlip = false;
          if (s.enemyDir > 0 && maxX + 10 > W) shouldFlip = true;
          if (s.enemyDir < 0 && minX - 10 < 0) shouldFlip = true;
          if (shouldFlip) {
            s.enemyDir *= -1;
            s.enemies.forEach((e) => e.y += 15);
          } else {
            s.enemies.forEach((e) => e.x += s.enemyDir * 10);
          }
        }
      }

      // Enemy fire
      s.enemyFireTimer++;
      if (s.enemyFireTimer >= Math.max(40, 90 - s.level * 10)) {
        s.enemyFireTimer = 0;
        const alive = s.enemies.filter((e) => e.alive);
        if (alive.length > 0) {
          const shooter = alive[Math.floor(Math.random() * alive.length)];
          s.enemyBullets.push({ x: shooter.x + ENEMY_W / 2 - 2, y: shooter.y + ENEMY_H });
        }
      }

      // Bullet-enemy collision
      for (const b of s.bullets) {
        for (const e of s.enemies) {
          if (!e.alive) continue;
          if (b.x < e.x + ENEMY_W && b.x + BULLET_W > e.x && b.y < e.y + ENEMY_H && b.y + BULLET_H > e.y) {
            e.alive = false;
            b.y = -100; // mark for removal
            s.score += 20;
            onScore(s.score);
          }
        }
      }

      // Enemy bullet - player collision
      for (const b of s.enemyBullets) {
        if (
          b.x < s.playerX + PLAYER_W &&
          b.x + 4 > s.playerX &&
          b.y < H - 10 &&
          b.y + 8 > H - PLAYER_H - 10
        ) {
          b.y = H + 100;
          s.lives--;
          onLives(s.lives);
          if (s.lives <= 0) {
            s.dead = true;
            onGameOver();
            setRunning(false);
          }
        }
      }

      // Enemy reaches bottom
      const alive = s.enemies.filter((e) => e.alive);
      if (alive.some((e) => e.y + ENEMY_H > H - 30)) {
        s.dead = true;
        onGameOver();
        setRunning(false);
      }

      // Win
      if (alive.length === 0) {
        s.level++;
        onLevel(s.level);
        s.enemies = initEnemies(s.level);
        s.enemyBullets = [];
        s.bullets = [];
      }

      drawScene(ctx, s);
      raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [running, isPaused, onScore, onLives, onLevel, onGameOver, initEnemies]);

  const drawScene = (ctx: CanvasRenderingContext2D, s: typeof stateRef.current) => {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = '#222';
    for (let i = 0; i < 30; i++) {
      const x = (i * 37) % W;
      const y = (i * 53) % H;
      ctx.fillRect(x, y, 1, 1);
    }

    // Enemies
    s.enemies.forEach((e) => {
      if (!e.alive) return;
      ctx.fillStyle = '#ff006e';
      ctx.shadowColor = '#ff006e';
      ctx.shadowBlur = 5;
      ctx.fillRect(e.x, e.y, ENEMY_W, ENEMY_H);
      // Eyes
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(e.x + 5, e.y + 5, 4, 4);
      ctx.fillRect(e.x + ENEMY_W - 9, e.y + 5, 4, 4);
    });
    ctx.shadowBlur = 0;

    // Player bullets
    ctx.fillStyle = '#00f5ff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 8;
    s.bullets.forEach((b) => ctx.fillRect(b.x, b.y, BULLET_W, BULLET_H));

    // Enemy bullets
    ctx.fillStyle = '#f5ff00';
    ctx.shadowColor = '#f5ff00';
    s.enemyBullets.forEach((b) => ctx.fillRect(b.x, b.y, 4, 8));
    ctx.shadowBlur = 0;

    // Player ship
    ctx.fillStyle = '#39ff14';
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 10;
    ctx.fillRect(s.playerX, H - PLAYER_H - 10, PLAYER_W, PLAYER_H);
    // Cannon
    ctx.fillRect(s.playerX + PLAYER_W / 2 - 3, H - PLAYER_H - 16, 6, 6);
    ctx.shadowBlur = 0;
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
