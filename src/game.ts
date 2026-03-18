// game.ts - 游戏核心状态与逻辑（TypeScript 重构版）
// render/audio 已移除，改为触发 gameEvents 事件

import {
  TILE,
  type TileChar,
  type Pos,
  type Level,
  type LevelRecord,
  type StarMoves,
  type Rank,
  type Records,
  type Effects,
  type TimerState,
  type AIState,
  type ComboState,
  type GameState,
} from './types';
import { LEVELS } from './levels';
import { loadRecords, saveRecords } from './storage';

// --- 事件系统
export type GameEvent = 'update' | 'won' | 'levelLoaded' | 'moved' | 'pushed';
export const gameEvents = new EventTarget();
export function emit(event: GameEvent, detail?: unknown): void {
  gameEvents.dispatchEvent(new CustomEvent(event, { detail }));
}

// --- 内部变量
let undoUsed = 0;
// eslint-disable-next-line prefer-const
let undoLimit = -1;
let timerRafId: number | null = null;
let goalsSet = new Set<string>();

// --- 历史快照（增量差分，只存变化的格子，节省 ~90% 内存）
interface GridDiff {
  x: number;
  y: number;
  from: TileChar;
  to: TileChar;
}
interface HistorySnap {
  diffs: GridDiff[];
  player: Pos;
  prevPlayer: Pos;
  moves: number;
  pushes: number;
  won: boolean;
  facing: string;
  stepFrame: number;
}

// --- 扩展状态接口
interface ExtGameState extends Omit<GameState, 'history' | 'recording' | 'facing' | 'stats'> {
  records: Records;
  facing: string;
  recording: Array<{ dx: number; dy: number; facing: string; isPush: boolean; timestamp: number }>;
  history: HistorySnap[];
  combo: ComboState;
  levelSelectFocus: number;
  paused: boolean;
  pushOnlyMode: boolean;
  playback: "none" | "demo" | "replay";
  stats: {
    maxCombo: number;
    hintCount: number;
    themesUsed: Set<string>;
    maxLevel: number;
    taPlayed: boolean;
    replayPlayed: boolean;
    randomPlayed: boolean;
    // PlayerStats 兼容字段
    undoUsed: number;
    sessions: number;
    totalMoves: number;
    activityLog: number[];
  };
}
// --- 状态对象
export const state: ExtGameState = {
  levelIndex: 0,
  grid: [] as TileChar[][],
  player: { x: 0, y: 0 },
  goals: [] as Pos[],
  moves: 0,
  pushes: 0,
  history: [] as HistorySnap[],
  won: false,
  records: {} as Records,
  facing: "down",
  stepFrame: 0,
  uiScreen: "game",
  paused: false,
  pushOnlyMode: false,
  playback: "none",
  effects: {
    goalFlash: null,
    cratePulse: null,
    shake: false,
    prevPlayer: null,
    prevBoxes: null,
    deadlocks: null,
  } as Effects,
  timer: { running: false, startMs: 0, elapsedMs: 0 } as TimerState,
  playerMoved: false,
  recording: [],
  ai: {
    solving: false,
    demo: false,
    demoSteps: [],
    demoIndex: 0,
    demoIntervalId: null,
    hintArrow: null,
    hintBox: null,
    speed: 350,
  } as AIState,
  combo: { count: 0, lastPushMs: 0 },
  levelSelectFocus: 0,
  stats: {
    maxCombo: 0,
    hintCount: 0,
    themesUsed: new Set<string>(),
    maxLevel: 0,
    taPlayed: false,
    replayPlayed: false,
    randomPlayed: false,
    undoUsed: 0,
    sessions: 0,
    totalMoves: 0,
    activityLog: [],
  },
  heatmap: [] as number[][],
};
state.records = loadRecords();

// --- 关卡 / 记录辅助
export function getLevelConfig(index: number = state.levelIndex): Level {
  return LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))];
}

