// ─── 核心类型定义 ─────────────────────────────────────────────────────────────

export const TILE = {
  WALL: '#',
  FLOOR: ' ',
  GOAL: '.',
  BOX: '$',
  PLAYER: '@',
  BOX_ON_GOAL: '*',
  PLAYER_ON_GOAL: '+',
} as const;

export type TileChar = typeof TILE[keyof typeof TILE];

export interface Pos { x: number; y: number; }

export interface StarMoves { three: number; two: number; one: number; }

export interface Level {
  name: string;
  parMoves: number;
  starMoves: StarMoves;
  map: string[];
  solution?: string; // BFS 求解缓存
}

export type Rank = '★★★' | '★★' | '★' | null;

export interface LevelRecord {
  bestMoves: number;
  bestTimeMs: number;
  bestRank: Rank;
  challengeCleared: boolean;
  completedAt?: number;
}

export type Records = Record<number, LevelRecord>;

export interface Effects {
  goalFlash: Pos | null;
  cratePulse: Pos | null;
  shake: boolean;
  prevPlayer: Pos | null;
  prevBoxes: Array<{ from: Pos; to: Pos }> | null;
  deadlocks: Pos[] | null;
}

export interface TimerState {
  running: boolean;
  startMs: number;
  elapsedMs: number;
}

export interface AIState {
  solving: boolean;
  demo: boolean;
  demoSteps: string[];
  demoIndex: number;
  demoIntervalId: ReturnType<typeof setInterval> | null;
  hintArrow: string | null;
  hintBox: Pos | null;
  speed: number;
}

export interface ComboState {
  count: number;
  lastPushMs: number;
}

export interface PlayerStats {
  taPlayed: boolean;
  undoUsed: number;
  maxLevel: number;
  sessions: number;
  totalMoves: number;
  activityLog: Record<string, number>; // date -> moves
}

export interface GameState {
  levelIndex: number;
  grid: string[][];
  player: Pos;
  goals: Pos[];
  moves: number;
  pushes: number;
  history: string[][][];
  won: boolean;
  records: Records;
  facing: 'up' | 'down' | 'left' | 'right';
  stepFrame: number;
  uiScreen: 'game' | 'levelSelect' | 'stats' | 'editor';
  effects: Effects;
  timer: TimerState;
  playerMoved: boolean;
  recording: string[];
  ai: AIState;
  combo: ComboState;
  stats: PlayerStats;
  levelSelectFocus: number;
  heatmap: number[][];
}

export interface TimeAttackState {
  active: boolean;
  totalMs: number;
  startMs: number;
  cleared: number;
  totalMoves: number;
  score: number;
  rafId: number | null;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  check: (state: GameState, records: Records) => boolean;
}

export interface EditorState {
  grid: string[][];
  rows: number;
  cols: number;
  tool: TileChar;
  history: string[][][];
  historyIndex: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';
export const DIR_DELTA: Record<Direction, Pos> = {
  up:    { x:  0, y: -1 },
  down:  { x:  0, y:  1 },
  left:  { x: -1, y:  0 },
  right: { x:  1, y:  0 },
};
