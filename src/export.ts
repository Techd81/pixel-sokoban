// ─── 数据导出系统 Data Export ─────────────────────────────────────────────────
import type { Records } from './types';
import { LEVELS } from './levels';
import { predictDifficulty } from './difficulty';

export type ExportFormat = 'json' | 'csv' | 'txt' | 'markdown';

function formatTime(ms: number): string {
  if (!ms) return '-';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m${s % 60}s` : `${s}s`;
}

export function exportRecords(records: Records, format: ExportFormat = 'json'): void {
  let content = '';
  let filename = 'sokoban_records_' + Date.now();
  let mime = 'text/plain';

  const rows = LEVELS.map((level, i) => {
    const r = records[i];
    const diff = predictDifficulty(level);
    return {
      id: i + 1, name: level.name,
      par: level.parMoves,
      difficulty: diff.label,
      cleared: r?.bestMoves ? '✓' : '✗',
      bestMoves: r?.bestMoves ?? '-',
      bestTime: formatTime(r?.bestTimeMs ?? 0),
      rank: r?.bestRank ?? '-',
      challenge: r?.challengeCleared ? '✓' : '✗',
    };
  });

  switch (format) {
    case 'json':
      content = JSON.stringify({ exportedAt: new Date().toISOString(), records: rows }, null, 2);
      filename += '.json'; mime = 'application/json';
      break;

    case 'csv': {
      const header = 'ID,关卡名,目标步,难度,通关,最佳步,最佳时间,评级,挑战';
      const lines = rows.map(r =>
        `${r.id},"${r.name}",${r.par},${r.difficulty},${r.cleared},${r.bestMoves},${r.bestTime},${r.rank},${r.challenge}`
      );
      content = [header, ...lines].join('\n');
      filename += '.csv'; mime = 'text/csv';
      break;
    }

    case 'markdown': {
      const header = '| # | 关卡 | 目标 | 难度 | 通关 | 最佳步 | 时间 | 评级 |\n|---|------|------|------|------|--------|------|------|';
      const lines = rows.map(r =>
        `| ${r.id} | ${r.name} | ${r.par} | ${r.difficulty} | ${r.cleared} | ${r.bestMoves} | ${r.bestTime} | ${r.rank} |`
      );
      const cleared = rows.filter(r => r.cleared === '✓').length;
      content = `# 像素推箱子成绩单\n\n导出时间: ${new Date().toLocaleString()}\n通关进度: ${cleared}/${LEVELS.length}\n\n${header}\n${lines.join('\n')}`;
      filename += '.md'; mime = 'text/markdown';
      break;
    }

    default: {
      const cleared = rows.filter(r => r.cleared === '✓').length;
      const lines = rows.map(r =>
        `${String(r.id).padStart(2)} ${r.name.padEnd(12)} par:${String(r.par).padStart(3)} ${r.difficulty.padEnd(4)} ${r.cleared} 步:${String(r.bestMoves).padStart(4)} ${r.bestTime.padStart(6)} ${r.rank}`
      );
      content = `像素推箱子成绩单\n${'='.repeat(60)}\n导出: ${new Date().toLocaleString()}\n通关: ${cleared}/${LEVELS.length}\n${'='.repeat(60)}\n${lines.join('\n')}`;
      filename += '.txt';
      break;
    }
  }

  const blob = new Blob([content], { type: mime + ';charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function importRecordsFromJSON(jsonStr: string): Records | null {
  try {
    if (jsonStr.length > 200000) return null; // 导入大小限制200KB
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    // 验证并提取records
    const raw: Record<string, unknown> = data.levels ?? data;
    const result: Records = {};
    for (const [k, v] of Object.entries(raw)) {
      const idx = Number(k);
      if (!Number.isFinite(idx) || idx < 0 || idx > 9999) continue;
      if (!v || typeof v !== 'object') continue;
      const r = v as Record<string, unknown>;
      if (typeof r.bestMoves !== 'number') continue;
      result[idx] = {
        bestMoves: r.bestMoves as number,
        bestRank: (r.bestRank as string) ?? null,
        bestTimeMs: (r.bestTimeMs as number) ?? 0,
        challengeCleared: !!(r.challengeCleared),
      };
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch { return null; }
}
