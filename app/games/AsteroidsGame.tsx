"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { GameProps } from "./types";

const W = 800;
const H = 600;

type Vec = { x: number; y: number };

const wrap = (v: number, max: number) => ((v % max) + max) % max;
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

const RADII = [0, 16, 30, 50]; // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32]; // velocidad base por tamaño
const POINTS = [0, 100, 50, 20]; // puntos por tamaño

class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl = 1.1;
  radius = 2;
  dead = false;

  constructor(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Asteroid {
  x: number;
  y: number;
  size: number;
  radius: number;
  dead = false;
  vx: number;
  vy: number;
  rotSpeed: number;
  rot: number;
  verts: number[][];
  craters: { x: number; y: number; r: number }[];

  constructor(x: number, y: number, size = 3) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size];

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    if (size === 3) {
      const scale = this.radius / 50;
      this.verts = [
        [-35, -40],
        [-15, -45],
        [35, -40],
        [45, -10],
        [40, 20],
        [20, 45],
        [-10, 48],
        [-40, 30],
        [-48, 10],
        [-40, -20],
      ].map((v) => [v[0] * scale, v[1] * scale]);
      this.craters = [
        { x: 0, y: -15 * scale, r: 12 * scale },
        { x: 0, y: 15 * scale, r: 6 * scale },
      ];
    } else {
      const n = randInt(8, 13);
      this.verts = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const r = this.radius * rand(0.6, 1.0);
        this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      this.craters = [];
    }
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split(): Asteroid[] {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();

    if (this.craters.length > 0) {
      for (const crater of this.craters) {
        ctx.beginPath();
        ctx.arc(crater.x, crater.y, crater.r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

class Ship {
  x = W / 2;
  y = H / 2;
  angle = -Math.PI / 2;
  vx = 0;
  vy = 0;
  radius = 12;
  thrusting = false;
  invincible = 3;
  shootCooldown = 0;
  dead = false;
  tripleShot = 0;

  reset() {
    this.x = W / 2;
    this.y = H / 2;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.thrusting = false;
    this.invincible = 3;
    this.shootCooldown = 0;
    this.dead = false;
    this.tripleShot = 0;
  }

  update(dt: number, keys: Record<string, boolean>) {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.tripleShot > 0) this.tripleShot -= dt;

    const ROT = 3.5;
    const THRUST = 260;
    const DRAG = 0.987;

    if (keys["ArrowLeft"]) this.angle -= ROT * dt;
    if (keys["ArrowRight"]) this.angle += ROT * dt;

    this.thrusting = !!keys["ArrowUp"];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot(): Bullet[] {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;

    if (this.tripleShot > 0) {
      const FAN = (25 * Math.PI) / 180;
      return [
        new Bullet(ox, oy, this.angle - FAN),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + FAN),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.dead) return;
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0)
      return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-12, -9);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-12, 9);
    ctx.closePath();
    ctx.stroke();

    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8, 4);
      ctx.strokeStyle = "rgba(255, 130, 0, 0.85)";
      ctx.stroke();
    }

    ctx.restore();
  }
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  dead = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl = this.life;
  }

  update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

type PowerUpType = "triple" | "bomb";

class PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  radius = 12;
  rot = 0;
  dead = false;

  constructor(x: number, y: number, type: PowerUpType = "triple") {
    this.x = x;
    this.y = y;
    this.type = type;
  }

  update(dt: number) {
    this.rot += 1.5 * dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";

    if (this.type === "triple") {
      ctx.strokeStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(this.radius, 0);
      ctx.lineTo(0, this.radius);
      ctx.lineTo(-this.radius, 0);
      ctx.lineTo(0, -this.radius);
      ctx.closePath();
      ctx.stroke();
    } else if (this.type === "bomb") {
      ctx.strokeStyle = "#f66";
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.5, 0);
      ctx.lineTo(this.radius * 0.5, 0);
      ctx.moveTo(0, -this.radius * 0.5);
      ctx.lineTo(0, this.radius * 0.5);
      ctx.stroke();
    }

    ctx.restore();
  }
}

type GamePhase = "playing" | "dead" | "gameover";

function createInitialState() {
  return {
    ship: new Ship(),
    bullets: [] as Bullet[],
    asteroids: [] as Asteroid[],
    particles: [] as Particle[],
    powerups: [] as PowerUp[],
    score: 0,
    lives: 3,
    level: 1,
    phase: "playing" as GamePhase,
    deadTimer: 0,
    powerUpTimer: 0,
  };
}

