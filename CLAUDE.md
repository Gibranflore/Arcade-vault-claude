# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault ("Es una plataforma para jugar online y competir por la mayor cantidad de puntos") — a Next.js App Router arcade platform: game library, playable Canvas games, Supabase-backed auth/leaderboard, and a Resend-powered contact form. Built via a spec-driven workflow (`specs/01`–`06`, mostly Implemented/Aprobado).

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint (flat config via `eslint.config.mjs`, extends `eslint-config-next` core-web-vitals + typescript)

There is no test runner configured yet. A Prettier + ESLint `PostToolUse` hook (`.claude/hooks/format-and-lint.js`) runs automatically after `Write`/`Edit`.

## Skills

- Usa siempre `/frontend-design` para diseñar la interfaz de usuario.
- `/spec` — diseña un spec nuevo sección por sección antes de escribir código (para features grandes: nuevas categorías de juego, reglas de scoring, cambios de esquema).
- `/spec-impl <NN-spec-name>` — implementa un spec ya Aprobado: crea la rama, implementa paso a paso con pausas para revisar diffs.
- `/add-game` — agrega un juego jugable nuevo siguiendo el patrón establecido por specs 05/06 (componente Canvas + registro en `app/lib/games.ts` + entrada en el dispatch de `GamePlayer.tsx`). Corre directo, sin generar spec ni gate de aprobación — usar `/spec` en su lugar si el juego requiere cambios de plataforma más grandes.

These skills are installed under `.claude/skills/` (`spec`, `spec-impl`, `add-game`) — no need to run the `npx skills@latest add Klerith/fernando-skills` install step referenced in the README, it's already done.

## Architecture

- Next.js 16.2.10 (App Router) + React 19, TypeScript, Tailwind CSS v4 (via `@tailwindcss/postcss`).
- Path alias `@/*` maps to the repo root (`tsconfig.json`).
- **This is not the Next.js you already know**: the installed Next.js version has breaking changes vs. training data. Before writing routing, data-fetching, or config code, check the relevant guide under `node_modules/next/dist/docs/` (organized into `01-app`, `02-pages`, `03-architecture`, `04-community`) and follow any deprecation notices found there.

### Routes (`app/`)

- `page.tsx` — home / game library (card grid or table view via `GameTable`).
- `about/page.tsx` — About + contact form (Resend, `app/lib/actions/contact.ts` server action).
- `juegos/[id]/page.tsx` — game detail page.
- `juegos/[id]/jugar/page.tsx` — game player screen (`GamePlayer.tsx`): idle/playing/paused/over states, HUD, save-score flow.
- `salon-de-la-fama/page.tsx` — Hall of Fame / leaderboard, per-game tabs + date range filter (Hoy/Semana/Mes/Siempre).

### Games (`app/games/`)

Playable (wired in `GAME_COMPONENTS` inside `GamePlayer.tsx`): `AsteroidsGame.tsx`, `BreakoutGame.tsx`, `TetrisGame.tsx`. `snake`, `invaders`, `pacman` are registered as catalog metadata in `app/lib/games.ts` but have no matching entry in `GAME_COMPONENTS`, so they render the "PRÓXIMAMENTE" placeholder (see `Proyectos\implemented-games.md`) when you need check

Each game is a single Canvas component implementing the `GameProps`/`GameHandle` contract in `app/games/types.ts` — no in-canvas HUD/overlays (the player screen owns those), no per-game persistence (scores go through the generic `app/lib/scores.ts` Supabase flow). See `.claude/skills/add-game/SKILL.md` for the full integration contract before touching this directory. Ported reference implementations (read-only, never edit) live under `Proyectos/` as separate nested git repos.

### Auth & data (Supabase)

- `app/lib/supabase/client.ts` / `server.ts` — Supabase client setup.
- `app/lib/auth.tsx` — auth context/provider (login/signup/logout, guest state).
- `app/lib/scores.ts` — score submission, leaderboard queries, user rank/best. Treat as generic/stable: never add per-game branches or modify the `scores` table schema/RLS from a game-integration task.
- `app/lib/games.ts` — static game registry (`GameDef`), the single source of truth for catalog metadata.

### Legacy/reference tree

`app/src/` is a pre-migration Vite/React tree (its own `App.tsx`, pages, games, `home-about/` HTML+JSX mockups) — not routed, not built. Useful as design/logic reference (e.g. original `GamePlayer.tsx` state machine) but pre-existing lint errors there are not anyone's concern going forward.

## Spec-driven workflow

Specs live in `specs/NN-slug.md`, driven by `/spec` (design) → `/spec-impl` (implementation once a spec's `**Estado:**` field is Aprobado). Based on `Klerith/fernando-skills` conventions (see README.md). Check `specs/` before starting large feature work — recent specs establish the current conventions.
