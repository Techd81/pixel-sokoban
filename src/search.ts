// ─── 关卡搜索引擎 Level Search Engine ────────────────────────────────────────
import type { Level } from './types';
import { LEVELS } from './levels';
import { predictDifficulty } from './difficulty';

export interface SearchFilter {
  query?: string;          // 名称模糊搜索
  minBoxes?: number;
  maxBoxes?: number;
  difficulty?: string[];   // ['入门','简单','中等','困难','极难']
  minPar?: number;
  maxPar?: number;
  onlyCleared?: boolean;
  onlyUncleared?: boolean;
  onlyFavorited?: boolean;
}

export interface SearchResult {
  index: number;
  level: Level;
  score: number;           // 相关度评分
  difficulty: string;
  boxCount: number;
}

function countBoxes(level: Level): number {
  return level.map.reduce((n, row) =>
    n + [...row].filter(c => c === '$' || c === '*').length, 0
  );
}

export function searchLevels(
  filter: SearchFilter,
  records: Record<number, { bestMoves?: number } | null> = {},
  favorites: Set<number> = new Set()
): SearchResult[] {
  const results: SearchResult[] = [];

  LEVELS.forEach((level, i) => {
    const boxCount = countBoxes(level);
    const diff = predictDifficulty(level);
    const cleared = !!(records[i]?.bestMoves && records[i]!.bestMoves! > 0);

    // 过滤条件
    if (filter.onlyCleared && !cleared) return;
    if (filter.onlyUncleared && cleared) return;
    if (filter.onlyFavorited && !favorites.has(i)) return;
    if (filter.minBoxes !== undefined && boxCount < filter.minBoxes) return;
    if (filter.maxBoxes !== undefined && boxCount > filter.maxBoxes) return;
    if (filter.minPar !== undefined && level.parMoves < filter.minPar) return;
    if (filter.maxPar !== undefined && level.parMoves > filter.maxPar) return;
    if (filter.difficulty?.length && !filter.difficulty.includes(diff.label)) return;

    // 相关度评分
    let score = 100;
    if (filter.query) {
      const q = filter.query.toLowerCase();
      const name = level.name.toLowerCase();
      if (name === q) score += 100;
      else if (name.includes(q)) score += 50;
      else if (`L${i + 1}`.toLowerCase().includes(q)) score += 30;
      else return; // 不匹配则跳过
    }

    results.push({ index: i, level, score, difficulty: diff.label, boxCount });
  });

  return results.sort((a, b) => b.score - a.score || a.index - b.index);
}

export function quickSearch(query: string): SearchResult[] {
  return searchLevels({ query });
}

export function filterByDifficulty(label: string): SearchResult[] {
  return searchLevels({ difficulty: [label] });
}
