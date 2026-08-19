"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { GameProps } from "./types";
import { DEFAULT_BREAKOUT_SKIN, type BreakoutSkin } from "./breakoutSkins";

const W = 800;
const H = 600;

const PADDLE_W = 140;
const PADDLE_H = 16;
const PADDLE_Y = H - 40;
const PADDLE_SPEED = 640;

const BALL_R = 8;
const BASE_BALL_SPEED = 340;

const BLOCK_ROWS = 5;
const BLOCK_COLS = 8;
const BLOCK_CELL_W = W / BLOCK_COLS;
const BLOCK_W = 78;
const BLOCK_H = 26;
const BLOCK_TOP_MARGIN = 70;
const POINTS_PER_BLOCK = 10;

type CellType = null | "block" | "indestructible";

const LEVELS: CellType[][][] = [
  [
    [null, null, null, "block", "block", null, null, null],
    [null, null, "block", "block", "block", "block", null, null],
    [null, "block", "block", "block", "block", "block", "block", null],
    ["block", "block", "block", "block", "block", "block", "block", "block"],
    [
      "indestructible",
      "block",
      "block",
      "block",
      "block",
      "block",
      "block",
      "indestructible",
    ],
  ],
  [
    [null, null, null, "block", "block", null, null, null],
    [null, null, "block", "block", "block", "block", null, null],
    [
      "block",
      "block",
      "indestructible",
      "block",
      "block",
      "indestructible",
      "block",
      "block",
    ],
    [null, null, "block", "block", "block", "block", null, null],
    [null, null, null, "block", "block", null, null, null],
  ],
  [
    ["block", "block", "block", "block", "block", "block", "block", "block"],
    [
      "block",
      "indestructible",
      null,
      null,
      null,
      null,
      "indestructible",
      "block",
    ],
    ["block", null, null, null, null, null, null, "block"],
    [
      "block",
      "indestructible",
      null,
      null,
      null,
      null,
      "indestructible",
      "block",
    ],
    ["block", "block", "block", "block", "block", "block", "block", "block"],
  ],
  [
    ["block", "block", null, null, null, null, "block", "block"],
    [null, "block", "block", null, null, "block", "block", null],
    [
      null,
      null,
      "block",
      "indestructible",
      "indestructible",
      "block",
      null,
      null,
    ],
    [null, "block", "block", null, null, "block", "block", null],
    ["block", "block", null, null, null, null, "block", "block"],
  ],
  [
    [null, null, null, "block", "block", null, null, null],
    [null, null, null, "block", "block", null, null, null],
    [
      "indestructible",
      "block",
      "block",
      "block",
      "block",
      "block",
      "block",
      "indestructible",
    ],
    [null, null, null, "block", "block", null, null, null],
    [null, null, null, "block", "block", null, null, null],
  ],
  [
    [
      "indestructible",
      null,
      "block",
      null,
      "indestructible",
      null,
      "block",
      null,
    ],
    [
      null,
      "block",
      null,
      "indestructible",
      null,
      "block",
      null,
      "indestructible",
    ],
    [
      "block",
      null,
      "indestructible",
      null,
      "block",
      null,
      "indestructible",
      null,
    ],
    [
      null,
      "indestructible",
      null,
      "block",
      null,
      "indestructible",
      null,
      "block",
    ],
    [
      "indestructible",
      null,
      "block",
      null,
      "indestructible",
      null,
      "block",
      null,
    ],
  ],
];

type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  row: number;
  type: "block" | "indestructible";
  alive: boolean;
};

function buildBlocks(levelIndex: number): Block[] {
  const pattern = LEVELS[levelIndex % LEVELS.length];
  const blocks: Block[] = [];
  for (let row = 0; row < BLOCK_ROWS; row++) {
    for (let col = 0; col < BLOCK_COLS; col++) {
      const cell = pattern[row][col];
      if (cell === null) continue;
      blocks.push({
        x: col * BLOCK_CELL_W + (BLOCK_CELL_W - BLOCK_W) / 2,
        y: BLOCK_TOP_MARGIN + row * BLOCK_H,
        w: BLOCK_W,
        h: BLOCK_H,
        row,
        type: cell,
        alive: true,
      });
    }
  }
  return blocks;
}

