import type { Pos } from './types';
import { TILE } from './types';

// ─── 类型定义 ──────────────────────────────────────────────────────────────────

export interface SolverResult {
  steps: Array<{ dx: number; dy: number; facing: string }>;
}

// 父指针节点（不再在每个节点复制 path 数组）
interface BfsNode {
  px: number;
  py: number;
  boxes: Array<[number, number]>;
  parent: BfsNode | null;
  move: { dx: number; dy: number; facing: string } | null;
}

const DIRS: Array<{ dx: number; dy: number; facing: string }> = [
  { dx:  0, dy: -1, facing: 'up' },
  { dx:  0, dy:  1, facing: 'down' },
  { dx: -1, dy:  0, facing: 'left' },
  { dx:  1, dy:  0, facing: 'right' },
];

// ─── 状态编码（数值化，避免每次 sort 字符串） ────────────────────────────────────

/**
 * 将玩家坐标和箱子坐标编码为字符串 key。
 * 箱子坐标先转为线性索引再排序，避免创建临时字符串数组。
 */
function encodeState(
  px: number,
  py: number,
  boxes: Array<[number, number]>,
  cols: number
): string {
  const keys = boxes.map(([bx, by]) => by * cols + bx);
  keys.sort((a, b) => a - b);
  return `${py * cols + px}|${keys.join(',')}`;
}

// ─── 死锁检测 ──────────────────────────────────────────────────────────────────

/**
 * 简单角落死锁检测：若箱子位于非目标角落（两个相邻方向均被墙封死），则视为死锁。
 */
export function isDeadlock(
  grid: string[][],
  bx: number,
  by: number,
  goals: Pos[]
): boolean {
  if (goals.some(g => g.x === bx && g.y === by)) return false;

  const rows = grid.length;
  const cols = (grid[0] ?? []).length;

  const isWall = (x: number, y: number): boolean => {
    if (y < 0 || y >= rows || x < 0 || x >= (grid[y]?.length ?? cols)) return true;
    return grid[y][x] === TILE.WALL;
  };

  const horizontalBlocked = isWall(bx - 1, by) || isWall(bx + 1, by);
  const verticalBlocked   = isWall(bx, by - 1) || isWall(bx, by + 1);

  if (horizontalBlocked && verticalBlocked) return true;

  const corners: Array<[number, number, number, number]> = [
    [-1, 0, 0, -1],
    [ 1, 0, 0, -1],
    [-1, 0, 0,  1],
    [ 1, 0, 0,  1],
  ];

  for (const [hdx, _hdy, _vdx, vdy] of corners) {
    if (isWall(bx + hdx, by) && isWall(bx, by + vdy)) return true;
  }

  return false;
}

// ─── 路径回溯 ─────────────────────────────────────────────────────────────────

function reconstructPath(
  node: BfsNode
): Array<{ dx: number; dy: number; facing: string }> {
  const steps: Array<{ dx: number; dy: number; facing: string }> = [];
  let cur: BfsNode | null = node;
  while (cur?.move) {
    steps.push(cur.move);
    cur = cur.parent;
  }
  steps.reverse();
  return steps;
}

// ─── BFS 核心求解 ──────────────────────────────────────────────────────────────

/**
 * 使用 BFS 搜索推箱子最短步骤路径。
 * 优化：父指针回溯路径、数值化状态编码、指针式队列（无 shift）。
 */