export function AsteroidsGame({
  onScore,
  onLives,
  onLevel,
  onGameOver,
  onReady,
  isPaused,
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const keysRef = useRef<Record<string, boolean>>({});
  const spaceJustPressedRef = useRef(false);
  const stateRef = useRef(createInitialState());

  const spawnAsteroids = useCallback((count: number) => {
    const s = stateRef.current;
    const SAFE_DIST = 130;
    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
      s.asteroids.push(new Asteroid(x, y, 3));
    }
  }, []);

  const spawnPowerUp = useCallback(() => {
    const s = stateRef.current;
    const SAFE_DIST = 130;
    let x: number, y: number;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - s.ship.x, y - s.ship.y) < SAFE_DIST);
    const type: PowerUpType = Math.random() < 0.2 ? "bomb" : "triple";
    s.powerups.push(new PowerUp(x, y, type));
  }, []);

  const explode = useCallback((x: number, y: number, count = 8) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) s.particles.push(new Particle(x, y));
  }, []);

  const reset = useCallback(() => {
    stateRef.current = createInitialState();
    spawnAsteroids(4);
    spawnPowerUp();
    onScore(0);
    onLives(3);
    onLevel(1);
  }, [spawnAsteroids, spawnPowerUp, onScore, onLives, onLevel]);

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

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") e.preventDefault();
      if (!keysRef.current[e.code] && e.code === "Space")
        spaceJustPressedRef.current = true;
      keysRef.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const killShip = useCallback(() => {
    const s = stateRef.current;
    explode(s.ship.x, s.ship.y, 14);
    s.ship.dead = true;
    s.lives--;
    onLives(s.lives);
    if (s.lives <= 0) {
      s.phase = "gameover";
      onGameOver();
      setRunning(false);
    } else {
      s.phase = "dead";
      s.deadTimer = 2;
    }
  }, [explode, onLives, onGameOver]);

  const nextLevel = useCallback(() => {
    const s = stateRef.current;
    s.level++;
    s.bullets = [];
    s.particles = [];
    s.powerups = [];
    s.ship.reset();
    s.powerUpTimer = 0;
    spawnAsteroids(3 + s.level);
    spawnPowerUp();
    onLevel(s.level);
  }, [spawnAsteroids, spawnPowerUp, onLevel]);

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last: number | null = null;

    const update = (dt: number) => {
      const s = stateRef.current;

      if (s.phase === "gameover") {
        s.particles.forEach((p) => p.update(dt));
        s.particles = s.particles.filter((p) => !p.dead);
        return;
      }

      if (s.phase === "dead") {
        s.deadTimer -= dt;
        s.particles.forEach((p) => p.update(dt));
        s.particles = s.particles.filter((p) => !p.dead);
        s.asteroids.forEach((a) => a.update(dt));
        if (s.deadTimer <= 0) {
          s.phase = "playing";
          s.ship.reset();
        }
        return;
      }

      const scoreBefore = s.score;

      s.powerUpTimer -= dt;
      if (s.powerUpTimer <= 0 && s.powerups.length === 0) {
        spawnPowerUp();
        s.powerUpTimer = rand(15, 20);
      }

      if (spaceJustPressedRef.current) {
        spaceJustPressedRef.current = false;
        s.bullets.push(...s.ship.tryShoot());
      }

      s.ship.update(dt, keysRef.current);
      s.bullets.forEach((b) => b.update(dt));
      s.asteroids.forEach((a) => a.update(dt));
      s.particles.forEach((p) => p.update(dt));
      s.powerups.forEach((p) => p.update(dt));

      s.bullets = s.bullets.filter((b) => !b.dead);
      s.particles = s.particles.filter((p) => !p.dead);
      s.powerups = s.powerups.filter((p) => !p.dead);

      for (const p of s.powerups) {
        if (dist(s.ship, p) < s.ship.radius + p.radius) {
          p.dead = true;
          s.powerUpTimer = rand(15, 20);
          if (p.type === "triple") {
            s.ship.tripleShot = 10;
          } else if (p.type === "bomb") {
            for (const a of s.asteroids) {
              s.score += POINTS[a.size];
              explode(a.x, a.y, a.size * 5);
            }
            s.asteroids = [];
          }
        }
      }

      const newAsteroids: Asteroid[] = [];
      for (const b of s.bullets) {
        for (const a of s.asteroids) {
          if (!a.dead && !b.dead && dist(b, a) < a.radius) {
            b.dead = true;
            a.dead = true;
            s.score += POINTS[a.size];
            explode(a.x, a.y, a.size * 5);
            newAsteroids.push(...a.split());
          }
        }
      }
      s.asteroids = s.asteroids.filter((a) => !a.dead).concat(newAsteroids);
      s.bullets = s.bullets.filter((b) => !b.dead);

      if (s.score !== scoreBefore) onScore(s.score);

      if (s.ship.invincible <= 0) {
        for (const a of s.asteroids) {
          if (dist(s.ship, a) < s.ship.radius + a.radius * 0.82) {
            killShip();
            break;
          }
        }
      }

      if (s.phase === "playing" && s.asteroids.length === 0) nextLevel();
    };

    const draw = () => {
      const s = stateRef.current;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      s.particles.forEach((p) => p.draw(ctx));
      s.powerups.forEach((p) => p.draw(ctx));
      s.asteroids.forEach((a) => a.draw(ctx));
      s.bullets.forEach((b) => b.draw(ctx));
      s.ship.draw(ctx);
    };

    const loop = (ts: number) => {
      const dt = last === null ? 0 : Math.min((ts - last) / 1000, 0.05);
      last = ts;

      if (!isPaused) update(dt);
      draw();

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [
    running,
    isPaused,
    onScore,
    onLevel,
    spawnPowerUp,
    nextLevel,
    killShip,
    explode,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="max-w-full max-h-full"
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
}
