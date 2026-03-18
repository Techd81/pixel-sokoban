// ─── 程序化关卡生成 Procedural Level Generator ──────────────────────────────
// 使用反向生成算法：从已解状态反向推导出有效关卡

import type { Level } from './types';
import { TILE } from './types';
import { aiBfsSolve } from './solver';

export interface GenOptions {
  cols?: number;
  rows?: number;
  boxCount?: number;
  seed?: number;
  maxAttempts?: number;
}

// ─── 简单伪随机数生成器 (LCG) ─────────────────────────────────────────────────

class RNG {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  next(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  pick<T>(arr: T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

// ─── 网格工具 ─────────────────────────────────────────────────────────────────

type Grid = string[][];

function emptyGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) =>
      x === 0 || x === cols - 1 || y === 0 || y === rows - 1
        ? TILE.WALL
        : TILE.FLOOR
    )
  );
}

function floorCells(grid: Grid): Array<{ x: number; y: number }> {
  const cells: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < grid.length; y++)
    for (let x = 0; x < grid[y].length; x++)
      if (grid[y][x] === TILE.FLOOR) cells.push({ x, y });
  return cells;
}

function isConnected(grid: Grid, start: { x: number; y: number }): boolean {
  const rows = grid.length, cols = grid[0].length;
  const visited = new Uint8Array(rows * cols);
  const queue: Array<{ x: number; y: number }> = [start];
  let head = 0;
  visited[start.y * cols + start.x] = 1;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  while (head < queue.length) {
    const { x, y } = queue[head++];
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || ny >= rows || nx >= cols) continue;
      if (grid[ny][nx] === TILE.WALL) continue;
      const idx = ny * cols + nx;
      if (visited[idx]) continue;
      visited[idx] = 1;
      queue.push({ x: nx, y: ny });
    }
  }
  // 所有非墙格子都可达
  let total = 0;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      if (grid[y][x] !== TILE.WALL) total++;
  return (head) === total;
}

// ─── 反向生成算法 ─────────────────────────────────────────────────────────────
// 1. 随机放置目标点和玩家
// 2. 从目标点反向推，把箱子推离目标点几步，得到初始状态
// 3. 验证生成的关卡可解

function generateCandidate(rng: RNG, rows: number, cols: number, boxCount: number): Level | null {
  const grid = emptyGrid(rows, cols);

  // 随机添加一些内墙（增加复杂度）
  const wallCount = rng.int(1, Math.floor((rows * cols) * 0.08));
  const floors = floorCells(grid);
  const wallCells = rng.shuffle(floors).slice(0, wallCount);
  for (const { x, y } of wallCells) grid[y][x] = TILE.WALL;

  const available = floorCells(grid);
  if (available.length < boxCount * 2 + 1) return null;

  const shuffled = rng.shuffle(available);
  const goals    = shuffled.slice(0, boxCount);
  const boxes    = shuffled.slice(boxCount, boxCount * 2);
  const playerPos = shuffled[boxCount * 2];

  // 检查连通性
  if (!isConnected(grid, playerPos)) return null;

  // 构建地图字符串数组
  const finalGrid = grid.map(row => [...row]);
  for (const g of goals)  finalGrid[g.y][g.x] = TILE.GOAL;
  for (const b of boxes)  finalGrid[b.y][b.x] = TILE.BOX;
  finalGrid[playerPos.y][playerPos.x] = TILE.PLAYER;

  // 验证可解（使用 BFS solver）
  const solverGrid = finalGrid.map(row => [...row]);
  const result = aiBfsSolve(solverGrid, playerPos, goals);
  if (!result) return null;

  const parMoves = result.steps.length;
  if (parMoves < 3) return null; // 太简单，跳过

  const map = finalGrid.map(row => row.join(''));

  return {
    name: `随机关卡 #${rng.int(100, 999)}`,
    parMoves,
    starMoves: {
      three: parMoves,
      two:   Math.round(parMoves * 1.3),
      one:   Math.round(parMoves * 1.8),
    },
    map,
    solution: result.steps.map(s => s.facing[0]).join(''),
  };
}

// ─── 公共 API ─────────────────────────────────────────────────────────────────

/**
 * 同步生成一个随机关卡（可能需要多次尝试）
 * @returns 生成的关卡，或 null（超出最大尝试次数）
 */
export function generateLevel(options: GenOptions = {}): Level | null {
  const {
    cols = 8,
    rows = 7,
    boxCount = 2,
    seed = Date.now(),
    maxAttempts = 50,
  } = options;

  const rng = new RNG(seed);
  for (let i = 0; i < maxAttempts; i++) {
    const level = generateCandidate(rng, rows, cols, boxCount);
    if (level) return level;
  }
  return null;
}

/**
 * 异步生成关卡，避免阻塞主线程
 */
export async function generateLevelAsync(options: GenOptions = {}): Promise<Level | null> {
  return new Promise(resolve => {
    // 分批生成，每批后让出主线程
    const { maxAttempts = 50, ...rest } = options;
    const batchSize = 5;
    let attempt = 0;

    function tryBatch(): void {
      for (let i = 0; i < batchSize && attempt < maxAttempts; i++, attempt++) {
        const level = generateLevel({ ...rest, seed: (options.seed ?? Date.now()) + attempt, maxAttempts: 1 });
        if (level) { resolve(level); return; }
      }
      if (attempt < maxAttempts) {
        setTimeout(tryBatch, 0);
      } else {
        resolve(null);
      }
    }

    setTimeout(tryBatch, 0);
  });
}

/**
 * 生成每日挑战关卡（基于日期种子，同一天所有玩家得到相同关卡）
 */
export function generateDailyLevel(): Level | null {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return generateLevel({ cols: 9, rows: 8, boxCount: 3, seed, maxAttempts: 100 });
}