export function aiBfsSolve(
  grid: string[][],
  playerPos: Pos,
  goals: Pos[],
  maxNodes = 800_000
): SolverResult | null {
  const cols = grid[0]?.length ?? 0;

  const initBoxes: Array<[number, number]> = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < (grid[y]?.length ?? 0); x++) {
      const c = grid[y][x];
      if (c === TILE.BOX || c === TILE.BOX_ON_GOAL) initBoxes.push([x, y]);
    }
  }

  // 目标集合：用线性索引 Set 快速查找
  const goalLinear = new Set<number>(goals.map(g => g.y * cols + g.x));

  const startNode: BfsNode = {
    px: playerPos.x,
    py: playerPos.y,
    boxes: initBoxes,
    parent: null,
    move: null,
  };

  const visited = new Set<string>([encodeState(startNode.px, startNode.py, startNode.boxes, cols)]);
  // 指针式队列：head 指针推进，避免 shift() O(n)
  const queue: BfsNode[] = [startNode];
  let head = 0;

  while (head < queue.length) {
    if (visited.size > maxNodes) return null;

    const cur = queue[head++];
    const { px, py, boxes } = cur;

    // 胜利判断：所有箱子线性索引均在目标集合中
    if (boxes.every(([bx, by]) => goalLinear.has(by * cols + bx))) {
      return { steps: reconstructPath(cur) };
    }

    // 箱子集合（线性索引，O(1) 查询）
    const boxSet = new Set<number>(boxes.map(([bx, by]) => by * cols + bx));

    for (const dir of DIRS) {
      const { dx, dy, facing } = dir;
      const nx = px + dx;
      const ny = py + dy;

      if (
        ny < 0 || ny >= grid.length ||
        nx < 0 || nx >= (grid[ny]?.length ?? 0) ||
        grid[ny][nx] === TILE.WALL
      ) continue;

      const nLinear = ny * cols + nx;
      let nb = boxes;
      let pushed = false;

      if (boxSet.has(nLinear)) {
        const bnx = nx + dx;
        const bny = ny + dy;

        if (
          bny < 0 || bny >= grid.length ||
          bnx < 0 || bnx >= (grid[bny]?.length ?? 0) ||
          grid[bny][bnx] === TILE.WALL ||
          boxSet.has(bny * cols + bnx)
        ) continue;

        if (isDeadlock(grid, bnx, bny, goals)) continue;

        // 只在实际推箱时复制数组
        nb = boxes.map(b => [b[0], b[1]] as [number, number]);
        const bi = nb.findIndex(b => b[0] === nx && b[1] === ny);
        if (bi >= 0) nb[bi] = [bnx, bny];
        pushed = true;
      }

      const ns = encodeState(nx, ny, nb, cols);
      if (!visited.has(ns)) {
        visited.add(ns);
        queue.push({
          px: nx,
          py: ny,
          boxes: nb,
          parent: cur,
          move: { dx, dy, facing },
        });
      }

      // 未推箱时 nb 仍为原引用，不需要置 pushed
      void pushed;
    }
  }

  return null;
}

// ─── 异步包装（避免阻塞主线程） ────────────────────────────────────────────────

/**
 * 将 BFS 分批执行，每批处理后让出控制权（setTimeout 0），
 * 避免长时间占用主线程导致 UI 卡顿。
 */
export function solveAsync(
  grid: string[][],
  playerPos: Pos,
  goals: Pos[],
  maxNodes = 800_000
): Promise<SolverResult | null> {
  return new Promise<SolverResult | null>(resolve => {
    const cols = grid[0]?.length ?? 0;

    const initBoxes: Array<[number, number]> = [];
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < (grid[y]?.length ?? 0); x++) {
        const c = grid[y][x];
        if (c === TILE.BOX || c === TILE.BOX_ON_GOAL) initBoxes.push([x, y]);
      }
    }

    const goalLinear = new Set<number>(goals.map(g => g.y * cols + g.x));

    const startNode: BfsNode = {
      px: playerPos.x,
      py: playerPos.y,
      boxes: initBoxes,
      parent: null,
      move: null,
    };

    const visited = new Set<string>([encodeState(startNode.px, startNode.py, startNode.boxes, cols)]);
    const queue: BfsNode[] = [startNode];
    let head = 0;

    const BATCH_SIZE = 2000;

    function processBatch(): void {
      let processed = 0;

      while (head < queue.length && processed < BATCH_SIZE) {
        if (visited.size > maxNodes) {
          resolve(null);
          return;
        }

        const cur = queue[head++];
        const { px, py, boxes } = cur;
        processed++;

        if (boxes.every(([bx, by]) => goalLinear.has(by * cols + bx))) {
          resolve({ steps: reconstructPath(cur) });
          return;
        }

        const boxSet = new Set<number>(boxes.map(([bx, by]) => by * cols + bx));

        for (const dir of DIRS) {
          const { dx, dy, facing } = dir;
          const nx = px + dx;
          const ny = py + dy;

          if (
            ny < 0 || ny >= grid.length ||
            nx < 0 || nx >= (grid[ny]?.length ?? 0) ||
            grid[ny][nx] === TILE.WALL
          ) continue;

          const nLinear = ny * cols + nx;
          let nb = boxes;

          if (boxSet.has(nLinear)) {
            const bnx = nx + dx;
            const bny = ny + dy;

            if (
              bny < 0 || bny >= grid.length ||
              bnx < 0 || bnx >= (grid[bny]?.length ?? 0) ||
              grid[bny][bnx] === TILE.WALL ||
              boxSet.has(bny * cols + bnx)
            ) continue;

            if (isDeadlock(grid, bnx, bny, goals)) continue;

            nb = boxes.map(b => [b[0], b[1]] as [number, number]);
            const bi = nb.findIndex(b => b[0] === nx && b[1] === ny);
            if (bi >= 0) nb[bi] = [bnx, bny];
          }

          const ns = encodeState(nx, ny, nb, cols);
          if (!visited.has(ns)) {
            visited.add(ns);
            queue.push({
              px: nx,
              py: ny,
              boxes: nb,
              parent: cur,
              move: { dx, dy, facing },
            });
          }
        }
      }

      if (head < queue.length) {
        setTimeout(processBatch, 0);
      } else {
        resolve(null);
      }
    }

    processBatch();
  });
}
