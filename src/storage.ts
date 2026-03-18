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

// 延迟写队列：用 requestIdleCallback 在空闲时批量写，消除主线程卡顿
const pendingWrites = new Map<string, string>();
let writeScheduled = false;

function flushWrites(): void {
  for (const [key, value] of pendingWrites) {
    try { localStorage.setItem(key, value); } catch {}
  }
  pendingWrites.clear();
  writeScheduled = false;
}

function scheduleWrite(key: string, value: string): void {
  pendingWrites.set(key, value);
  if (!writeScheduled) {
    writeScheduled = true;
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(flushWrites, { timeout: 2000 });
    } else {
      setTimeout(flushWrites, 200);
    }
  }
}

export function saveRecords(records: Records): void {
  scheduleWrite(STORAGE_KEY, JSON.stringify({ version: 2, levels: records }));
}

export function saveAchievements(unlocked: Set<string>): void {
  scheduleWrite(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify([...unlocked]));
}

export function loadAchievements(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
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
