"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { GameProps } from "./types";
import { DEFAULT_FROGGER_SKIN, type FroggerSkin } from "./froggerSkins";

const CELL = 50;
const COLS = 16;
const ROWS = 12;
const W = COLS * CELL; // 800
const H = ROWS * CELL; // 600

const GOAL_ROW = 0;
const RIVER_ROWS = [2, 3, 4, 5];
const ROAD_ROWS = [7, 8, 9, 10];
const START_ROW = 11;
const GOAL_COLS = [1, 4, 7, 10, 13];

const START_COL = 8;
const FROG_HALF = 18;
const MOUTH_WIDTH = 24;
const JUMP_COOLDOWN = 0.15;
const MAX_LANE_SPEED = 220;
const ROUND_TIME_MS = 20000;
const FORWARD_ROW_POINTS = 10;
const GOAL_BONUS = 50;
const TIME_BONUS_PER_SEC = 2;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const overlap = (
  ax: number,
  aHalf: number,
  bx: number,
  bHalf: number,
): boolean => Math.abs(ax - bx) < aHalf + bHalf;

type LaneType = "safe" | "road" | "river" | "goal";

type LaneEntity = {
  kind: "car" | "truck" | "log" | "crocodile";
  x: number;
  width: number;
};

type Lane = {
  type: LaneType;
  row: number;
  direction: 1 | -1;
  speed: number;
  entities: LaneEntity[];
};

type Frog = {
  row: number;
  x: number;
  bestRow: number;
};

type Phase = "playing" | "gameover";

type FroggerState = {
  phase: Phase;
  frog: Frog;
  lanes: Lane[];
  goals: boolean[];
  lives: number;
  score: number;
  level: number;
  roundTimeMs: number;
};

function generateEntities(type: "road" | "river"): LaneEntity[] {
  const count = randInt(3, 5);
  const spacing = W / count;
  const entities: LaneEntity[] = [];
  for (let i = 0; i < count; i++) {
    let kind: LaneEntity["kind"];
    let width: number;
    if (type === "road") {
      kind = Math.random() < 0.35 ? "truck" : "car";
      width = kind === "truck" ? 70 : 40;
    } else {
      kind = Math.random() < 0.25 ? "crocodile" : "log";
      width = kind === "crocodile" ? 90 : rand(70, 130);
    }
    entities.push({ kind, x: i * spacing + rand(0, spacing * 0.4), width });
  }
  return entities;
}

function buildLanes(level: number): Lane[] {
  const lanes: Lane[] = [];
  for (let row = 0; row < ROWS; row++) {
    if (row === GOAL_ROW) {
      lanes.push({ type: "goal", row, direction: 1, speed: 0, entities: [] });
      continue;
    }
    const isRiver = RIVER_ROWS.includes(row);
    const isRoad = ROAD_ROWS.includes(row);
    if (!isRiver && !isRoad) {
      lanes.push({ type: "safe", row, direction: 1, speed: 0, entities: [] });
      continue;
    }
    const type: "road" | "river" = isRiver ? "river" : "road";
    const direction: 1 | -1 = row % 2 === 0 ? 1 : -1;
    const speed = Math.min(MAX_LANE_SPEED, 40 + level * 8 + rand(-10, 15));
    lanes.push({
      type,
      row,
      direction,
      speed,
      entities: generateEntities(type),
    });
  }
  return lanes;
}

function createInitialFrog(): Frog {
  return { row: START_ROW, x: START_COL * CELL + CELL / 2, bestRow: START_ROW };
}

