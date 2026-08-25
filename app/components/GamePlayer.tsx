"use client";

import { useState, useRef, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Pause,
  X,
  Play,
  RotateCcw,
  Save,
  Home,
  Heart,
  Clock,
} from "lucide-react";
import type { ComponentType } from "react";
import type { GameDef } from "@/app/lib/games";
import { useAuth } from "@/app/lib/auth";
import { submitScore } from "@/app/lib/scores";
import { AsteroidsGame } from "@/app/games/AsteroidsGame";
import { TetrisGame } from "@/app/games/TetrisGame";
import { BreakoutGame } from "@/app/games/BreakoutGame";
import { FroggerGame } from "@/app/games/FroggerGame";
import { SnakeGame } from "@/app/games/SnakeGame";
import type { GameHandle, GameProps } from "@/app/games/types";
import { ASTEROIDS_SKINS } from "@/app/games/asteroidsSkins";
import { BREAKOUT_SKINS } from "@/app/games/breakoutSkins";
import { TETRIS_SKINS } from "@/app/games/tetrisSkins";
import { FROGGER_SKINS } from "@/app/games/froggerSkins";
import { SNAKE_SKINS } from "@/app/games/snakeSkins";

type SkinId = "classic" | "neon" | "retro";

// Registry of per-game skin options for the HUD selector below. To add skins
// for a new game: define its palettes (see app/games/*Skins.ts), add an
// entry here, and spread `skin: <GAME>_SKINS[skinId]` into its GameComponent.
const GAME_SKINS: Record<
  string,
  { options: { id: SkinId; label: string }[]; defaultId: SkinId }
> = {
  asteroids: {
    options: Object.values(ASTEROIDS_SKINS).map((s) => ({
      id: s.id,
      label: s.label,
    })),
    defaultId: "classic",
  },
  breakout: {
    options: Object.values(BREAKOUT_SKINS).map((s) => ({
      id: s.id,
      label: s.label,
    })),
    defaultId: "classic",
  },
  tetris: {
    options: Object.values(TETRIS_SKINS).map((s) => ({
      id: s.id,
      label: s.label,
    })),
    defaultId: "classic",
  },
  frogger: {
    options: Object.values(FROGGER_SKINS).map((s) => ({
      id: s.id,
      label: s.label,
    })),
    defaultId: "classic",
  },
  snake: {
    options: Object.values(SNAKE_SKINS).map((s) => ({
      id: s.id,
      label: s.label,
    })),
    defaultId: "classic",
  },
};

function subscribeNoop() {
  return () => {};
}

function readSkinId(gameId: string, defaultId: SkinId): SkinId {
  try {
    const stored = localStorage.getItem(`skin:${gameId}`);
    if (stored === "classic" || stored === "neon" || stored === "retro")
      return stored;
  } catch {
    // localStorage unavailable (private browsing, etc.) — keep default
  }
  return defaultId;
}

function writeSkinId(gameId: string, id: SkinId) {
  try {
    localStorage.setItem(`skin:${gameId}`, id);
  } catch {
    // localStorage unavailable — skin still applies for this session
  }
}

type GameState = "idle" | "playing" | "paused" | "over";

// Registry of playable game components, keyed by GameDef.id. To add a new
// game: implement it under app/games/ following GameProps/GameHandle, then
// add its entry here — no other changes to this file are needed.
const GAME_COMPONENTS: Record<string, ComponentType<GameProps>> = {
  asteroids: AsteroidsGame,
  tetris: TetrisGame,
  breakout: BreakoutGame,
  frogger: FroggerGame,
  snake: SnakeGame,
};

type TouchButton = {
  code: string; // KeyboardEvent.code a despachar en keydown/keyup (ignorado si disabled)
  label: string; // texto/símbolo del botón (ej. "←", "↑", "A")
  className?: string; // clases extra para tamaño/posición dentro del grupo
  disabled?: boolean; // true = botón inerte del D-pad (visual, sin handlers ni dispatch)
};

type TouchControlLayout = {
  left: TouchButton[]; // grupo de botones renderizado a la izquierda del canvas
  right: TouchButton[]; // grupo de botones renderizado a la derecha del canvas
};