export function getRecord(index: number = state.levelIndex): LevelRecord | null {
  return state.records[index] ?? null;
}

export function getRank(moves: number, starMoves: StarMoves): Rank {
  if (moves <= starMoves.three) return "★★★";
  if (moves <= starMoves.two)   return "★★";
  if (moves <= starMoves.one)   return "★";
  return null;
}

export function formatBest(record: LevelRecord | null): string {
  if (!record) return "--";
  return record.bestMoves + " 步";
}

export function formatMs(ms: number): string {
  if (ms == null || ms < 0) return "--";
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  return m > 0 ? m + "分" + String(s % 60).padStart(2, "0") + "秒" : s + "秒";
}

export function updateRecord(
  result: { moves: number; timeMs: number; rank: Rank; challenge?: boolean; challengeCleared?: boolean }
): { record: LevelRecord; isNewBest: boolean } {
  const existing = getRecord();
  const shouldReplace = !existing || result.moves < existing.bestMoves;
  const bestMoves  = shouldReplace ? result.moves : existing!.bestMoves;
  const bestRank   = shouldReplace ? result.rank  : existing!.bestRank;
  const timeMs = result.timeMs != null ? result.timeMs : null;
  const shouldReplaceTime = timeMs !== null && (!existing || !existing.bestTimeMs || timeMs < existing.bestTimeMs);
  const bestTimeMs = shouldReplaceTime ? timeMs! : existing?.bestTimeMs ?? 0;
  const prevCompletedAt = existing?.completedAt;
  const newCompletedAt  = shouldReplace ? Date.now() : (prevCompletedAt ?? Date.now());
  state.records[state.levelIndex] = {
    bestMoves,
    bestTimeMs,
    bestRank,
    challengeCleared: result.challengeCleared ?? result.challenge ?? existing?.challengeCleared ?? false,
    completedAt: newCompletedAt,
  } as LevelRecord;
  saveRecords(state.records);
  return { record: state.records[state.levelIndex], isNewBest: shouldReplace };
}

// --- 模式控制：撤销限制 / 暂停 / 纯推 / 回放 ---------------------------------

export function getUndoLimit(): number { return undoLimit; }
export function getUndoUsed(): number { return undoUsed; }

export function setUndoLimit(limit: number): void {
  undoLimit = Number.isFinite(limit) ? Math.trunc(limit) : -1;
  undoUsed = 0;
  state.stats.undoUsed = 0;
  emit("update");
}

export function isPaused(): boolean { return state.paused; }

export function pauseGame(): void {
  if (state.paused) return;
  state.paused = true;
  stopTimer();
  emit("update");
}

export function resumeGame(): void {
  if (!state.paused) return;
  state.paused = false;
  if (state.moves > 0) startTimer();
  emit("update");
}

export function togglePause(): void {
  if (state.paused) resumeGame();
  else pauseGame();
}

export function isPushOnlyMode(): boolean { return state.pushOnlyMode; }

export function setPushOnlyMode(on: boolean): void {
  state.pushOnlyMode = !!on;
  emit("update");
}

export function togglePushOnlyMode(): boolean {
  setPushOnlyMode(!state.pushOnlyMode);
  return state.pushOnlyMode;
}

export function getPlaybackMode(): ExtGameState["playback"] { return state.playback; }
export function setPlaybackMode(mode: ExtGameState["playback"]): void { state.playback = mode; }

// --- 网格辅助
export function isGoal(x: number, y: number): boolean {
  return goalsSet.has(`${x},${y}`);
}

export function getCell(x: number, y: number): TileChar {
  if (y < 0 || y >= state.grid.length || x < 0 || x >= state.grid[y].length) return TILE.WALL;
  return state.grid[y][x] as TileChar;
}

export function cloneGrid(grid: TileChar[][]): TileChar[][] {
  return grid.map(row => [...row]);
}

export function restoreFloorOrGoal(x: number, y: number): void {
  state.grid[y][x] = isGoal(x, y) ? TILE.GOAL : TILE.FLOOR;
}