function createInitialState(): FroggerState {
  return {
    phase: "playing",
    frog: createInitialFrog(),
    lanes: buildLanes(1),
    goals: [false, false, false, false, false],
    lives: 3,
    score: 0,
    level: 1,
    roundTimeMs: ROUND_TIME_MS,
  };
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  s: FroggerState,
  skin: FroggerSkin,
) {
  ctx.clearRect(0, 0, W, H);

  for (const lane of s.lanes) {
    const y = lane.row * CELL;
    if (lane.type === "goal") {
      ctx.fillStyle = skin.laneGoal;
      ctx.fillRect(0, y, W, CELL);
    } else if (lane.type === "safe") {
      ctx.fillStyle = skin.laneSafe;
      ctx.fillRect(0, y, W, CELL);
    } else if (lane.type === "road") {
      ctx.fillStyle = skin.laneRoad;
      ctx.fillRect(0, y, W, CELL);
    } else {
      ctx.fillStyle = skin.laneRiver;
      ctx.fillRect(0, y, W, CELL);
    }
  }

  // Goal houses
  const goalY = GOAL_ROW * CELL;
  for (let i = 0; i < GOAL_COLS.length; i++) {
    const cx = GOAL_COLS[i] * CELL + CELL / 2;
    ctx.fillStyle = s.goals[i] ? skin.goalActive : skin.goalInactive;
    ctx.strokeStyle = skin.goalBorder;
    ctx.lineWidth = 2;
    ctx.fillRect(cx - 20, goalY + 6, 40, CELL - 12);
    ctx.strokeRect(cx - 20, goalY + 6, 40, CELL - 12);
  }

  // Lane entities
  for (const lane of s.lanes) {
    const y = lane.row * CELL;
    for (const e of lane.entities) {
      const half = e.width / 2;
      if (lane.type === "road") {
        ctx.fillStyle = e.kind === "truck" ? skin.truck : skin.car;
        ctx.fillRect(e.x - half, y + 6, e.width, CELL - 12);
      } else {
        ctx.fillStyle = e.kind === "crocodile" ? skin.crocodile : skin.log;
        ctx.fillRect(e.x - half, y + 8, e.width, CELL - 16);
        if (e.kind === "crocodile") {
          const mouthCx =
            lane.direction === 1
              ? e.x + half - MOUTH_WIDTH / 2
              : e.x - half + MOUTH_WIDTH / 2;
          ctx.fillStyle = skin.crocodileMouth;
          ctx.fillRect(
            mouthCx - MOUTH_WIDTH / 2,
            y + 8,
            MOUTH_WIDTH,
            CELL - 16,
          );
        }
      }
    }
  }

  // Frog
  const fy = s.frog.row * CELL + CELL / 2;
  ctx.fillStyle = skin.frog;
  ctx.beginPath();
  ctx.arc(s.frog.x, fy, FROG_HALF, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skin.frogEyes;
  ctx.beginPath();
  ctx.arc(s.frog.x - 6, fy - 6, 3, 0, Math.PI * 2);
  ctx.arc(s.frog.x + 6, fy - 6, 3, 0, Math.PI * 2);
  ctx.fill();
}

export function FroggerGame({
  onScore,
  onLives,
  onLevel,
  onGameOver,
  onReady,
  isPaused,
  skin = DEFAULT_FROGGER_SKIN,
}: GameProps & { skin?: FroggerSkin }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const keysRef = useRef<Record<string, boolean>>({});
  const cooldownRef = useRef(0);
  const stateRef = useRef(createInitialState());
  const skinRef = useRef(skin);
  useEffect(() => {
    skinRef.current = skin;
  }, [skin]);

  const reset = useCallback(() => {
    stateRef.current = createInitialState();
    cooldownRef.current = 0;
    onScore(0);
    onLives(3);
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
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code))
        e.preventDefault();
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

  const die = useCallback(
    (s: FroggerState) => {
      s.lives--;
      onLives(s.lives);
      if (s.lives <= 0) {
        s.phase = "gameover";
        onGameOver();
        setRunning(false);
        return;
      }
      s.frog = createInitialFrog();
      s.roundTimeMs = ROUND_TIME_MS;
    },
    [onLives, onGameOver],
  );

  const levelUp = useCallback(
    (s: FroggerState) => {
      s.level++;
      s.goals = [false, false, false, false, false];
      s.lanes = buildLanes(s.level);
      onLevel(s.level);
    },
    [onLevel],
  );

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last: number | null = null;

    const handleGoalLanding = (s: FroggerState) => {
      const col = Math.round((s.frog.x - CELL / 2) / CELL);
      const goalIndex = GOAL_COLS.indexOf(col);
      if (goalIndex === -1 || s.goals[goalIndex]) {
        die(s);
        return;
      }
      s.goals[goalIndex] = true;
      const timeBonus = Math.floor(s.roundTimeMs / 1000) * TIME_BONUS_PER_SEC;
      s.score += GOAL_BONUS + timeBonus;
      s.frog = createInitialFrog();
      s.roundTimeMs = ROUND_TIME_MS;
      if (s.goals.every(Boolean)) levelUp(s);
    };

    const update = (dt: number) => {
      const s = stateRef.current;
      if (s.phase === "gameover") return;

      const scoreBefore = s.score;

      // lane entities
      for (const lane of s.lanes) {
        if (lane.type !== "road" && lane.type !== "river") continue;
        for (const e of lane.entities) {
          e.x += lane.direction * lane.speed * dt;
          const half = e.width / 2;
          if (lane.direction === 1 && e.x - half > W) e.x = -half - rand(0, 40);
          if (lane.direction === -1 && e.x + half < 0)
            e.x = W + half + rand(0, 40);
        }
      }

      // jump input
      if (cooldownRef.current > 0) cooldownRef.current -= dt;
      const k = keysRef.current;
      const frog = s.frog;
      if (cooldownRef.current <= 0) {
        let moved = false;
        if (k["ArrowUp"] || k["KeyW"]) {
          if (frog.row > 0) {
            frog.row--;
            moved = true;
          }
        } else if (k["ArrowDown"] || k["KeyS"]) {
          if (frog.row < START_ROW) {
            frog.row++;
            moved = true;
          }
        } else if (k["ArrowLeft"] || k["KeyA"]) {
          frog.x = clamp(frog.x - CELL, CELL / 2, W - CELL / 2);
          moved = true;
        } else if (k["ArrowRight"] || k["KeyD"]) {
          frog.x = clamp(frog.x + CELL, CELL / 2, W - CELL / 2);
          moved = true;
        }
        if (moved) {
          cooldownRef.current = JUMP_COOLDOWN;
          if (frog.row < frog.bestRow) {
            s.score += (frog.bestRow - frog.row) * FORWARD_ROW_POINTS;
            frog.bestRow = frog.row;
          }
        }
      }

      // round timer
      s.roundTimeMs -= dt * 1000;
      if (s.roundTimeMs <= 0) {
        die(s);
        if (s.phase === "gameover") {
          if (s.score !== scoreBefore) onScore(s.score);
          return;
        }
      }

      // lane collision / goal handling
      const lane = s.lanes[frog.row];
      if (lane.type === "road") {
        for (const e of lane.entities) {
          if (overlap(frog.x, FROG_HALF * 0.7, e.x, e.width / 2)) {
            die(s);
            break;
          }
        }
      } else if (lane.type === "river") {
        let riding: LaneEntity | null = null;
        for (const e of lane.entities) {
          if (overlap(frog.x, FROG_HALF * 0.6, e.x, e.width / 2)) {
            riding = e;
            break;
          }
        }
        if (!riding) {
          die(s);
        } else if (riding.kind === "crocodile") {
          const half = riding.width / 2;
          const mouthCx =
            lane.direction === 1
              ? riding.x + half - MOUTH_WIDTH / 2
              : riding.x - half + MOUTH_WIDTH / 2;
          if (overlap(frog.x, FROG_HALF * 0.5, mouthCx, MOUTH_WIDTH / 2)) {
            die(s);
          } else {
            frog.x += lane.direction * lane.speed * dt;
            if (frog.x < -CELL || frog.x > W + CELL) die(s);
          }
        } else {
          frog.x += lane.direction * lane.speed * dt;
          if (frog.x < -CELL || frog.x > W + CELL) die(s);
        }
      } else if (lane.type === "goal") {
        handleGoalLanding(s);
      }

      if (s.score !== scoreBefore) onScore(s.score);
    };

    const draw = () => drawScene(ctx, stateRef.current, skinRef.current);

    const loop = (ts: number) => {
      const dt = last === null ? 0 : Math.min((ts - last) / 1000, 0.05);
      last = ts;

      if (!isPaused) update(dt);
      draw();

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, isPaused, onScore, die, levelUp]);

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
