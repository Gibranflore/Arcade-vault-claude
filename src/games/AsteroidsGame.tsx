import { useRef, useEffect, useState, useCallback } from 'react';
import type { GameProps } from './types';

const W = 480;
const H = 360;

type Vec = { x: number; y: number };
type Asteroid = {
  x: number; y: number;
  vx: number; vy: number;
  size: number; // 3=large, 2=medium, 1=small
  points: Vec[];
  rotation: number;
  rotSpeed: number;
};
type Bullet = { x: number; y: number; vx: number; vy: number; life: number };

export function AsteroidsGame({ onScore, onLives, onLevel, onGameOver, onReady, isPaused }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);

  const stateRef = useRef({
    shipX: W / 2,
    shipY: H / 2,
    shipVX: 0,
    shipVY: 0,
    shipAngle: -Math.PI / 2,
    thrust: false,
    asteroids: [] as Asteroid[],
    bullets: [] as Bullet[],
    score: 0,
    lives: 3,
    level: 1,
    dead: false,
    fireCooldown: 0,
    invuln: 0,
  });

  const keysRef = useRef<Record<string, boolean>>({});

  const makeAsteroid = useCallback((x: number, y: number, size: number): Asteroid => {
    const speed = 0.5 + Math.random() * 1 + (stateRef.current.level - 1) * 0.2;
    const angle = Math.random() * Math.PI * 2;
    const pts: Vec[] = [];
    const numPts = 8 + Math.floor(Math.random() * 4);
    const baseR = size * 12;
    for (let i = 0; i < numPts; i++) {
      const a = (i / numPts) * Math.PI * 2;
      const r = baseR * (0.7 + Math.random() * 0.5);
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      points: pts,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
    };
  }, []);

  const spawnAsteroids = useCallback((count: number) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      do {
        x = Math.random() * W;
        y = Math.random() * H;
      } while (Math.hypot(x - s.shipX, y - s.shipY) < 80);
      s.asteroids.push(makeAsteroid(x, y, 3));
    }
  }, [makeAsteroid]);

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.shipX = W / 2;
    s.shipY = H / 2;
    s.shipVX = 0;
    s.shipVY = 0;
    s.shipAngle = -Math.PI / 2;
    s.asteroids = [];
    s.bullets = [];
    s.score = 0;
    s.lives = 3;
    s.level = 1;
    s.dead = false;
    s.fireCooldown = 0;
    s.invuln = 2000;
    spawnAsteroids(4);
    onScore(0);
    onLives(3);
    onLevel(1);
  }, [spawnAsteroids, onScore, onLives, onLevel]);

  const start = useCallback(() => { reset(); setRunning(true); }, [reset]);
  const pause = useCallback(() => {}, []);
  const resume = useCallback(() => {}, []);

  useEffect(() => {
    onReady({ start, pause, resume, reset: () => { reset(); setRunning(true); } });
  }, [onReady, start, pause, resume, reset]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ') e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
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
        const keys = keysRef.current;

        // Rotate
        if (keys['arrowleft'] || keys['a']) s.shipAngle -= 0.08;
        if (keys['arrowright'] || keys['d']) s.shipAngle += 0.08;

        // Thrust
        s.thrust = keys['arrowup'] || keys['w'];
        if (s.thrust) {
          s.shipVX += Math.cos(s.shipAngle) * 0.15;
          s.shipVY += Math.sin(s.shipAngle) * 0.15;
        }

        // Fire
        if (s.fireCooldown > 0) s.fireCooldown -= dt;
        if ((keys[' '] || keys['arrowdown'] || keys['s']) && s.fireCooldown <= 0) {
          s.bullets.push({
            x: s.shipX + Math.cos(s.shipAngle) * 12,
            y: s.shipY + Math.sin(s.shipAngle) * 12,
            vx: Math.cos(s.shipAngle) * 5 + s.shipVX,
            vy: Math.sin(s.shipAngle) * 5 + s.shipVY,
            life: 1500,
          });
          s.fireCooldown = 300;
        }

        // Move ship
        s.shipX += s.shipVX;
        s.shipY += s.shipVY;
        s.shipVX *= 0.99;
        s.shipVY *= 0.99;
        // Wrap
        if (s.shipX < 0) s.shipX += W;
        if (s.shipX > W) s.shipX -= W;
        if (s.shipY < 0) s.shipY += H;
        if (s.shipY > H) s.shipY -= H;

        // Move bullets
        s.bullets = s.bullets.filter((b) => b.life > 0);
        s.bullets.forEach((b) => {
          b.x += b.vx;
          b.y += b.vy;
          b.life -= dt;
          if (b.x < 0) b.x += W;
          if (b.x > W) b.x -= W;
          if (b.y < 0) b.y += H;
          if (b.y > H) b.y -= H;
        });

        // Move asteroids
        s.asteroids.forEach((a) => {
          a.x += a.vx;
          a.y += a.vy;
          a.rotation += a.rotSpeed;
          if (a.x < -20) a.x += W + 40;
          if (a.x > W + 20) a.x -= W + 40;
          if (a.y < -20) a.y += H + 40;
          if (a.y > H + 20) a.y -= H + 40;
        });

        // Bullet-asteroid collision
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          for (let j = s.asteroids.length - 1; j >= 0; j--) {
            const a = s.asteroids[j];
            const dist = Math.hypot(b.x - a.x, b.y - a.y);
            if (dist < a.size * 12) {
              s.bullets.splice(i, 1);
              s.asteroids.splice(j, 1);
              s.score += a.size === 3 ? 20 : a.size === 2 ? 50 : 100;
              onScore(s.score);
              // Split
              if (a.size > 1) {
                s.asteroids.push(makeAsteroid(a.x, a.y, a.size - 1));
                s.asteroids.push(makeAsteroid(a.x, a.y, a.size - 1));
              }
              break;
            }
          }
        }

        // Ship-asteroid collision
        if (s.invuln <= 0) {
          for (const a of s.asteroids) {
            const dist = Math.hypot(s.shipX - a.x, s.shipY - a.y);
            if (dist < a.size * 12 + 8) {
              s.lives--;
              onLives(s.lives);
              if (s.lives <= 0) {
                s.dead = true;
                onGameOver();
                setRunning(false);
              } else {
                s.shipX = W / 2;
                s.shipY = H / 2;
                s.shipVX = 0;
                s.shipVY = 0;
                s.invuln = 2000;
              }
              break;
            }
          }
        } else {
          s.invuln -= dt;
        }

        // Level complete
        if (s.asteroids.length === 0) {
          s.level++;
          onLevel(s.level);
          spawnAsteroids(4 + s.level);
        }
      }

      // Draw
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.fillStyle = '#222';
      for (let i = 0; i < 40; i++) {
        const x = (i * 37 + 13) % W;
        const y = (i * 53 + 7) % H;
        ctx.fillRect(x, y, 1, 1);
      }

      // Asteroids
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 4;
      s.asteroids.forEach((a) => {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rotation);
        ctx.beginPath();
        a.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      });
      ctx.shadowBlur = 0;

      // Bullets
      ctx.fillStyle = '#00f5ff';
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 6;
      s.bullets.forEach((b) => {
        ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
      });
      ctx.shadowBlur = 0;

      // Ship
      if (!s.dead && (s.invuln <= 0 || Math.floor(time / 100) % 2 === 0)) {
        ctx.save();
        ctx.translate(s.shipX, s.shipY);
        ctx.rotate(s.shipAngle);
        ctx.strokeStyle = '#00f5ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f5ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-8, -7);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-8, 7);
        ctx.closePath();
        ctx.stroke();
        // Thrust
        if (s.thrust) {
          ctx.strokeStyle = '#f5ff00';
          ctx.shadowColor = '#f5ff00';
          ctx.beginPath();
          ctx.moveTo(-4, 0);
          ctx.lineTo(-12 - Math.random() * 4, 0);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [running, isPaused, onScore, onLives, onLevel, onGameOver, spawnAsteroids, makeAsteroid]);

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