export function placeBox(x: number, y: number): void {
  state.grid[y][x] = isGoal(x, y) ? TILE.BOX_ON_GOAL : TILE.BOX;
}

export function placePlayer(x: number, y: number): void {
  state.grid[y][x] = isGoal(x, y) ? TILE.PLAYER_ON_GOAL : TILE.PLAYER;
  state.player = { x, y };
}

// --- loadLevel
export function loadLevel(index: number): void {
  const level = LEVELS[index];
  if (!level) return;
  state.levelIndex = index;
  state.grid = level.map.map(row => [...row] as TileChar[]);
  state.goals = [];
  state.moves = 0; state.pushes = 0;
  state.history = []; state.won = false;
  state.facing = "down"; state.stepFrame = 0;
  state.paused = false;
  state.effects = { goalFlash: null, cratePulse: null, shake: false, prevPlayer: null, prevBoxes: null, deadlocks: null };
  state.playerMoved = false;
  state.combo.count = 0; state.combo.lastPushMs = 0;
  state.recording = [];
  state.heatmap = [];  // 重置热力图
  undoUsed = 0;
  state.stats.undoUsed = 0;
  // 重置 AI 状态
  state.ai.hintArrow = null;
  state.ai.hintBox = null;
  state.ai.demo = false;
  state.ai.demoIndex = 0;
  state.ai.demoSteps = [];
  resetTimer();
  for (let y = 0; y < state.grid.length; y++) {
    for (let x = 0; x < state.grid[y].length; x++) {
      const cell = state.grid[y][x];
      if (cell === TILE.GOAL || cell === TILE.BOX_ON_GOAL || cell === TILE.PLAYER_ON_GOAL) {
        state.goals.push({ x, y });
      }
      if (cell === TILE.PLAYER || cell === TILE.PLAYER_ON_GOAL) {
        state.player = { x, y };
      }
    }
  }
  goalsSet = new Set<string>(state.goals.map(g => `${g.x},${g.y}`));
  emit("levelLoaded", { index });
}

// --- 历史 / undo / restart
// diffs: 本步将要改变的格子 [{x,y,from,to}, ...]，由调用方传入
const MAX_HISTORY = 1000; // 最多保留1000步历史，防止内存无限增长

export function saveHistory(diffs: Array<{x:number;y:number;from:TileChar;to:TileChar}>): void {
  if (state.history.length >= MAX_HISTORY) state.history.shift(); // 超限时丢弃最早的步骤
  state.history.push({
    diffs,
    player: { ...state.player },
    prevPlayer: { ...state.player },
    moves: state.moves,
    pushes: state.pushes,
    won: state.won,
    facing: state.facing,
    stepFrame: state.stepFrame,
  });
}

export function undo(): boolean {
  if (state.history.length === 0) return false;
  if (undoLimit >= 0 && undoUsed >= undoLimit) return false;
  const snap = state.history.pop()!;
  // 反向应用 diffs 恢复 grid
  for (const d of snap.diffs) {
    (state.grid as unknown as TileChar[][])[d.y][d.x] = d.from;
  }
  state.player = snap.player;
  state.moves = snap.moves;
  state.pushes = snap.pushes;
  state.won = snap.won;
  state.facing = snap.facing;
  state.stepFrame = snap.stepFrame;
  state.effects = { goalFlash: null, cratePulse: null, shake: false, prevPlayer: null, prevBoxes: null, deadlocks: null };
  state.playerMoved = false;
  undoUsed++;
  state.stats.undoUsed = undoUsed;
  emit("update");
  return true;
}

