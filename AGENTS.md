# Repository Guidelines

## Project Structure & Module Organization
This repo is a Vite + TypeScript single-page game. Source lives in `src/` with `src/main.ts` as the entry and feature modules like `ai_coach.ts`, `stats_panel.ts`, and `sharecard.ts`. Static assets live at the repo root alongside the app shell. `dist/` is build output.

Key paths:
- `src/` TypeScript modules (ESM)
- `index.html` app shell, `<script type="module" src="./src/main.ts">`
- `style.css` global styles and pixel-art UI
- `manifest.json`, `sw.js`, `icon-*.svg` PWA assets
- `dist/` generated build (do not edit)

## Build, Test, and Development Commands
- `npm install` or `npm ci` to install dev dependencies
- `npm run dev` starts the Vite dev server at `http://localhost:3000` with auto-open
- `npm run build` runs `tsc` then `vite build` to produce `dist/`
- `npm run preview` serves the production build from `dist/`
- `python test_quick.py` / `python test_quick2.py` run ad-hoc solver sanity checks for levels

## Coding Style & Naming Conventions
Use TypeScript ES modules with named imports/exports. Match existing formatting: 2-space indentation, semicolons, and single quotes. File names in `src/` use `snake_case.ts` (for example, `ai_coach.ts`, `stats_panel.ts`); follow that for new modules. Keep functions and variables in `lowerCamelCase`, constants in `UPPER_SNAKE_CASE`.

## Testing Guidelines
There is no automated test framework or coverage tooling configured. Manual smoke testing via `npm run dev` is expected, and the Python quick-check scripts are used for level validation when relevant.

## Commit & Pull Request Guidelines
Recent history uses Conventional Commit-style prefixes like `feat:` and `fix:` followed by a short description (often in Chinese). Keep that pattern and keep messages concise. For PRs, include a brief summary, list the commands you ran (if any), and add screenshots or a short screen recording for UI changes.