// Registry of per-game touch control layouts. To add controls for a new
// game: define its layout here (buttons dispatch synthetic KeyboardEvents
// reusing the game's existing keyboard listeners — see TouchControlButton).
const GAME_TOUCH_CONTROLS: Record<string, TouchControlLayout> = {
  asteroids: {
    left: [
      { code: "ArrowUp", label: "↑" },
      { code: "ArrowDown", label: "↓", disabled: true },
      { code: "ArrowLeft", label: "←" },
      { code: "ArrowRight", label: "→" },
    ],
    right: [{ code: "Space", label: "A" }],
  },
  tetris: {
    left: [
      { code: "ArrowUp", label: "↑", disabled: true },
      { code: "ArrowDown", label: "↓" },
      { code: "ArrowLeft", label: "←" },
      { code: "ArrowRight", label: "→" },
    ],
    right: [
      { code: "Space", label: "A" },
      { code: "ArrowUp", label: "B" },
    ],
  },
  frogger: {
    left: [
      { code: "ArrowLeft", label: "←" },
      { code: "ArrowUp", label: "↑" },
      { code: "ArrowDown", label: "↓" },
      { code: "ArrowRight", label: "→" },
    ],
    right: [],
  },
  snake: {
    left: [
      { code: "ArrowLeft", label: "←" },
      { code: "ArrowUp", label: "↑" },
      { code: "ArrowDown", label: "↓" },
      { code: "ArrowRight", label: "→" },
    ],
    right: [],
  },
  // breakout: sin entrada — usa drag+tap directo sobre el canvas (ver BreakoutGame.tsx)
};

function isDpadGroup(buttons: TouchButton[]): boolean {
  if (buttons.length !== 4) return false;
  const codes = new Set(buttons.map((b) => b.code));
  return (
    codes.has("ArrowUp") &&
    codes.has("ArrowDown") &&
    codes.has("ArrowLeft") &&
    codes.has("ArrowRight")
  );
}

// Visual role of a touch button within the neon gamepad: "dpad" for the
// square directional keys, "action-a"/"action-b" for the two circular
// action buttons (magenta/cyan respectively, matching the Gamepad MK-II
// reference asset). Defaults to "dpad" so existing call sites keep working
// until callers are updated to pass the right variant.
type TouchButtonVariant = "dpad" | "action-a" | "action-b";

const DPAD_BASE =
  "select-none flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-lg border border-white/5 bg-gradient-to-b from-[#1a1a25] to-[#0a0a12] text-white/50 font-pixel text-[10px] sm:text-xs shadow-[0_4px_0_#050507] transition-all duration-100";
const DPAD_PRESSABLE =
  "active:translate-y-[3px] active:text-neon-cyan active:border-neon-cyan/60 active:from-[#08161e] active:to-[#030a0e] active:shadow-[0_1px_0_#050507,0_0_16px_rgba(0,245,255,0.5)]";
const DPAD_DISABLED = "opacity-30";

const ACTION_BASE =
  "select-none relative flex items-center justify-center w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-full border-2 font-pixel text-lg sm:text-xl text-white transition-all duration-100 before:content-[''] before:absolute before:-inset-2 before:rounded-full before:border before:border-dashed before:border-current before:opacity-0 before:scale-90 before:transition-all before:duration-150";
const ACTION_PRESSABLE =
  "active:translate-y-[4px] active:scale-[0.97] active:before:opacity-100 active:before:scale-100";
const ACTION_A_COLORS =
  "border-neon-magenta bg-[radial-gradient(circle_at_32%_26%,rgba(255,255,255,0.25),transparent_50%),radial-gradient(circle_at_50%_55%,rgba(255,0,110,0.7),rgba(110,0,40,0.95)_75%)] shadow-[0_6px_0_#050507,0_0_22px_rgba(255,0,110,0.4)] active:shadow-[0_1px_0_#050507,0_0_36px_rgba(255,0,110,0.4)]";
const ACTION_B_COLORS =
  "border-neon-cyan bg-[radial-gradient(circle_at_32%_26%,rgba(255,255,255,0.25),transparent_50%),radial-gradient(circle_at_50%_55%,rgba(0,200,230,0.7),rgba(0,50,70,0.95)_75%)] shadow-[0_6px_0_#050507,0_0_22px_rgba(0,245,255,0.4)] active:shadow-[0_1px_0_#050507,0_0_36px_rgba(0,245,255,0.4)]";