export function restartLevel(): void {
  loadLevel(state.levelIndex);
  emit("update");
}
// --- 死锁检测
export function isSimpleDeadlock(grid: TileChar[][], bx: number, by: number): boolean {
  if (isGoal(bx, by)) return false;
  const isWallOrBox = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || y >= grid.length || x >= (grid[y]?.length ?? 0)) return true;
    return grid[y][x] === TILE.WALL;
  };
  const hBlock = isWallOrBox(bx - 1, by) || isWallOrBox(bx + 1, by);
  const vBlock = isWallOrBox(bx, by - 1) || isWallOrBox(bx, by + 1);
  if (hBlock && vBlock) return true;
  if (isWallOrBox(bx - 1, by) || isWallOrBox(bx + 1, by)) {
    const row = grid[by] as string[];
    const wallL = row.lastIndexOf(TILE.WALL, bx - 1);
    const wallR = row.indexOf(TILE.WALL, bx + 1);
    const rowGoals = state.goals.filter(g =>
      g.y === by &&
      (wallL < 0 || g.x > wallL) &&
      (wallR < 0 || g.x < wallR)
    );
    if (rowGoals.length === 0) return true;
  }
  if (isWallOrBox(bx, by - 1) || isWallOrBox(bx, by + 1)) {
    const colGoals = state.goals.filter(g => g.x === bx);
    if (colGoals.length === 0) return true;
  }
  return false;
}

export function getDeadlockedBoxes(): Pos[] {
  const dead: Pos[] = [];
  for (let y = 0; y < state.grid.length; y++) {
    for (let x = 0; x < state.grid[y].length; x++) {
      const cell = state.grid[y][x];
      if (cell === TILE.BOX && isSimpleDeadlock(state.grid as unknown as TileChar[][], x, y)) {
        dead.push({ x, y });
      }
    }
  }
  return dead;
}

// --- combo
export function updateCombo(isPush: boolean): void {
  const now = performance.now();
  if (isPush) {
    const gap = now - state.combo.lastPushMs;
    if (state.combo.lastPushMs > 0 && gap < 2000) {
      state.combo.count++;
    } else {
      state.combo.count = 1;
    }
    state.combo.lastPushMs = now;
  } else {
    if (now - state.combo.lastPushMs > 2000) {
      state.combo.count = 0;
    }
  }
}

// --- checkWin (内部)
function checkWin(): boolean {
  return state.goals.every(g => {
    const cell = getCell(g.x, g.y);
    return cell === TILE.BOX_ON_GOAL || cell === TILE.PLAYER_ON_GOAL;
  });
}

