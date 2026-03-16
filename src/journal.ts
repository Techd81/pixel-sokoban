// ─── 玩家成长日记 Progress Journal ───────────────────────────────────────────
// 自动记录每次通关，生成成长时间线

export interface JournalEntry {
  date: string;
  levelIndex: number;
  levelName: string;
  moves: number;
  timeMs: number;
  rank: string;
  isNewRecord: boolean;
  milestone?: string;  // 特殊里程碑
}

const JOURNAL_KEY = 'sokoban_journal';
const MAX_ENTRIES = 200;

export function loadJournal(): JournalEntry[] {
  try { return JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]'); } catch { return []; }
}

function saveJournal(entries: JournalEntry[]): void {
  try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES))); } catch { }
}

export function addJournalEntry(entry: Omit<JournalEntry, 'date'>): void {
  const entries = loadJournal();
  const milestones = [1,5,10,20,35,50,70];
  const cleared = new Set(entries.map(e => e.levelIndex)).size + 1;
  const milestone = milestones.includes(cleared) ? `通关第${cleared}关里程碑！` : undefined;
  entries.push({ ...entry, date: new Date().toLocaleString('zh-CN'), milestone });
  saveJournal(entries);
}

export function getRecentEntries(n = 10): JournalEntry[] {
  return loadJournal().slice(-n).reverse();
}

export function renderJournal(container: HTMLElement): void {
  const entries = getRecentEntries(20);
  if (entries.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#888">暂无记录，开始游戏吧！</p>';
    return;
  }
  container.innerHTML = entries.map(e => `
    <div style="border-left:3px solid ${e.rank==='★★★'?'#ffd166':e.rank==='★★'?'#8be9fd':'#6272a4'};padding:8px 12px;margin-bottom:8px;background:#1e1a2e;border-radius:0 6px 6px 0">
      <div style="font-size:0.8em;color:#888">${e.date}</div>
      <div><b>L${e.levelIndex+1} ${e.levelName}</b> ${e.rank||''} ${e.isNewRecord?'🆕':''}</div>
      <div style="font-size:0.85em;color:#aaa">${e.moves}步 · ${(e.timeMs/1000).toFixed(1)}s</div>
      ${e.milestone?`<div style="color:#ffd166;font-size:0.8em">🏆 ${e.milestone}</div>`:''}
    </div>
  `).join('');
}
