# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-page pixel-art Sokoban (推箱子) game in vanilla HTML/CSS/JS — no build step, no dependencies, no package manager.

## Running the Game

Open `index.html` directly in a browser. There is no build, no server required, no install step.

For a quick local server if needed:
```bash
python -m http.server 8080
# or
npx serve .
```

## Architecture

Three files, no modules:

- **`index.html`** — Static markup. Two sections: `.panel` (stats/controls sidebar) and `.game-shell` (board + d-pad). Win modal is `#winModal`. All DOM IDs are grabbed at top of `game.js`.
- **`game.js`** — All game logic. Single global `state` object. No classes, no modules.
- **`style.css`** — Pure CSS pixel-art rendering. All tile sprites are drawn entirely in CSS using `box-shadow`, gradients, and pseudo-elements — no image assets.

## Key Conventions in game.js

**Map format**: Levels are stored as arrays of strings using standard Sokoban characters: `#` wall, ` ` floor, `.` goal, `$` box, `@` player, `*` box-on-goal, `+` player-on-goal.

**State**: `state.grid` is a 2D array of characters (mutable). `state.goals` is a fixed list of goal coordinates extracted at `loadLevel` time and never mutated — used to restore floor/goal tiles when entities move off them.

**Undo**: Full grid snapshots are pushed to `state.history` before every move via `saveHistory()`. Undo pops and restores the last snapshot.

**Rendering**: `render()` tears down and rebuilds all `.tile` DOM elements on every frame. Tile appearance is driven entirely by CSS classes (`wall`, `goal`, `crate`, `player`) and `data-facing` / `data-step` attributes for player animation direction.

**Audio**: Web Audio API, procedural only. `audio.unlock()` must be called on first user interaction (browser autoplay policy). BGM runs on a `setInterval` tick loop. SFX are fire-and-forget oscillator nodes.

**Persistence**: Best records stored in `localStorage` under key `pixelSokobanRecords` as `{ version: 1, levels: { [levelIndex]: { bestMoves, bestPushes, bestRank, challengeCleared, cleared } } }`.

**Ranking**: Each level has `parMoves` (challenge threshold) and `starMoves: { three, two, one }`. `getRank()` maps move count to ★★★/★★/★/通关.

## Adding a New Level

Append an entry to the `LEVELS` array in `game.js`. The `levelLabel` display (`1 / 9`) derives from `LEVELS.length` automatically. Validate that every `$` has a matching `.` in the map.