// --- tryMove
export function tryMove(dx: number, dy: number, facing: string): void {
  if (state.won || state.paused) return;
  state.facing = facing;
  const nextX = state.player.x + dx;
  const nextY = state.player.y + dy;
  const nextCell = getCell(nextX, nextY);

  // 撞墙
  if (nextCell === TILE.WALL) {
    state.effects.shake = true;
    emit("update");
    return;
  }

  // 纯推模式：每步必须推箱子
  if (state.pushOnlyMode && nextCell !== TILE.BOX && nextCell !== TILE.BOX_ON_GOAL) {
    state.effects.shake = true;
    emit("update");
    return;
  }

  // 推箱子
  if (nextCell === TILE.BOX || nextCell === TILE.BOX_ON_GOAL) {
    const bx = nextX + dx;
    const by = nextY + dy;
    const beyondCell = getCell(bx, by);
    if (beyondCell === TILE.WALL || beyondCell === TILE.BOX || beyondCell === TILE.BOX_ON_GOAL) {
      state.effects.shake = true;
      emit("update");
      return;
    }
    saveHistory([
      { x: state.player.x, y: state.player.y, from: getCell(state.player.x, state.player.y), to: isGoal(state.player.x, state.player.y) ? TILE.GOAL : TILE.FLOOR },
      { x: nextX, y: nextY, from: nextCell, to: isGoal(nextX, nextY) ? TILE.PLAYER_ON_GOAL : TILE.PLAYER },
      { x: bx, y: by, from: getCell(bx, by), to: isGoal(bx, by) ? TILE.BOX_ON_GOAL : TILE.BOX },
    ]);
    state.effects.prevPlayer = { x: state.player.x, y: state.player.y };
    state.effects.prevBoxes = [{ from: { x: nextX, y: nextY }, to: { x: bx, y: by } }];
    restoreFloorOrGoal(state.player.x, state.player.y);
    placeBox(bx, by);
    placePlayer(nextX, nextY);
    state.moves += 1; state.pushes += 1;
    state.stepFrame = state.stepFrame === 0 ? 1 : 0;
    state.playerMoved = true;
    state.effects.cratePulse = { x: bx, y: by };
    if (isGoal(bx, by)) { state.effects.goalFlash = { x: bx, y: by }; }
    if (state.moves === 1) startTimer();
    if (state.playback === "none") {
      state.recording.push({
        dx, dy, facing,
        isPush: true,
        timestamp: Math.round(getElapsedTimeMs()),
      });
    }
    updateCombo(true);
    state.effects.deadlocks = getDeadlockedBoxes();
    emit("pushed", { from: { x: nextX, y: nextY }, to: { x: bx, y: by } });
    if (checkWin()) {
      stopTimer();
      state.won = true;
      const level = getLevelConfig();
      const rank = getRank(state.moves, level.starMoves);
      const challengeCleared = state.moves <= level.parMoves;
      const playback = state.playback !== "none";
      if (!playback) {
        updateRecord({ moves: state.moves, rank, challengeCleared, timeMs: state.timer.elapsedMs });
      }
      emit("won", { moves: state.moves, pushes: state.pushes, rank, challengeCleared, playback, mode: state.playback });
    }
    emit("update");
    return;
  }

  // 普通移动
  saveHistory([
    { x: state.player.x, y: state.player.y, from: getCell(state.player.x, state.player.y), to: isGoal(state.player.x, state.player.y) ? TILE.GOAL : TILE.FLOOR },
    { x: nextX, y: nextY, from: getCell(nextX, nextY), to: isGoal(nextX, nextY) ? TILE.PLAYER_ON_GOAL : TILE.PLAYER },
  ]);
  state.effects.prevPlayer = { x: state.player.x, y: state.player.y };
  state.effects.prevBoxes = null;
  restoreFloorOrGoal(state.player.x, state.player.y);
  placePlayer(nextX, nextY);
  state.moves += 1;
  state.stepFrame = state.stepFrame === 0 ? 1 : 0;
  state.playerMoved = true;
  if (state.moves === 1) startTimer();
  if (state.playback === "none") {
    state.recording.push({
      dx, dy, facing,
      isPush: false,
      timestamp: Math.round(getElapsedTimeMs()),
    });
  }
  updateCombo(false);
  // 更新热力图（玩家到达位置 +1）
  if (!state.heatmap[nextY]) state.heatmap[nextY] = [];
  state.heatmap[nextY][nextX] = (state.heatmap[nextY][nextX] ?? 0) + 1;
  emit("moved", { x: nextX, y: nextY });
  emit("update");
}
// --- 计时器
export function getElapsedTimeMs(): number {
  if (!state.timer.running) return state.timer.elapsedMs;
  return Math.max(0, performance.now() - state.timer.startMs);
}

export function startTimer(): void {
  if (state.timer.running) return;
  state.timer.running = true;
  state.timer.startMs = performance.now() - state.timer.elapsedMs;
  const tick = () => {
    state.timer.elapsedMs = getElapsedTimeMs();
    if (state.timer.running) timerRafId = requestAnimationFrame(tick);
  };
  cancelAnimationFrame(timerRafId!);
  timerRafId = requestAnimationFrame(tick);
}

export function stopTimer(): void {
  if (!state.timer.running) return;
  state.timer.elapsedMs = getElapsedTimeMs();
  state.timer.running = false;
  if (timerRafId !== null) { cancelAnimationFrame(timerRafId); timerRafId = null; }
}

export function resetTimer(): void {
  stopTimer();
  state.timer.elapsedMs = 0;
  state.timer.startMs = 0;
}
