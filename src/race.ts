// ─── 本地双人竞速模式 Local Two-Player Race Mode ─────────────────────────────
// 两名玩家在同一设备上竞速通关同一关卡，分屏显示

import type { Level } from './types';
import { TILE } from './types';

export interface RacePlayer {
  id: 1 | 2;
  name: string;
  grid: string[][];
  player: { x: number; y: number };
  goals: { x: number; y: number }[];
  moves: number;
  pushes: number;
  timeMs: number;
  startMs: number;
  won: boolean;
  history: string[][][];
}

export interface RaceState {
  active: boolean;
  levelIndex: number;
  p1: RacePlayer;
  p2: RacePlayer;
  winner: 1 | 2 | null;
  startTime: number;
}

const KEYS_P1 = { up: 'w', down: 's', left: 'a', right: 'd', undo: 'q' };
const KEYS_P2 = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', undo: '/' };

function initRacePlayer(id: 1 | 2, level: Level): RacePlayer {
  const grid = level.map.map(row => [...row]);
  let px = 0, py = 0;
  const goals: { x: number; y: number }[] = [];
  for (let y = 0; y < grid.length; y++)
    for (let x = 0; x < grid[y].length; x++) {
      const c = grid[y][x];
      if (c === TILE.PLAYER || c === TILE.PLAYER_ON_GOAL) { px = x; py = y; }
      if (c === TILE.GOAL || c === TILE.BOX_ON_GOAL || c === TILE.PLAYER_ON_GOAL) goals.push({ x, y });
    }
  return { id, name: id === 1 ? '玩家1(WASD)' : '玩家2(方向键)',
    grid, player: { x: px, y: py }, goals,
    moves: 0, pushes: 0, timeMs: 0, startMs: performance.now(),
    won: false, history: [] };
}

function isGoal(p: RacePlayer, x: number, y: number): boolean {
  return p.goals.some(g => g.x === x && g.y === y);
}

function checkWon(p: RacePlayer): boolean {
  return p.grid.every(row => !row.includes(TILE.BOX));
}

export class RaceMode {
  state: RaceState | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private rafId: number | null = null;
  private onUpdate: (() => void) | null = null;
  private onWin: ((winner: 1 | 2) => void) | null = null;

  start(level: Level, levelIndex: number, onUpdate: () => void, onWin: (w: 1|2) => void): void {
    this.state = {
      active: true, levelIndex,
      p1: initRacePlayer(1, level),
      p2: initRacePlayer(2, level),
      winner: null,
      startTime: performance.now(),
    };
    this.onUpdate = onUpdate;
    this.onWin = onWin;
    this.keyHandler = this.handleKey.bind(this);
    document.addEventListener('keydown', this.keyHandler);
    this.tick();
  }

  private tick(): void {
    if (!this.state?.active) return;
    const now = performance.now();
    if (!this.state.p1.won) this.state.p1.timeMs = now - this.state.p1.startMs;
    if (!this.state.p2.won) this.state.p2.timeMs = now - this.state.p2.startMs;
    this.rafId = requestAnimationFrame(() => this.tick());
  }

  private handleKey(e: KeyboardEvent): void {
    if (!this.state?.active) return;
    const k = e.key;
    if (k === KEYS_P1.up)    this.movePlayer(this.state.p1,  0, -1, 'up');
    else if (k === KEYS_P1.down)  this.movePlayer(this.state.p1,  0,  1, 'down');
    else if (k === KEYS_P1.left)  this.movePlayer(this.state.p1, -1,  0, 'left');
    else if (k === KEYS_P1.right) this.movePlayer(this.state.p1,  1,  0, 'right');
    else if (k === KEYS_P2.up)    this.movePlayer(this.state.p2,  0, -1, 'up');
    else if (k === KEYS_P2.down)  this.movePlayer(this.state.p2,  0,  1, 'down');
    else if (k === KEYS_P2.left)  this.movePlayer(this.state.p2, -1,  0, 'left');
    else if (k === KEYS_P2.right) this.movePlayer(this.state.p2,  1,  0, 'right');
    else if (k === KEYS_P1.undo) this.undoPlayer(this.state.p1);
    else if (k === KEYS_P2.undo) this.undoPlayer(this.state.p2);
    this.onUpdate?.();
  }

