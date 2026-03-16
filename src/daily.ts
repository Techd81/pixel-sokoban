// ─── 每日挑战系统 Daily Challenge ────────────────────────────────────────────
import { LEVELS } from './levels';
import type { Level } from './types';

export interface DailyChallenge {
  date: string;         // 'YYYY-MM-DD'
  levelIndex: number;
  level: Level;
  completed: boolean;
  completedMoves?: number;
  completedTimeMs?: number;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function hashDate(dateStr: string): number {
  return dateStr.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
}

export function getDailyChallenge(): DailyChallenge {
  const date = todayStr();
  const idx = hashDate(date) % Math.min(LEVELS.length, 50);
  const saved = localStorage.getItem('sokoban_daily_' + date);
  let completed = false, completedMoves: number | undefined, completedTimeMs: number | undefined;
  if (saved) {
    try { const d = JSON.parse(saved); completed = d.completed; completedMoves = d.moves; completedTimeMs = d.timeMs; } catch { }
  }
  return { date, levelIndex: idx, level: LEVELS[idx], completed, completedMoves, completedTimeMs };
}

export function completeDailyChallenge(moves: number, timeMs: number): void {
  const date = todayStr();
  localStorage.setItem('sokoban_daily_' + date, JSON.stringify({ completed: true, moves, timeMs }));
}

export function getDailyStreak(): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const s = d.toISOString().slice(0, 10);
    const saved = localStorage.getItem('sokoban_daily_' + s);
    if (!saved) break;
    try { if (JSON.parse(saved).completed) streak++; else break; } catch { break; }
  }
  return streak;
}

export function renderDailyBadge(container: HTMLElement): void {
  const dc = getDailyChallenge();
  const streak = getDailyStreak();
  container.innerHTML = `
    <div style="background:#1e1e2e;border:1px solid #ffd166;border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:1.5em">📅 今日挑战</div>
      <div style="color:#ffd166;font-size:1.1em;margin:8px 0">第${dc.levelIndex+1}关：${dc.level.name}</div>
      <div style="color:#888;font-size:0.85em">Par: ${dc.level.parMoves} 步</div>
      ${dc.completed
        ? `<div style="color:#50fa7b;margin-top:8px">✅ 今日已完成！${dc.completedMoves}步</div>`
        : `<button id="startDailyBtn" style="margin-top:10px;padding:6px 18px;background:#ffd166;color:#17121f;border:none;border-radius:6px;cursor:pointer;font-weight:bold">开始挑战</button>`
      }
      ${streak > 0 ? `<div style="color:#ffb86c;font-size:0.8em;margin-top:6px">🔥 连续 ${streak} 天</div>` : ''}
    </div>
  `;
}
