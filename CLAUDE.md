# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-page pixel-art Sokoban (推箱子) game built with Vite + TypeScript. The game features 70 levels, an AI solver/demo, a level editor, a random level generator, achievements, daily challenges, speedrun mode, a leaderboard, stats panels, skins/themes, i18n (zh-CN / en-US / ja-JP), and full PWA offline support.

## Running the Game

```bash
npm install       # install dev dependencies
npm run dev       # Vite dev server at http://localhost:3000 (auto-open)
npm run build     # type-check (tsc) then production build to dist/
npm run preview   # serve the production build from dist/
```

There is no test framework; use `python tools/test_quick.py` / `python tools/test_quick2.py` for ad-hoc solver sanity checks on levels.

## Architecture

Vite + TypeScript ES modules. `src/main.ts` is the entry; `index.html` loads it via `<script type="module">`. No runtime dependencies — only `typescript` and `vite` as devDependencies.

Key modules:

- **`src/game.ts`** — Core game logic: `state`, `loadLevel`, `tryMove`, `undo`, restart, win detection, push-only mode, playback mode.
- **`src/levels.ts`** — The 70 level maps (`LEVELS` array) plus level config (par moves, star thresholds).
- **`src/solver.ts`** — Async A*/BFS-style solver used by hints, AI demo, and the visualizer.
- **`src/ui.ts`** — DOM refs, board rendering, progress bar, message toasts.
- **`src/main.ts`** — Bootstraps everything: wires all feature modules to the UI and game events.
- **Feature modules** (imported by `main.ts`): `achievements`, `daily`, `speedrun`, `leaderboard`, `editor_modal`, `generator`, `skins`, `themes`, `stats_panel`, `heatmap`, `calendar`, `curve`, `charts`, `ghost` (replay), `macro`, `race`, `danmaku`, `combo`, `ai_coach`, `adaptive`, `hint_engine`, `i18n`, `pwa`, `saveload`, `export`, `share`, `sharecard`, `screenshot`, `notes`, `favorites`, `search`, `tutorial`, `gestures`, `haptic`, `accessibility`, `shortcuts`, `storage`, `sound_pack`, `audio`, `particles`, `animation`, `visualizer`, `visualizer_audio`, `timeline`, `perf`, `config`, `difficulty`, `worlds`, `web_utils`, `types`.

**Level map format** (standard Sokoban): `#` wall, ` ` floor, `.` goal, `$` box, `@` player, `*` box-on-goal, `+` player-on-goal.

**Persistence**: records, stats, config, and notes are stored in `localStorage` via `src/storage.ts` (key `pixelSokoban*`). Level data lives only in `src/levels.ts` / `src/generator.ts` — never hardcode maps elsewhere.

**PWA**: `public/sw.js` is the service worker (register `./sw.js` in `src/pwa.ts`, disabled on localhost); `public/manifest.json` and `public/icon-*.svg` are the install assets. Vite copies everything under `public/` verbatim to `dist/`.

## Adding a New Level

Append an entry to the `LEVELS` array in `src/levels.ts`, then validate solvability with `python tools/test_quick.py`. Every `$` must have a matching `.`.

## Coding Style

TypeScript ES modules, named imports/exports, 2-space indentation, semicolons, single quotes. Files in `src/` use `snake_case.ts`. `lowerCamelCase` for functions/variables, `UPPER_SNAKE_CASE` for constants. Comments follow the existing language (Chinese, with occasional English headers).

## Commit & Pull Request Guidelines

Use Conventional Commit-style prefixes (`feat:`, `fix:`, `chore:`, `docs:`) with a short Chinese description. For PRs include a brief summary, commands run, and screenshots/screen recording for UI changes.
