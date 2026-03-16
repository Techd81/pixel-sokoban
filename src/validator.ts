// ─── 关卡验证器 Level Validator ──────────────────────────────────────────────
// 验证关卡合法性：箱子/目标数匹配、可达性、无死锁初始状态
import type { Level } from './types';
import { TILE } from './types';
import { aiBfsSolve } from './solver';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    boxCount: number;
    goalCount: number;
    playerCount: number;
    floorArea: number;
    mapSize: string;
  };
}

export function validateLevel(level: Level): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const map = level.map;

  if (!map || map.length === 0) {
    return { valid: false, errors: ['地图为空'], warnings: [], stats: { boxCount:0, goalCount:0, playerCount:0, floorArea:0, mapSize:'0x0' } };
  }

  let boxCount = 0, goalCount = 0, playerCount = 0, floorArea = 0;
  const rows = map.length;
  const cols = Math.max(...map.map(r => r.length));

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const c = (map[y] || '')[x] || ' ';
      switch (c) {
        case TILE.BOX:            boxCount++; floorArea++; break;
        case TILE.BOX_ON_GOAL:   boxCount++; goalCount++; floorArea++; break;
        case TILE.GOAL:          goalCount++; floorArea++; break;
        case TILE.PLAYER:        playerCount++; floorArea++; break;
        case TILE.PLAYER_ON_GOAL: playerCount++; goalCount++; floorArea++; break;
        case TILE.FLOOR:         floorArea++; break;
        case TILE.WALL:          break;
        default:                 warnings.push(`未知字符 '${c}' 在 (${x},${y})`); break;
      }
    }
  }

  if (playerCount === 0) errors.push('缺少玩家起始位置 (@)');
  if (playerCount > 1) errors.push(`玩家位置重复 (${playerCount}个)`);
  if (boxCount === 0) errors.push('没有箱子');
  if (goalCount === 0) errors.push('没有目标点');
  if (boxCount !== goalCount) errors.push(`箱子数(${boxCount})与目标点数(${goalCount})不匹配`);
  if (rows < 3) errors.push('地图行数过少');
  if (cols < 3) errors.push('地图列数过少');
  if (rows > 20) warnings.push('地图行数较多，可能影响性能');
  if (cols > 20) warnings.push('地图列数较多，可能影响性能');
  if (!level.name?.trim()) warnings.push('关卡名称为空');
  if (!level.parMoves || level.parMoves < 1) warnings.push('par步数未设置');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: { boxCount, goalCount, playerCount, floorArea, mapSize: `${cols}×${rows}` },
  };
}

export async function validateLevelSolvable(
  level: Level,
  timeoutMs = 5000
): Promise<{ solvable: boolean; steps?: number }> {
  const grid = level.map.map(row => [...row]);
  const goals: { x: number; y: number }[] = [];
  let player = { x: 0, y: 0 };
  for (let y = 0; y < grid.length; y++)
    for (let x = 0; x < grid[y].length; x++) {
      const c = grid[y][x];
      if (c === TILE.GOAL || c === TILE.BOX_ON_GOAL || c === TILE.PLAYER_ON_GOAL) goals.push({ x, y });
      if (c === TILE.PLAYER || c === TILE.PLAYER_ON_GOAL) player = { x, y };
    }
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve({ solvable: false }), timeoutMs);
    try {
      const result = aiBfsSolve(grid, player, goals);
      clearTimeout(timer);
      resolve(result ? { solvable: true, steps: result.steps.length } : { solvable: false });
    } catch {
      clearTimeout(timer);
      resolve({ solvable: false });
    }
  });
}

export function renderValidationResult(
  container: HTMLElement,
  result: ValidationResult
): void {
  const color = result.valid ? '#50fa7b' : '#ff5555';
  const icon = result.valid ? '✅' : '❌';
  container.innerHTML = `
    <div style="border:1px solid ${color};border-radius:8px;padding:12px;font-size:0.85em">
      <div style="color:${color};font-weight:bold;margin-bottom:8px">${icon} ${result.valid ? '关卡合法' : '关卡有误'}</div>
      <div style="color:#888;margin-bottom:6px">
        箱子:${result.stats.boxCount} 目标:${result.stats.goalCount}
        玩家:${result.stats.playerCount} 地图:${result.stats.mapSize}
      </div>
      ${result.errors.map(e => `<div style="color:#ff5555">✗ ${e}</div>`).join('')}
      ${result.warnings.map(w => `<div style="color:#ffd166">⚠ ${w}</div>`).join('')}
    </div>
  `;
}
