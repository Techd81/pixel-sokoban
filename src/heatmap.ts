// ─── 关卡统计热力图 Level Stats Heatmap ─────────────────────────────────────
// 可视化玩家在所有关卡的表现，热力图展示通关率/效率/耗时分布

import type { Records } from './types';
import { LEVELS } from './levels';

export interface LevelStat {
  index: number;
  name: string;
  cleared: boolean;
  efficiency: number;   // bestMoves/parMoves，越低越好，0=未通关
  timeMs: number;
  rank: string;
  difficulty: number;   // 0~1 归一化难度
}

export function buildLevelStats(records: Records): LevelStat[] {
  return LEVELS.map((level, i) => {
    const r = records[i];
    const cleared = !!(r?.bestMoves && r.bestMoves > 0);
    const efficiency = cleared ? r!.bestMoves / level.parMoves : 0;
    const difficulty = Math.min(1, (level.parMoves + level.map.reduce(
      (n, row) => n + [...row].filter(c => c === '$' || c === '*').length * 8, 0
    )) / 150);
    return {
      index: i,
      name: level.name,
      cleared,
      efficiency,
      timeMs: r?.bestTimeMs ?? 0,
      rank: r?.bestRank ?? '',
      difficulty,
    };
  });
}

export function renderStatsHeatmap(
  canvas: HTMLCanvasElement,
  records: Records,
  mode: 'efficiency' | 'time' | 'difficulty' = 'efficiency'
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const stats = buildLevelStats(records);
  const cols = 10;
  const rows = Math.ceil(stats.length / cols);
  const cellW = canvas.width / cols;
  const cellH = canvas.height / rows;

  ctx.fillStyle = '#17121f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  stats.forEach((s, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * cellW;
    const y = row * cellH;

    let heat = 0;
    let color = '#2a2040';

    if (s.cleared) {
      if (mode === 'efficiency') {
        // efficiency: 1=par, >1=超出 → 越低越绿
        heat = Math.max(0, Math.min(1, 1 - (s.efficiency - 1) / 2));
        color = heatColor(heat, '#ff6b6b', '#ffd166', '#50fa7b');
      } else if (mode === 'time') {
        const maxTime = 300000; // 5分钟
        heat = 1 - Math.min(1, s.timeMs / maxTime);
        color = heatColor(heat, '#ff6b6b', '#8be9fd', '#bd93f9');
      } else {
        heat = 1 - s.difficulty;
        color = heatColor(s.difficulty, '#50fa7b', '#ffd166', '#ff6b6b');
      }
    }

    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

    // 关卡编号
    ctx.fillStyle = s.cleared ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)';
    ctx.font = `${Math.min(cellW, cellH) * 0.3}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), x + cellW / 2, y + cellH / 2);

    // 星级
    if (s.rank) {
      ctx.font = `${Math.min(cellW, cellH) * 0.22}px monospace`;
      ctx.fillText(s.rank, x + cellW / 2, y + cellH * 0.78);
    }
  });

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function heatColor(t: number, cold: string, mid: string, hot: string): string {
  const c = t < 0.5
    ? lerpColor(cold, mid, t * 2)
    : lerpColor(mid, hot, (t - 0.5) * 2);
  return c;
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = parseHex(a), pb = parseHex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function renderLegend(
  canvas: HTMLCanvasElement,
  mode: 'efficiency' | 'time' | 'difficulty'
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const labels: Record<string, string> = {
    efficiency: '效率（绿=完美，红=超步）',
    time: '用时（紫=快，红=慢）',
    difficulty: '难度（绿=简单，红=困难）',
  };
  ctx.fillStyle = '#ccc';
  ctx.font = '12px monospace';
  ctx.fillText(labels[mode] || '', 4, 14);
}
