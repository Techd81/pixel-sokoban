// ─── 速通挑战增强 Speedrun Mode Enhanced ────────────────────────────────────
import type { Level } from './types';

export interface SpeedrunSplit {
  levelIndex: number;
  levelName: string;
  moves: number;
  timeMs: number;
  cumTimeMs: number;
  par: number;
  delta: number;   // vs personal best split, negative = ahead
}

export interface SpeedrunPB {
  splits: SpeedrunSplit[];
  totalTimeMs: number;
  totalMoves: number;
  clearedCount: number;
  score: number;
  date: string;
}

const SR_PB_KEY = 'sokoban_sr_pb';

export function loadSpeedrunPB(): SpeedrunPB | null {
  try {
    const raw = localStorage.getItem(SR_PB_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveSpeedrunPB(pb: SpeedrunPB): void {
  try { localStorage.setItem(SR_PB_KEY, JSON.stringify(pb)); } catch { }
}

export class SpeedrunTimer {
  private splits: SpeedrunSplit[] = [];
  private startMs = 0;
  private levelStartMs = 0;
  private cumMs = 0;
  private active = false;
  private pb: SpeedrunPB | null = null;

  start(): void {
    this.splits = [];
    this.startMs = performance.now();
    this.levelStartMs = this.startMs;
    this.cumMs = 0;
    this.active = true;
    this.pb = loadSpeedrunPB();
  }

  split(level: Level, levelIndex: number, moves: number): SpeedrunSplit {
    const now = performance.now();
    const timeMs = Math.round(now - this.levelStartMs);
    this.cumMs += timeMs;
    const pbSplit = this.pb?.splits.find(s => s.levelIndex === levelIndex);
    const split: SpeedrunSplit = {
      levelIndex, levelName: level.name,
      moves, timeMs, cumTimeMs: this.cumMs,
      par: level.parMoves,
      delta: pbSplit ? timeMs - pbSplit.timeMs : 0,
    };
    this.splits.push(split);
    this.levelStartMs = now;
    return split;
  }

  finish(clearedCount: number): SpeedrunPB {
    this.active = false;
    const totalTimeMs = Math.round(performance.now() - this.startMs);
    const totalMoves = this.splits.reduce((n, s) => n + s.moves, 0);
    const score = clearedCount * 100 + Math.max(0, Math.floor((300000 - totalTimeMs) / 100));
    const pb: SpeedrunPB = {
      splits: this.splits, totalTimeMs, totalMoves,
      clearedCount, score,
      date: new Date().toLocaleDateString('zh-CN'),
    };
    const old = loadSpeedrunPB();
    if (!old || score > old.score) saveSpeedrunPB(pb);
    return pb;
  }

  isActive(): boolean { return this.active; }
  getSplits(): SpeedrunSplit[] { return this.splits; }

  renderHUD(container: HTMLElement, currentLevel: Level, levelIndex: number): void {
    const elapsed = this.active ? Math.round(performance.now() - this.startMs) : 0;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    const ms = elapsed % 1000;
    const pbSplit = this.pb?.splits.find(s => s.levelIndex === levelIndex);
    const delta = pbSplit ? elapsed - pbSplit.cumTimeMs : 0;
    const deltaStr = delta === 0 ? '' : delta > 0 ? `+${(delta/1000).toFixed(1)}s` : `${(delta/1000).toFixed(1)}s`;
    const deltaColor = delta > 0 ? '#ff6b6b' : '#50fa7b';
    container.innerHTML = `
      <div style="font-family:monospace;font-size:1.1em;color:#f8f8f2">
        <span style="font-size:1.4em;font-weight:bold">${mins}:${String(secs).padStart(2,'0')}.${String(ms).padStart(3,'0')}</span>
        ${deltaStr ? `<span style="color:${deltaColor};margin-left:8px">${deltaStr}</span>` : ''}
      </div>
      <div style="font-size:0.8em;color:#888">${this.splits.length} 关已通 · ${currentLevel.name}</div>
    `;
  }
}

export const speedrunTimer = new SpeedrunTimer();