const ACTION_DISABLED = "opacity-30 border-white/10 bg-black/60";

// Single touch button: dispatches one keydown on press and one keyup on
// release/cancel/leave, so existing keyboard listeners in each GameComponent
// react exactly as if the equivalent physical key had been pressed.
// A `disabled` button (declared in GAME_TOUCH_CONTROLS for a direction a
// game doesn't use) renders inert: no pointer handlers, no dispatch, dimmed.
function TouchControlButton({
  button,
  variant = "dpad",
}: {
  button: TouchButton;
  variant?: TouchButtonVariant;
}) {
  const pressedRef = useRef(false);
  const isDpad = variant === "dpad";

  const dispatchKey = (type: "keydown" | "keyup") => {
    window.dispatchEvent(new KeyboardEvent(type, { code: button.code }));
  };

  const handlePress = (e: React.PointerEvent) => {
    e.preventDefault();
    if (pressedRef.current) return;
    pressedRef.current = true;
    dispatchKey("keydown");
  };

  const handleRelease = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!pressedRef.current) return;
    pressedRef.current = false;
    dispatchKey("keyup");
  };

  if (button.disabled) {
    return (
      <div
        aria-hidden="true"
        className={`${isDpad ? DPAD_BASE : ACTION_BASE} ${
          isDpad ? DPAD_DISABLED : ACTION_DISABLED
        } ${button.className ?? ""}`}
      >
        {button.label}
      </div>
    );
  }

  const variantClasses = isDpad
    ? `${DPAD_BASE} ${DPAD_PRESSABLE}`
    : `${ACTION_BASE} ${ACTION_PRESSABLE} ${
        variant === "action-a" ? ACTION_A_COLORS : ACTION_B_COLORS
      }`;

  return (
    <button
      onPointerDown={handlePress}
      onPointerUp={handleRelease}
      onPointerCancel={handleRelease}
      onPointerLeave={handleRelease}
      className={`${variantClasses} ${button.className ?? ""}`}
      style={{ touchAction: "none" }}
    >
      {button.label}
    </button>
  );
}

