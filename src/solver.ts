import type { Pos } from './types';
import { TILE } from './types';

// ─── 类型定义 ──────────────────────────────────────────────────────────────────

export interface SolverResult {
  steps: Array<{ dx: number; dy: number; facing: string }>;
}

interface BfsNode {
  px: number;
  py: number;
  boxes: Array<[number, number]>;
  path: Array<{ dx: number; dy: number; facing: string }>;
}

const DIRS: Array<{ dx: number; dy: number; facing: string }> = [
  { dx:  0, dy: -1, facing: 'up' },
  { dx:  0, dy:  1, facing: 'down' },
  { dx: -1, dy:  0, facing: 'left' },
  { dx:  1, dy:  0, facing: 'right' },
];

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
  // 已在目标格，不算死锁
  if (goals.some(g => g.x === bx && g.y === by)) return false;

  const rows = grid.length;
  const cols = (grid[0] ?? []).length;

  const isWall = (x: number, y: number): boolean => {
    if (y < 0 || y >= rows || x < 0 || x >= (grid[y]?.length ?? cols)) return true;
    return grid[y][x] === TILE.WALL;
  };

  // 四个角方向对：(水平方向是否封死, 垂直方向是否封死)
  const horizontalBlocked = isWall(bx - 1, by) || isWall(bx + 1, by);
  const verticalBlocked   = isWall(bx, by - 1) || isWall(bx, by + 1);

  if (horizontalBlocked && verticalBlocked) return true;

  // 精确角落检测：检查四个角
  const corners: Array<[number, number, number, number]> = [
    [-1, 0, 0, -1], // 左上角
    [ 1, 0, 0, -1], // 右上角
    [-1, 0, 0,  1], // 左下角
    [ 1, 0, 0,  1], // 右下角
  ];

  for (const [hdx, _hdy, _vdx, vdy] of corners) {
    if (isWall(bx + hdx, by) && isWall(bx, by + vdy)) return true;
  }

  return false;
}

// ─── BFS 核心求解 ──────────────────────────────────────────────────────────────

/**
 * 使用 BFS 搜索推箱子最短步骤路径。
 * @param grid      当前关卡网格（string[][]）
 * @param playerPos 玩家初始坐标
 * @param goals     所有目标格坐标
 * @param maxNodes  最大访问节点数，超出返回 null（默认 800000）
 * @returns         SolverResult（步骤列表）或 null（无解/超限）
 */
export function aiBfsSolve(
  grid: string[][],
  playerPos: Pos,
  goals: Pos[],
  maxNodes = 800_000
): SolverResult | null {
  // 收集初始箱子位置
  const initBoxes: Array<[number, number]> = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < (grid[y]?.length ?? 0); x++) {
      const c = grid[y][x];
      if (c === TILE.BOX || c === TILE.BOX_ON_GOAL) {
        initBoxes.push([x, y]);
      }
    }
  }

  // 目标集合（排序后的字符串，用于胜利判断）
  const goalSet: string[] = goals.map(g => `${g.x},${g.y}`).sort();

  // 状态编码：「玩家坐标 | 箱子坐标列表（排序）」
  const encode = (
    px: number,
    py: number,
    boxes: Array<[number, number]>
  ): string =>
    `${px},${py}|${boxes.map(b => `${b[0]},${b[1]}`).sort().join(';')}`;

  const startNode: BfsNode = {
    px: playerPos.x,
    py: playerPos.y,
    boxes: initBoxes,
    path: [],
  };

  const visited = new Set<string>([encode(startNode.px, startNode.py, startNode.boxes)]);
  const queue: BfsNode[] = [startNode];

  while (queue.length > 0) {
    if (visited.size > maxNodes) return null;

    const cur = queue.shift()!;
    const { px, py, boxes, path } = cur;

    // 胜利判断
    const bk = boxes.map(b => `${b[0]},${b[1]}`).sort();
    if (JSON.stringify(bk) === JSON.stringify(goalSet)) {
      return { steps: path };
    }

    // 箱子集合（快速碰撞查询）
    const bs = new Set<string>(boxes.map(b => `${b[0]},${b[1]}`));

    for (const { dx, dy, facing } of DIRS) {
      const nx = px + dx;
      const ny = py + dy;

      // 边界 & 墙壁检查
      if (
        ny < 0 || ny >= grid.length ||
        nx < 0 || nx >= (grid[ny]?.length ?? 0) ||
        grid[ny][nx] === TILE.WALL
      ) continue;

      // 复制箱子数组
      const nb: Array<[number, number]> = boxes.map(b => [b[0], b[1]]);
      const bKey = `${nx},${ny}`;

      if (bs.has(bKey)) {
        // 玩家推箱子：计算箱子新位置
        const bnx = nx + dx;
        const bny = ny + dy;

        if (
          bny < 0 || bny >= grid.length ||
          bnx < 0 || bnx >= (grid[bny]?.length ?? 0) ||
          grid[bny][bnx] === TILE.WALL ||
          bs.has(`${bnx},${bny}`)
        ) continue;

        // 死锁剪枝
        if (isDeadlock(grid, bnx, bny, goals)) continue;

        const bi = nb.findIndex(b => b[0] === nx && b[1] === ny);
        if (bi >= 0) nb[bi] = [bnx, bny];
      }

      const ns = encode(nx, ny, nb);
      if (!visited.has(ns)) {
        visited.add(ns);
        queue.push({
          px: nx,
          py: ny,
          boxes: nb,
          path: [...path, { dx, dy, facing }],
        });
      }
    }
  }

  return null;
}

