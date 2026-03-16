// ─── 本地排行榜系统 Local Leaderboard ────────────────────────────────────────

export interface LeaderboardEntry {
  nickname: string;
  levelIndex: number;
  moves: number;
  timeMs: number;
  score: number;
  date: string;
  rank: string;
}

const LB_KEY = 'sokoban_leaderboard';
const MAX_PER_LEVEL = 10;

export function loadLeaderboard(): LeaderboardEntry[] {
  try { return JSON.parse(localStorage.getItem(LB_KEY) || '[]'); } catch { return []; }
}

export function saveLeaderboard(entries: LeaderboardEntry[]): void {
  try { localStorage.setItem(LB_KEY, JSON.stringify(entries)); } catch { }
}

export function addLeaderboardEntry(
  entry: Omit<LeaderboardEntry, 'score' | 'date'> & { par: number }
): LeaderboardEntry {
  const score = calcScore(entry.moves, entry.par, entry.timeMs);
  const date = new Date().toLocaleDateString('zh-CN');
  const full: LeaderboardEntry = { ...entry, score, date };
  const all = loadLeaderboard();
  all.push(full);
  // 每关最多保留 MAX_PER_LEVEL 条，按分数降序
  const filtered = all
    .filter(e => e.levelIndex === entry.levelIndex)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PER_LEVEL);
  const others = all.filter(e => e.levelIndex !== entry.levelIndex);
  saveLeaderboard([...others, ...filtered]);
  return full;
}

export function getTopEntries(levelIndex: number, top = MAX_PER_LEVEL): LeaderboardEntry[] {
  return loadLeaderboard()
    .filter(e => e.levelIndex === levelIndex)
    .sort((a, b) => b.score - a.score)
    .slice(0, top);
}

export function calcScore(moves: number, par: number, timeMs: number): number {
  const moveBonus = Math.max(0, par - moves) * 5;
  const timeBonus = Math.max(0, Math.floor((10000 - timeMs) / 100));
  return 100 + moveBonus + timeBonus;
}

export function renderLeaderboard(
  container: HTMLElement,
  entries: LeaderboardEntry[]
): void {
  if (entries.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#888">暂无记录</p>';
    return;
  }
  const medals = ['🥇', '🥈', '🥉'];
  container.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:0.85em">
      <thead><tr style="border-bottom:2px solid #555">
        <th style="padding:4px">#</th>
        <th style="padding:4px">昵称</th>
        <th style="padding:4px">步数</th>
        <th style="padding:4px">时间</th>
        <th style="padding:4px">评分</th>
        <th style="padding:4px">日期</th>
      </tr></thead>
      <tbody>
        ${entries.map((e, i) => `
          <tr style="border-bottom:1px solid #333">
            <td style="text-align:center;padding:4px">${medals[i] ?? i + 1}</td>
            <td style="padding:4px">${e.nickname}</td>
            <td style="padding:4px">${e.moves}</td>
            <td style="padding:4px">${(e.timeMs / 1000).toFixed(1)}s</td>
            <td style="padding:4px"><b>${e.score}</b></td>
            <td style="padding:4px">${e.date}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