function TouchControlGroup({ buttons }: { buttons: TouchButton[] }) {
  if (buttons.length === 0) return null;

  if (isDpadGroup(buttons)) {
    const byCode = Object.fromEntries(buttons.map((b) => [b.code, b]));
    return (
      <div className="relative grid grid-cols-3 grid-rows-3 gap-1">
        <div />
        <TouchControlButton button={byCode["ArrowUp"]} />
        <div />
        <TouchControlButton button={byCode["ArrowLeft"]} />
        <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-md bg-[radial-gradient(circle_at_50%_50%,#181822_0%,#08080d_80%)] border border-neon-cyan/15 shadow-[inset_0_0_12px_rgba(0,0,0,0.8)]">
          <span className="w-3 h-3 rotate-45 bg-neon-cyan shadow-[0_0_10px_var(--color-neon-cyan)] animate-pulse" />
        </div>
        <TouchControlButton button={byCode["ArrowRight"]} />
        <div />
        <TouchControlButton button={byCode["ArrowDown"]} />
        <div />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {buttons.map((btn, i) => (
        <TouchControlButton
          key={btn.code}
          button={btn}
          variant={i === 0 ? "action-a" : "action-b"}
        />
      ))}
    </div>
  );
}

// Mounted only while gameState === "playing" for games with a registered
// layout. Renders left/right button groups in normal flow BELOW the game's
// aspect-ratio container (not overlapping the canvas). Hidden at sm: and
// above — only shown on narrow (mobile-sized) viewports, via a plain CSS
// breakpoint rather than touch-device feature detection.
function TouchControlsOverlay({ layout }: { layout: TouchControlLayout }) {
  const hasRight = layout.right.length > 0;
  return (
    <div className="pt-3 pb-1 px-1 sm:hidden" style={{ touchAction: "none" }}>
      <div className="relative rounded-2xl border border-neon-cyan/20 bg-gradient-to-b from-[#1c1c28] to-[#0c0c14] px-4 py-4 shadow-[0_20px_50px_-20px_rgba(0,245,255,0.35),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-2px_0_rgba(0,0,0,0.6)]">
        <div className="pointer-events-none absolute inset-1 rounded-xl border border-neon-cyan/10" />
        <div
          className={`relative flex items-center gap-4 ${
            hasRight ? "justify-between" : "justify-center"
          }`}
        >
          <TouchControlGroup buttons={layout.left} />
          {hasRight && <TouchControlGroup buttons={layout.right} />}
        </div>
      </div>
    </div>
  );
}

const accentMap = {
  cyan: "text-neon-cyan",
  magenta: "text-neon-magenta",
  yellow: "text-neon-yellow",
  green: "text-neon-green",
};

const accentBorderMap = {
  cyan: "border-neon-cyan",
  magenta: "border-neon-magenta",
  yellow: "border-neon-yellow",
  green: "border-neon-green",
};

export function GamePlayer({ game }: { game: GameDef }) {
  const { user, displayName } = useAuth();
  const a = accentMap[game.accent];
  const GameComponent = GAME_COMPONENTS[game.id];

  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const skinConfig = GAME_SKINS[game.id];
  const storedSkinId = useSyncExternalStore(
    subscribeNoop,
    () => readSkinId(game.id, skinConfig?.defaultId ?? "classic"),
    () => skinConfig?.defaultId ?? "classic",
  );
  const [skinOverride, setSkinOverride] = useState<SkinId | null>(null);
  const skinId = skinOverride ?? storedSkinId;
  const gameRef = useRef<GameHandle | null>(null);

  const handleSkinChange = useCallback(
    (id: SkinId) => {
      setSkinOverride(id);
      writeSkinId(game.id, id);
    },
    [game.id],
  );

  const handleScoreChange = useCallback((s: number) => setScore(s), []);
  const handleLivesChange = useCallback((l: number) => setLives(l), []);
  const handleLevelChange = useCallback((l: number) => setLevel(l), []);
  const handleGameOver = useCallback(() => setGameState("over"), []);

  const handleStart = useCallback(() => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setSaved(false);
    setSaveError(null);
    setGameState("playing");
    gameRef.current?.start();
  }, []);

  const handlePause = useCallback(() => {
    if (gameState === "playing") {
      gameRef.current?.pause();
      setGameState("paused");
    }
  }, [gameState]);

  const handleResume = useCallback(() => {
    gameRef.current?.resume();
    setGameState("playing");
  }, []);

  const handleRestart = useCallback(() => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setSaved(false);
    setSaveError(null);
    setGameState("playing");
    gameRef.current?.reset();
  }, []);

  const handleSaveScore = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    const { error } = await submitScore(game.id, user.id, score);
    if (error) {
      setSaveError(error);
    } else {
      setSaved(true);
    }
    setSaving(false);
  }, [game.id, score, user]);

  if (!GameComponent) {
    return (
      <div className="page-enter min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-6">
        {/* HUD */}
        <div className="w-full max-w-3xl mb-4">
          <div className="flex items-center justify-between bg-vault-panel border border-vault-border rounded-lg px-4 py-3">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex flex-col">
                <span className="font-pixel text-[8px] text-gray-500 uppercase">
                  Jugador
                </span>
                <span className="font-mono text-sm text-white truncate max-w-[100px]">
                  {displayName}
                </span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-pixel text-[8px] text-gray-500 uppercase">
                  Juego
                </span>
                <span className={`font-mono text-sm ${a}`}>{game.title}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls bar */}
        <div className="w-full max-w-3xl flex items-center justify-between mb-3">
          <Link
            href={`/juegos/${game.id}`}
            className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-gray-400 hover:text-neon-magenta border border-vault-border hover:border-neon-magenta/50 rounded transition-all active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
            SALIR
          </Link>
        </div>

        {/* CRT Monitor Bezel */}
        <div className="relative w-full max-w-3xl">
          {/* Outer bezel */}
          <div className="bg-gradient-to-b from-[#1a1a28] to-[#0d0d15] p-3 sm:p-5 rounded-2xl border-2 border-vault-border shadow-2xl">
            {/* Inner screen */}
            <div className="crt-screen relative bg-black rounded-xl overflow-hidden border border-vault-border">
              <div className="relative aspect-[4/3] sm:aspect-[3/2] flex items-center justify-center">
                {/* Próximamente placeholder */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 px-4">
                  <Clock className="w-14 h-14 mb-4 text-gray-500" />
                  <game.icon
                    className="w-16 h-16 mb-4"
                    style={{
                      color: game.color,
                      filter: `drop-shadow(0 0 15px ${game.color})`,
                    }}
                  />
                  <h2 className={`font-pixel text-lg ${a} mb-2 text-center`}>
                    {game.title}
                  </h2>
                  <p className="font-pixel text-sm text-gray-400 mb-4 tracking-wide">
                    PRÓXIMAMENTE
                  </p>
                  <p className="font-mono text-xs text-gray-500">
                    Controles: {game.controls}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-6">
      {/* HUD */}
      <div className="w-full max-w-3xl mb-4">
        <div className="flex items-center justify-between bg-vault-panel border border-vault-border rounded-lg px-4 py-3">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col">
              <span className="font-pixel text-[8px] text-gray-500 uppercase">
                Jugador
              </span>
              <span className="font-mono text-sm text-white truncate max-w-[100px]">
                {displayName}
              </span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-pixel text-[8px] text-gray-500 uppercase">
                Juego
              </span>
              <span className={`font-mono text-sm ${a}`}>{game.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-end">
              <span className="font-pixel text-[8px] text-gray-500 uppercase">
                Puntuación
              </span>
              <span className={`font-pixel text-sm ${a}`}>
                {score.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-pixel text-[8px] text-gray-500 uppercase">
                Vidas
              </span>
              <span className="flex items-center gap-0.5">
                {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
                  <Heart
                    key={i}
                    className="w-3 h-3 text-neon-magenta fill-neon-magenta"
                  />
                ))}
                {lives <= 0 && (
                  <span className="font-mono text-sm text-gray-500">0</span>
                )}
              </span>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-pixel text-[8px] text-gray-500 uppercase">
                Nivel
              </span>
              <span className="font-pixel text-sm text-white">{level}</span>
            </div>
            {skinConfig && (
              <div className="flex flex-col items-end">
                <span className="font-pixel text-[8px] text-gray-500 uppercase">
                  Skin
                </span>
                <span className="flex items-center gap-1">
                  {skinConfig.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSkinChange(opt.id)}
                      className={`px-1.5 py-0.5 font-mono text-[10px] border rounded transition-all active:scale-95 ${
                        skinId === opt.id
                          ? `${a} border-current`
                          : "text-gray-500 border-vault-border hover:text-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-3">
        <Link
          href={`/juegos/${game.id}`}
          className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-gray-400 hover:text-neon-magenta border border-vault-border hover:border-neon-magenta/50 rounded transition-all active:scale-95"
        >
          <X className="w-3.5 h-3.5" />
          SALIR
        </Link>
        {gameState === "playing" && (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-gray-400 hover:text-neon-yellow border border-vault-border hover:border-neon-yellow/50 rounded transition-all active:scale-95"
          >
            <Pause className="w-3.5 h-3.5" />
            PAUSA
          </button>
        )}
        {gameState === "paused" && (
          <button
            onClick={handleResume}
            className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-gray-400 hover:text-neon-cyan border border-vault-border hover:border-neon-cyan/50 rounded transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5" />
            CONTINUAR
          </button>
        )}
      </div>

      {/* CRT Monitor Bezel */}
      <div className="relative w-full max-w-3xl">
        {/* Outer bezel */}
        <div className="bg-gradient-to-b from-[#1a1a28] to-[#0d0d15] p-3 sm:p-5 rounded-2xl border-2 border-vault-border shadow-2xl">
          {/* Inner screen */}
          <div className="crt-screen relative bg-black rounded-xl overflow-hidden border border-vault-border">
            {/* Game canvas */}
            <div className="relative aspect-[4/3] sm:aspect-[3/2] flex items-center justify-center">
              <GameComponent
                onScore={handleScoreChange}
                onLives={handleLivesChange}
                onLevel={handleLevelChange}
                onGameOver={handleGameOver}
                onReady={(handle) => {
                  gameRef.current = handle;
                }}
                isPaused={gameState === "paused"}
                {...(game.id === "asteroids"
                  ? { skin: ASTEROIDS_SKINS[skinId] }
                  : {})}
                {...(game.id === "breakout"
                  ? { skin: BREAKOUT_SKINS[skinId] }
                  : {})}
                {...(game.id === "tetris"
                  ? { skin: TETRIS_SKINS[skinId] }
                  : {})}
                {...(game.id === "frogger"
                  ? { skin: FROGGER_SKINS[skinId] }
                  : {})}
                {...(game.id === "snake" ? { skin: SNAKE_SKINS[skinId] } : {})}
              />

              {/* Idle overlay */}
              {gameState === "idle" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                  <game.icon
                    className="w-16 h-16 mb-4"
                    style={{
                      color: game.color,
                      filter: `drop-shadow(0 0 15px ${game.color})`,
                    }}
                  />
                  <h2
                    className={`font-pixel text-lg ${a} mb-6 text-center px-4`}
                  >
                    {game.title}
                  </h2>
                  <button
                    onClick={handleStart}
                    className={`btn-pixel ${a} border-2 ${accentBorderMap[game.accent]} hover:bg-white/5 animate-pulse-glow active:scale-95`}
                  >
                    <span className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      INICIAR
                    </span>
                  </button>
                  <p className="font-mono text-xs text-gray-500 mt-4">
                    Controles: {game.controls}
                  </p>
                </div>
              )}

              {/* Paused overlay */}
              {gameState === "paused" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
                  <Pause className="w-12 h-12 text-neon-yellow mb-4" />
                  <h2 className="font-pixel text-lg text-neon-yellow mb-4">
                    PAUSA
                  </h2>
                  <div className="flex gap-3">
                    <button
                      onClick={handleResume}
                      className="btn-pixel text-neon-cyan border-2 border-neon-cyan hover:bg-neon-cyan/10 active:scale-95"
                    >
                      CONTINUAR
                    </button>
                    <Link
                      href={`/juegos/${game.id}`}
                      className="btn-pixel text-neon-magenta border-2 border-neon-magenta hover:bg-neon-magenta/10 active:scale-95"
                    >
                      SALIR
                    </Link>
                  </div>
                </div>
              )}

              {/* Game over modal */}
              {gameState === "over" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 px-4">
                  <h2 className="font-pixel text-xl sm:text-2xl text-neon-magenta mb-2 text-center animate-flicker">
                    FIN DEL JUEGO
                  </h2>
                  <div className="my-4 text-center">
                    <p className="font-pixel text-[10px] text-gray-500 uppercase mb-1">
                      Puntuación Final
                    </p>
                    <p className={`font-pixel text-2xl ${a}`}>
                      {score.toLocaleString()}
                    </p>
                  </div>

                  {saved ? (
                    <div className="mb-4">
                      <p className="typewriter font-pixel text-xs text-neon-green">
                        PUNTUACIÓN GUARDADA
                      </p>
                    </div>
                  ) : saveError ? (
                    <p className="font-mono text-xs text-neon-magenta mb-4">
                      {saveError}
                    </p>
                  ) : null}

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                    {user && !saved && (
                      <button
                        onClick={handleSaveScore}
                        disabled={saving || score <= 0}
                        className="btn-pixel flex-1 text-neon-green border-2 border-neon-green hover:bg-neon-green/10 active:scale-95 disabled:opacity-50"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Save className="w-3.5 h-3.5" />
                          {saving ? "GUARDANDO..." : "GUARDAR"}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={handleRestart}
                      className="btn-pixel flex-1 text-neon-cyan border-2 border-neon-cyan hover:bg-neon-cyan/10 active:scale-95"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <RotateCcw className="w-3.5 h-3.5" />
                        DE NUEVO
                      </span>
                    </button>
                  </div>
                  <Link
                    href={`/juegos/${game.id}`}
                    className="btn-pixel mt-3 w-full max-w-xs text-gray-400 border-2 border-vault-border hover:border-gray-500 active:scale-95"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Home className="w-3.5 h-3.5" />
                      VOLVER AL VAULT
                    </span>
                  </Link>

                  {!user && (
                    <p className="font-mono text-[10px] text-gray-600 mt-4 text-center max-w-xs">
                      Inicia sesión para guardar tus puntuaciones en el Salón de
                      la Fama
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Touch controls, below the canvas (not overlapping the game) */}
          {gameState === "playing" && GAME_TOUCH_CONTROLS[game.id] && (
            <TouchControlsOverlay layout={GAME_TOUCH_CONTROLS[game.id]} />
          )}
        </div>
      </div>
    </div>
  );
}
