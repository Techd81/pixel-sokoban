import type { Records, LevelRecord, Rank } from './types';

export const STORAGE_KEY = 'pixelSokobanRecords';
export const STORAGE_KEY_ACHIEVEMENTS = 'pixelSokobanAchievements';
export const STORAGE_KEY_STATS = 'pixelSokobanStats';
export const STORAGE_KEY_NAME = 'pixelSokobanName';
export const STORAGE_KEY_LOCK = 'pixelSokobanLockMode';

export function loadRecords(): Records {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (parsed.levels) return parsed.levels;
      return parsed;
    }
    return {};
  } catch { return {}; }
}

export function saveRecords(records: Records): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, levels: records }));
  } catch {}
}

export function loadAchievements(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

export function saveAchievements(unlocked: Set<string>): void {
  try { localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify([...unlocked])); } catch {}
}

export function loadPlayerName(): string {
  return localStorage.getItem(STORAGE_KEY_NAME) || '旅行者';
}

export function savePlayerName(name: string): void {
  localStorage.setItem(STORAGE_KEY_NAME, name);
}

export function getRank(moves: number, starMoves: { three: number; two: number; one: number }): string {
  if (moves <= starMoves.three) return '★★★';
  if (moves <= starMoves.two) return '★★';
  if (moves <= starMoves.one) return '★';
  return '通关';
}

export function formatMs(ms: number | null | undefined): string {
  if (!ms) return '--';
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  return m > 0 ? `${m}分${(s % 60).toString().padStart(2, '0')}秒` : `${s}秒`;
}

export function formatBest(record: LevelRecord | null): string {
  if (!record) return '--';
  return `${record.bestMoves} 步`;
}
