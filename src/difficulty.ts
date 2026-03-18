// ─── 关卡难度预测 Level Difficulty Predictor ─────────────────────────────────
import type { Level } from './types';
import { TILE } from './types';

export interface LevelFeatures {
  boxCount: number;
  goalCount: number;
  floorArea: number;
  wallRatio: number;
  avgBoxToGoalDist: number;
  corridorCount: number;
  mapArea: number;
  parMoves: number;
  cornerTraps: number;    // 死角格子数（三面墙包围的非目标格）
  boxSpread: number;      // 箱子分散度（平均箱间曼哈顿距）
  goalSpread: number;     // 目标分散度
}

export interface DifficultyPrediction {
  score: number;      // 0~100
  label: string;
  color: string;
  features: LevelFeatures;
}

function manhattanDist(a: {x:number;y:number}, b: {x:number;y:number}): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function avgSpread(pts: {x:number;y:number}[]): number {
  if (pts.length < 2) return 0;
  let total = 0, count = 0;
  for (let i = 0; i < pts.length; i++)
    for (let j = i+1; j < pts.length; j++)
      { total += manhattanDist(pts[i], pts[j]); count++; }
  return total / count;
}

export function extractFeatures(level: Level): LevelFeatures {
  const rows = level.map.length;
  const cols = Math.max(...level.map.map(r => r.length));
  let boxCount = 0, goalCount = 0, floorArea = 0, wallCount = 0, corridorCount = 0, cornerTraps = 0;
  const boxes: {x:number;y:number}[] = [];
  const goals: {x:number;y:number}[] = [];
  const mapArea = rows * cols;

  const isWall = (x: number, y: number): boolean =>
    y < 0 || y >= rows || x < 0 || x >= cols ||
    (level.map[y]||'')[x] === TILE.WALL || !(level.map[y]||'')[x];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const c = (level.map[y] || '')[x] || ' ';
      if (c === TILE.WALL) { wallCount++; continue; }
      floorArea++;
      if (c === TILE.BOX || c === TILE.BOX_ON_GOAL) { boxCount++; boxes.push({x,y}); }
      if (c === TILE.GOAL || c === TILE.BOX_ON_GOAL || c === TILE.PLAYER_ON_GOAL) { goalCount++; goals.push({x,y}); }

      // 走廊检测：只有<=2方向可通行
      const dirs4: [number,number][] = [[0,-1],[0,1],[-1,0],[1,0]];
      const open = dirs4.filter(([dx,dy]) => !isWall(x+dx, y+dy)).length;
      if (open <= 2) corridorCount++;

      // 死角检测：三面墙包围的非目标格
      const wallSides = dirs4.filter(([dx,dy]) => isWall(x+dx, y+dy)).length;
      if (wallSides >= 3 && c !== TILE.GOAL && c !== TILE.BOX_ON_GOAL) cornerTraps++;
    }
  }

  let avgBoxToGoalDist = 0;
  if (boxes.length > 0 && goals.length > 0) {
    avgBoxToGoalDist = boxes.reduce((sum, b) => {
      return sum + Math.min(...goals.map(g => manhattanDist(b, g)));
    }, 0) / boxes.length;
  }

  const boxSpread = avgSpread(boxes);
  const goalSpread = avgSpread(goals);

  return { boxCount, goalCount, floorArea, wallRatio: wallCount / Math.max(mapArea, 1),
    avgBoxToGoalDist, corridorCount, mapArea, parMoves: level.parMoves,
    cornerTraps, boxSpread, goalSpread };
}

export function predictDifficulty(level: Level): DifficultyPrediction {
  const f = extractFeatures(level);
  // 多维加权评分：箱子数、平均距离、走廊密度、par步数、死角、分散度
  const score = Math.min(100, Math.round(
    f.boxCount * 7 +
    f.avgBoxToGoalDist * 2.5 +
    (f.corridorCount / Math.max(f.floorArea, 1)) * 40 +
    f.parMoves * 0.35 +
    f.cornerTraps * 2 +
    f.boxSpread * 0.8 +
    f.goalSpread * 0.5
  ));

  let label: string; let color: string;
  if (score < 15)       { label = '入门'; color = '#88ff88'; }
  else if (score < 35)  { label = '简单'; color = '#8be9fd'; }
  else if (score < 55)  { label = '中等'; color = '#ffd166'; }
  else if (score < 75)  { label = '困难'; color = '#ff79c6'; }
  else                  { label = '极难'; color = '#ff6b6b'; }

  return { score, label, color, features: f };
}

export function rankLevelsByDifficulty(levels: Level[]): Array<{index:number; prediction: DifficultyPrediction}> {
  return levels
    .map((l, i) => ({ index: i, prediction: predictDifficulty(l) }))
    .sort((a, b) => a.prediction.score - b.prediction.score);
}