  private movePlayer(p: RacePlayer, dx: number, dy: number, _facing: string): void {
    if (p.won) return;
    const nx = p.player.x + dx, ny = p.player.y + dy;
    if (ny < 0 || ny >= p.grid.length || nx < 0 || nx >= p.grid[ny].length) return;
    const next = p.grid[ny][nx];
    if (next === TILE.WALL) return;

    p.history.push(p.grid.map(r => [...r]));
    if (next === TILE.BOX || next === TILE.BOX_ON_GOAL) {
      const bx = nx + dx, by = ny + dy;
      if (by < 0 || by >= p.grid.length || bx < 0 || bx >= p.grid[by].length) return;
      const beyond = p.grid[by][bx];
      if (beyond === TILE.WALL || beyond === TILE.BOX || beyond === TILE.BOX_ON_GOAL) { p.history.pop(); return; }
      p.grid[by][bx] = isGoal(p, bx, by) ? TILE.BOX_ON_GOAL : TILE.BOX;
      p.grid[ny][nx] = isGoal(p, nx, ny) ? TILE.GOAL : TILE.FLOOR;
      p.pushes++;
    }

    p.grid[p.player.y][p.player.x] = isGoal(p, p.player.x, p.player.y) ? TILE.GOAL : TILE.FLOOR;
    p.grid[ny][nx] = isGoal(p, nx, ny) ? TILE.PLAYER_ON_GOAL : TILE.PLAYER;
    p.player = { x: nx, y: ny };
    p.moves++;

    if (checkWon(p)) {
      p.won = true;
      p.timeMs = performance.now() - p.startMs;
      if (!this.state!.winner) {
        this.state!.winner = p.id;
        this.state!.active = false;
        this.onWin?.(p.id);
      }
    }
  }

  private undoPlayer(p: RacePlayer): void {
    if (p.history.length === 0 || p.won) return;
    const snap = p.history.pop()!;
    p.grid = snap;
    // 重新定位玩家
    for (let y = 0; y < snap.length; y++)
      for (let x = 0; x < snap[y].length; x++)
        if (snap[y][x] === 'player' || snap[y][x] === '+') p.player = { x, y };
    p.moves = Math.max(0, p.moves - 1);
  }

  stop(): void {
    if (this.state) this.state.active = false;
    if (this.keyHandler) document.removeEventListener('keydown', this.keyHandler);
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  renderPlayer(canvas: HTMLCanvasElement, p: RacePlayer): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rows = p.grid.length, cols = Math.max(...p.grid.map(r => r.length));
    const tw = canvas.width / cols, th = canvas.height / rows;
    const colors: Record<string, string> = {
      '#': '#5c4b73', ' ': '#3c3150', '.': '#ffd166',
      '$': '#c98f52', '@': p.id === 1 ? '#7ee081' : '#8be9fd',
      '*': '#efbb77', '+': p.id === 1 ? '#7ee081' : '#8be9fd',
    };
    ctx.fillStyle = '#17121f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const cell = (p.grid[y] || [])[x] || ' ';
        ctx.fillStyle = colors[cell] || '#3c3150';
        ctx.fillRect(x * tw + 0.5, y * th + 0.5, tw - 1, th - 1);
      }
    // HUD
    ctx.fillStyle = p.id === 1 ? '#7ee081' : '#8be9fd';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`${p.name}  ${p.moves}步  ${(p.timeMs/1000).toFixed(1)}s`, 6, 16);
    if (p.won) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('通关！', canvas.width/2, canvas.height/2);
      ctx.textAlign = 'left';
    }
  }
}
