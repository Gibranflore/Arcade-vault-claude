"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { GameProps } from "./types";
import { DEFAULT_SNAKE_SKIN, type SnakeSkin } from "./snakeSkins";

const CELL = 20;
const COLS = 40;
const ROWS = 30;
const W = COLS * CELL; // 800
const H = ROWS * CELL; // 600

const POINTS_PER_FOOD = 10;
const FOOD_PER_LEVEL = 5;
const BASE_TICK_MS = 140;
const MIN_TICK_MS = 60;
const TICK_STEP_MS = 8;

type Point = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";
type Phase = "playing" | "gameover";

type SnakeState = {
  snake: Point[];
  direction: Direction;
  pendingDirection: Direction;
  food: Point;
  score: number;
  foodEaten: number;
  level: number;
  phase: Phase;
  tickMs: number;
  tickAccum: number;
};

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function randomFood(snake: Point[]): Point {
  let food: Point;
  do {
    food = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some((s) => s.x === food.x && s.y === food.y));
  return food;
}

function createInitialState(): SnakeState {
  const startSnake: Point[] = [
    { x: 10, y: 15 },
    { x: 9, y: 15 },
    { x: 8, y: 15 },
  ];
  return {
    snake: startSnake,
    direction: "right",
    pendingDirection: "right",
    food: randomFood(startSnake),
    score: 0,
    foodEaten: 0,
    level: 1,
    phase: "playing",
    tickMs: BASE_TICK_MS,
    tickAccum: 0,
  };
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  s: SnakeState,
  skin: SnakeSkin,
) {
  ctx.fillStyle = skin.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = skin.food;
  ctx.fillRect(s.food.x * CELL + 2, s.food.y * CELL + 2, CELL - 4, CELL - 4);

  s.snake.forEach((segment, i) => {
    ctx.fillStyle = i === 0 ? skin.head : skin.body;
    ctx.fillRect(
      segment.x * CELL + 1,
      segment.y * CELL + 1,
      CELL - 2,
      CELL - 2,
    );
  });
}

export function SnakeGame({
  onScore,
  onLives,
  onLevel,
  onGameOver,
  onReady,
  isPaused,
  skin = DEFAULT_SNAKE_SKIN,
}: GameProps & { skin?: SnakeSkin }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const nextDirectionRef = useRef<Direction>("right");
  const stateRef = useRef(createInitialState());
  const skinRef = useRef(skin);
  useEffect(() => {
    skinRef.current = skin;
  }, [skin]);

  const reset = useCallback(() => {
    stateRef.current = createInitialState();
    nextDirectionRef.current = "right";
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

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      let dir: Direction | null = null;
      if (e.code === "ArrowUp" || e.code === "KeyW") dir = "up";
      else if (e.code === "ArrowDown" || e.code === "KeyS") dir = "down";
      else if (e.code === "ArrowLeft" || e.code === "KeyA") dir = "left";
      else if (e.code === "ArrowRight" || e.code === "KeyD") dir = "right";
      if (!dir) return;
      e.preventDefault();
      const current = stateRef.current.direction;
      if (dir !== OPPOSITE[current]) nextDirectionRef.current = dir;
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last: number | null = null;

    const step = () => {
      const s = stateRef.current;
      s.direction = nextDirectionRef.current;
      const delta = DELTA[s.direction];
      const head = s.snake[0];
      const newHead: Point = { x: head.x + delta.x, y: head.y + delta.y };

      if (
        newHead.x < 0 ||
        newHead.x >= COLS ||
        newHead.y < 0 ||
        newHead.y >= ROWS ||
        s.snake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)
      ) {
        s.phase = "gameover";
        onLives(0);
        onGameOver();
        setRunning(false);
        return;
      }

      s.snake.unshift(newHead);

      if (newHead.x === s.food.x && newHead.y === s.food.y) {
        s.score += POINTS_PER_FOOD;
        s.foodEaten++;
        s.food = randomFood(s.snake);
        const newLevel = Math.floor(s.foodEaten / FOOD_PER_LEVEL) + 1;
        if (newLevel !== s.level) {
          s.level = newLevel;
          s.tickMs = Math.max(
            MIN_TICK_MS,
            BASE_TICK_MS - (s.level - 1) * TICK_STEP_MS,
          );
          onLevel(s.level);
        }
        onScore(s.score);
      } else {
        s.snake.pop();
      }
    };

    const update = (dtMs: number) => {
      const s = stateRef.current;
      if (s.phase === "gameover") return;
      s.tickAccum += dtMs;
      if (s.tickAccum >= s.tickMs) {
        s.tickAccum = 0;
        step();
      }
    };

    const draw = () => drawScene(ctx, stateRef.current, skinRef.current);

    const loop = (ts: number) => {
      const dt = last === null ? 0 : ts - last;
      last = ts;

      if (!isPaused) update(dt);
      draw();

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, isPaused, onScore, onLevel, onLives, onGameOver]);

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
