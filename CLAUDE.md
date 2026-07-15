# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault ("Es una plataforma para jugar online y competir por la mayor cantidad de puntos") — currently a fresh Next.js App Router scaffold with no custom routes/components beyond the default `create-next-app` output.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint (flat config via `eslint.config.mjs`, extends `eslint-config-next` core-web-vitals + typescript)

There is no test runner configured yet.

## Architecture

- Next.js 16.2.10 (App Router) + React 19, TypeScript, Tailwind CSS v4 (via `@tailwindcss/postcss`).
- `app/` — App Router root: `layout.tsx` (root layout, Geist fonts), `page.tsx` (home page), `globals.css`.
- Path alias `@/*` maps to the repo root (`tsconfig.json`).
- **This is not the Next.js you already know**: the installed Next.js version has breaking changes vs. training data. Before writing routing, data-fetching, or config code, check the relevant guide under `node_modules/next/dist/docs/` (organized into `01-app`, `02-pages`, `03-architecture`, `04-community`) and follow any deprecation notices found there.

## Spec-driven workflow

The README references a spec-driven design workflow (`/spec` and `/spec-impl`) based on the `Klerith/fernando-skills` skill pack:

```bash
npx skills@latest add Klerith/fernando-skills
```

These skills are not yet installed in this repo — if `/spec` or `/spec-impl` commands are referenced but unavailable, the user may need to run the above install command first.