// ─── 异步包装（避免阻塞主线程） ────────────────────────────────────────────────

/**
 * 将 BFS 分批执行，每批处理后让出控制权（setTimeout 0），
 * 避免长时间占用主线程导致 UI 卡顿。
 *
 * @param grid      关卡网格
 * @param playerPos 玩家初始坐标
 * @param goals     目标格列表
 * @param maxNodes  最大节点数限制（默认 800000）
 */
export function solveAsync(
  grid: string[][],
  playerPos: Pos,
  goals: Pos[],
  maxNodes = 800_000
): Promise<SolverResult | null> {
  return new Promise<SolverResult | null>(resolve => {
    // 收集初始箱子
    const initBoxes: Array<[number, number]> = [];
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < (grid[y]?.length ?? 0); x++) {
        const c = grid[y][x];
        if (c === TILE.BOX || c === TILE.BOX_ON_GOAL) initBoxes.push([x, y]);
      }
    }

    const goalSet: string[] = goals.map(g => `${g.x},${g.y}`).sort();

    const encode = (
      px: number,
      py: number,
      boxes: Array<[number, number]>
    ): string =>
      `${px},${py}|${boxes.map(b => `${b[0]},${b[1]}`).sort().join(';')}`;

    const startNode: BfsNode = {
      px: playerPos.x,
      py: playerPos.y,
      boxes: initBoxes,
      path: [],
    };

    const visited = new Set<string>([encode(startNode.px, startNode.py, startNode.boxes)]);
    const queue: BfsNode[] = [startNode];

    /** 每批最多处理的节点数，控制单次同步执行时长 */
    const BATCH_SIZE = 2000;

    function processBatch(): void {
      let processed = 0;

      while (queue.length > 0 && processed < BATCH_SIZE) {
        if (visited.size > maxNodes) {
          resolve(null);
          return;
        }

        const cur = queue.shift()!;
        const { px, py, boxes, path } = cur;
        processed++;

        // 胜利判断
        const bk = boxes.map(b => `${b[0]},${b[1]}`).sort();
        if (JSON.stringify(bk) === JSON.stringify(goalSet)) {
          resolve({ steps: path });
          return;
        }

        const bs = new Set<string>(boxes.map(b => `${b[0]},${b[1]}`));

        for (const { dx, dy, facing } of DIRS) {
          const nx = px + dx;
          const ny = py + dy;

          if (
            ny < 0 || ny >= grid.length ||
            nx < 0 || nx >= (grid[ny]?.length ?? 0) ||
            grid[ny][nx] === TILE.WALL
          ) continue;

          const nb: Array<[number, number]> = boxes.map(b => [b[0], b[1]]);
          const bKey = `${nx},${ny}`;

          if (bs.has(bKey)) {
            const bnx = nx + dx;
            const bny = ny + dy;

            if (
              bny < 0 || bny >= grid.length ||
              bnx < 0 || bnx >= (grid[bny]?.length ?? 0) ||
              grid[bny][bnx] === TILE.WALL ||
              bs.has(`${bnx},${bny}`)
            ) continue;

            if (isDeadlock(grid, bnx, bny, goals)) continue;

            const bi = nb.findIndex(b => b[0] === nx && b[1] === ny);
            if (bi >= 0) nb[bi] = [bnx, bny];
          }

          const ns = encode(nx, ny, nb);
          if (!visited.has(ns)) {
            visited.add(ns);
            queue.push({
              px: nx,
              py: ny,
              boxes: nb,
              path: [...path, { dx, dy, facing }],
            });
          }
        }
      }

      if (queue.length === 0) {
        // 队列耗尽，无解
        resolve(null);
      } else {
        // 让出主线程后继续处理下一批
        setTimeout(processBatch, 0);
      }
    }

    // 启动第一批（同样通过 setTimeout 让出，保证调用方先返回 Promise）
    setTimeout(processBatch, 0);
  });
}
