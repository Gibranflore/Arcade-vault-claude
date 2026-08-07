---
name: add-game
description: Adds a new playable game to Arcade Vault, wired into the game catalog, the player screen, and the Supabase-backed leaderboard. Optionally ports a vanilla JS/Canvas game from a Proyectos/ reference folder. Use it when the user wants to add or integrate a new game into the platform.
disable-model-invocation: true
argument-hint: 'game name + optional source (e.g. "tetris from Proyectos/claude-tetris-AI - copia" or "pong, new game from scratch")'
---

# /add-game — Add a playable game to Arcade Vault

This skill implements the integration pattern established by `specs/05-asteroids-jugable.md` and `specs/06-leaderboard-y-tabla-juegos.md`. It runs **directly** — no spec file is generated, no approval gate. Use `/spec` instead if the game requires larger platform changes (new game categories, new scoring rules, schema changes) beyond "add one more game following the existing pattern."

## Philosophy

Arcade Vault has no dynamic game plugin system. A "game" is: one React/Canvas component implementing a small contract, one entry in a static registry, and one line in a dispatch map. Score persistence, ranking, and the leaderboard table are already generic and require zero changes per game. This skill's only job is to produce those three pieces correctly and consistently — do not invent new integration points.

## Phase 1 — Determine source and mechanics

1. If the user points to a folder under `Proyectos/` (e.g. `Proyectos/08-arkanoi - copia`), read its main game logic file(s) (usually `game.js` plus any split modules like `paddle.js`/`ball.js`/`blocks.js`). Understand:
   - The core update/render loop and what state it tracks (score, lives, level if any).
   - Entities and how they're drawn (plain `CanvasRenderingContext2D` calls — no external libraries are used in any reference game).
   - Controls (usually keyboard).
   - Any persistence the original game does on its own (`localStorage`, in-memory score display, etc.) — **all of this will be discarded**, not ported. `claude-tetris-AI - copia` in particular has a full `localStorage` leaderboard (`tetris_scores`) that must NOT be carried over; Arcade Vault's leaderboard lives in Supabase and is already wired generically.
   - These reference folders are separate nested git repos (their own `.git`, no submodule config) — treat them as read-only reference material. Never edit files inside `Proyectos/`.
2. If there is no reference folder (game built from scratch), confirm with the user only what's needed to build a minimal playable loop: what the player controls, what scores points, what ends the game (lives reaching 0, a timer, a fail condition). Don't over-ask — this phase is meant to be quick, unlike `/spec`'s Phase 2.

## Phase 2 — Create the game component

Create `app/games/<PascalName>Game.tsx` (e.g. `ArkanoidGame.tsx`). Use `app/games/AsteroidsGame.tsx` as the concrete reference implementation and `app/games/types.ts` for the contract:

```ts
export type GameProps = {
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: () => void;
  onReady: (handle: GameHandle) => void;
  isPaused: boolean;
};

export type GameHandle = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
};
```

Rules for this component:

- Render a single `<canvas>` at a fixed internal resolution, scaled to its container via CSS (Asteroids uses 800×600 — match that unless the ported game needs a different aspect ratio, in which case keep it consistent with the `aspect-[4/3] sm:aspect-[3/2]` bezel in `GamePlayer.tsx`).
- **No in-canvas HUD, no in-canvas game-over screen, no in-canvas pause menu.** `GamePlayer.tsx` already renders score/lives/level, idle/paused/game-over overlays, and the CRT bezel chrome. Strip any of that from a ported game's original code.
- Report state changes via the callback props as they happen (`onScore`, `onLives`, `onLevel`) — don't wait until game-over to report.
- Call `onGameOver()` exactly once when the run ends.
- Call `onReady(handle)` once, with an object exposing `start/pause/resume/reset`, so `GamePlayer.tsx` can drive the game imperatively via a ref. `reset()` should fully reinitialize state (matches the "DE NUEVO" button).
- Respect `isPaused` — stop the update loop (but keep rendering the last frame) while `true`.
- Default controls: Arrow keys + Space, matching Asteroids. If the ported game's original controls differ meaningfully (e.g. Tetris needs a rotate key), keep them but document the final control scheme — it goes into the `controls` field in Phase 3.
- Do not add new npm dependencies or build tooling. Every reference game is dependency-free vanilla Canvas; keep new games the same way (plain React + Canvas, `useRef`/`useEffect` for the loop).

## Phase 3 — Register the game

Add an entry to `GAMES` (or `COMING_SOON_GAMES` if it isn't playable yet) in `app/lib/games.ts`:

```ts
export type GameDef = {
  id: string; // slug, used as route param AND as scores.game_id — must be stable once played
  title: string;
  description: string;
  longDescription: string;
  category: GameCategory; // "Clásico" | "Acción" | "Puzzle" | "Arcade"
  color: string; // hex, used for icon glow
  accent: "cyan" | "magenta" | "yellow" | "green";
  icon: LucideIcon;
  controls: string; // short human-readable string, shown on idle/próximamente screens
  year: string;
};
```

Pick an `id` slug that doesn't collide with an existing entry. Once a game has real scores in Supabase, its `id` must never change (it's the foreign key used by `submitScore`/`getLeaderboard`/`getUserRank`).

## Phase 4 — Wire the dispatch

`app/components/GamePlayer.tsx` renders playable games through a registry:

```ts
const GAME_COMPONENTS: Record<string, ComponentType<GameProps>> = {
  asteroids: AsteroidsGame,
};
```

Add the new game's import and one entry to this map, keyed by the same `id` used in Phase 3. Do not touch anything else in `GamePlayer.tsx` — HUD, overlays, and `submitScore` wiring are already generic and apply to any entry in the map. If `game.id` isn't in `GAME_COMPONENTS`, the file already falls back to the "PRÓXIMAMENTE" placeholder — that's the correct behavior for a `COMING_SOON_GAMES` entry, not something to work around.

## Phase 5 — Verify

1. `npm run dev`, open `/juegos/<id>/jugar`.
2. Play a full cycle: idle screen → INICIAR → play until game over → confirm score/lives/level updated live in the HUD during play → game-over overlay shows the right final score.
3. If logged in: GUARDAR → confirm no error, confirm the score shows up on `/salon-de-la-fama` for that game and updates the "TU MEJOR MARCA" rank.
4. If a guest: confirm the "Inicia sesión para guardar..." message appears instead of a GUARDAR button.
5. Confirm the game appears correctly on `/` in both the card grid (`GameCard`) and the table view (`GameTable`), with a best-score column populated once a score exists.
6. `npm run lint` — must not introduce new errors (pre-existing errors in `app/src/`, a stale non-routed tree, are not your concern).

## Hard rules

- Never modify the `scores` table schema, RLS policies, or `app/lib/scores.ts` — persistence and ranking are already generic.
- Never add a game-specific branch inside `GamePlayer.tsx` beyond the one `GAME_COMPONENTS` map entry.
- Never port a reference game's own score persistence (`localStorage` leaderboards, in-memory-only score display) — replace it entirely with the callback-driven contract.
- Never introduce a new dependency, bundler, or build step — games stay plain React + Canvas.
- Never edit files inside `Proyectos/` — it's read-only reference material.
- Keep the CRT/arcade visual language intact — the ported game only needs to draw itself inside the canvas; the bezel, HUD, and overlays are the platform's responsibility, not the game's.

## Arguments

If invoked as `/add-game <description>`, use `$ARGUMENTS` to determine the source (a `Proyectos/` folder name, or "from scratch") and the intended game name/slug before starting Phase 1. If invoked with no arguments, ask for the game name and whether it's ported from a `Proyectos/` folder or built from scratch.