type Phase = "playing" | "gameover";

function createInitialState() {
  return {
    paddle: { x: (W - PADDLE_W) / 2 },
    ball: { x: 0, y: 0, dx: 0, dy: 0, attached: true },
    blocks: buildBlocks(0),
    score: 0,
    lives: 3,
    level: 1,
    phase: "playing" as Phase,
  };
}

export function BreakoutGame({
  onScore,
  onLives,
  onLevel,
  onGameOver,
  onReady,
  isPaused,
  skin = DEFAULT_BREAKOUT_SKIN,
}: GameProps & { skin?: BreakoutSkin }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const keysRef = useRef<Record<string, boolean>>({});
  const launchRequestedRef = useRef(false);
  const stateRef = useRef(createInitialState());
  const skinRef = useRef(skin);
  useEffect(() => {
    skinRef.current = skin;
  }, [skin]);

  const attachBall = useCallback(() => {
    const s = stateRef.current;
    s.ball.x = s.paddle.x + PADDLE_W / 2;
    s.ball.y = PADDLE_Y - BALL_R;
    s.ball.dx = 0;
    s.ball.dy = 0;
    s.ball.attached = true;
  }, []);

  const reset = useCallback(() => {
    stateRef.current = createInitialState();
    attachBall();
    onScore(0);
    onLives(3);
    onLevel(1);
  }, [attachBall, onScore, onLives, onLevel]);

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
      if (e.code === "Space") {
        e.preventDefault();
        launchRequestedRef.current = true;
      }
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Canvas is rendered with object-fit: contain inside a box whose
      // aspect ratio may not match W/H, so it can be pillar/letterboxed.
      const boxAspect = rect.width / rect.height;
      const canvasAspect = W / H;
      let dispW = rect.width;
      let offsetX = 0;
      if (boxAspect > canvasAspect) {
        dispW = rect.height * canvasAspect;
        offsetX = (rect.width - dispW) / 2;
      }
      const x = ((e.clientX - rect.left - offsetX) / dispW) * W;
      const s = stateRef.current;
      s.paddle.x = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W / 2));
      if (s.ball.attached) attachBall();
    };
    const handleClick = () => {
      launchRequestedRef.current = true;
    };
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("click", handleClick);
    return () => {
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("click", handleClick);
    };
  }, [attachBall]);

  const launchBall = useCallback((level: number) => {
    const s = stateRef.current;
    if (!s.ball.attached) return;
    s.ball.attached = false;
    const speed = BASE_BALL_SPEED + (level - 1) * 20;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    s.ball.dx = Math.cos(angle) * speed;
    s.ball.dy = Math.sin(angle) * speed;
  }, []);

  const loseLife = useCallback(() => {
    const s = stateRef.current;
    s.lives--;
    onLives(s.lives);
    if (s.lives <= 0) {
      s.phase = "gameover";
      onGameOver();
      setRunning(false);
    } else {
      attachBall();
    }
  }, [onLives, onGameOver, attachBall]);

  const nextLevel = useCallback(() => {
    const s = stateRef.current;
    s.level++;
    s.blocks = buildBlocks(s.level - 1);
    attachBall();
    onLevel(s.level);
  }, [attachBall, onLevel]);

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
      if (s.phase === "gameover") return;

      if (keysRef.current["ArrowLeft"])
        s.paddle.x = Math.max(0, s.paddle.x - PADDLE_SPEED * dt);
      if (keysRef.current["ArrowRight"])
        s.paddle.x = Math.min(W - PADDLE_W, s.paddle.x + PADDLE_SPEED * dt);

      if (s.ball.attached) {
        s.ball.x = s.paddle.x + PADDLE_W / 2;
        s.ball.y = PADDLE_Y - BALL_R;
        if (launchRequestedRef.current) {
          launchRequestedRef.current = false;
          launchBall(s.level);
        }
        return;
      }
      launchRequestedRef.current = false;

      s.ball.x += s.ball.dx * dt;
      s.ball.y += s.ball.dy * dt;

      if (s.ball.x - BALL_R <= 0) {
        s.ball.x = BALL_R;
        s.ball.dx = -s.ball.dx;
      } else if (s.ball.x + BALL_R >= W) {
        s.ball.x = W - BALL_R;
        s.ball.dx = -s.ball.dx;
      }
      if (s.ball.y - BALL_R <= 0) {
        s.ball.y = BALL_R;
        s.ball.dy = -s.ball.dy;
      }

      if (s.ball.y - BALL_R > H) {
        loseLife();
        return;
      }

      // Paddle collision
      if (
        s.ball.dy > 0 &&
        s.ball.x + BALL_R > s.paddle.x &&
        s.ball.x - BALL_R < s.paddle.x + PADDLE_W &&
        s.ball.y + BALL_R > PADDLE_Y &&
        s.ball.y - BALL_R < PADDLE_Y + PADDLE_H
      ) {
        s.ball.y = PADDLE_Y - BALL_R;
        const hit = (s.ball.x - (s.paddle.x + PADDLE_W / 2)) / (PADDLE_W / 2);
        const speed = Math.hypot(s.ball.dx, s.ball.dy);
        const angle = -Math.PI / 2 + hit * (Math.PI / 3);
        s.ball.dx = Math.cos(angle) * speed;
        s.ball.dy = Math.sin(angle) * speed;
      }

      // Block collisions
      const scoreBefore = s.score;
      for (const block of s.blocks) {
        if (!block.alive) continue;
        const collides =
          s.ball.x + BALL_R > block.x &&
          s.ball.x - BALL_R < block.x + block.w &&
          s.ball.y + BALL_R > block.y &&
          s.ball.y - BALL_R < block.y + block.h;
        if (!collides) continue;

        const overlapX =
          Math.min(s.ball.x + BALL_R, block.x + block.w) -
          Math.max(s.ball.x - BALL_R, block.x);
        const overlapY =
          Math.min(s.ball.y + BALL_R, block.y + block.h) -
          Math.max(s.ball.y - BALL_R, block.y);
        if (overlapX < overlapY) s.ball.dx = -s.ball.dx;
        else s.ball.dy = -s.ball.dy;

        if (block.type !== "indestructible") {
          block.alive = false;
          s.score += POINTS_PER_BLOCK;
        }
        break;
      }
      if (s.score !== scoreBefore) onScore(s.score);

      if (s.blocks.every((b) => b.type === "indestructible" || !b.alive)) {
        if (s.level >= LEVELS.length) {
          s.phase = "gameover";
          onGameOver();
          setRunning(false);
        } else {
          nextLevel();
        }
      }
    };

    const draw = () => {
      const s = stateRef.current;
      const skin = skinRef.current;
      ctx.fillStyle = skin.bg;
      ctx.fillRect(0, 0, W, H);

      for (const block of s.blocks) {
        if (!block.alive) continue;
        ctx.fillStyle =
          block.type === "indestructible"
            ? skin.indestructible
            : skin.rowColors[block.row];
        ctx.fillRect(block.x, block.y, block.w, block.h);
        ctx.strokeStyle = skin.blockBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(block.x, block.y, block.w, block.h);
      }

      ctx.fillStyle = skin.paddle;
      ctx.fillRect(s.paddle.x, PADDLE_Y, PADDLE_W, PADDLE_H);

      ctx.beginPath();
      ctx.fillStyle = skin.ball;
      ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
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
  }, [running, isPaused, onScore, onGameOver, launchBall, loseLife, nextLevel]);

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
