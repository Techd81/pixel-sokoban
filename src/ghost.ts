// ─── 幽灵回放系统 Ghost Replay System ────────────────────────────────────────
// 记录玩家最佳通关路径，下次游玩时显示半透明幽灵重演最优解

import type { Pos } from './types';

export interface GhostFrame {
  playerPos: Pos;
  boxPositions: Pos[];
  facing: string;
}

export interface GhostRecord {
  levelIndex: number;
  frames: GhostFrame[];
  totalMoves: number;
  recordedAt: number;
}

const GHOST_STORAGE_PREFIX = 'sokoban_ghost_';

// ─── 持久化 ───────────────────────────────────────────────────────────────────

const _ghostCache = new Map<number, GhostRecord | null>();

export function saveGhostRecord(record: GhostRecord): void {
  try {
    const existing = loadGhostRecord(record.levelIndex);
    if (!existing || record.totalMoves < existing.totalMoves) {
      localStorage.setItem(GHOST_STORAGE_PREFIX + record.levelIndex, JSON.stringify(record));
      _ghostCache.set(record.levelIndex, record); // 更新缓存
    }
  } catch { /* storage full, ignore */ }
}

export function loadGhostRecord(levelIndex: number): GhostRecord | null {
  if (_ghostCache.has(levelIndex)) return _ghostCache.get(levelIndex)!;
  try {
    const raw = localStorage.getItem(GHOST_STORAGE_PREFIX + levelIndex);
    const rec = raw ? JSON.parse(raw) : null;
    _ghostCache.set(levelIndex, rec);
    return rec;
  } catch { return null; }
}

// ─── 录制器 ───────────────────────────────────────────────────────────────────

export class GhostRecorder {
  private frames: GhostFrame[] = [];
  private levelIndex: number = -1;
  private active: boolean = false;

  start(levelIndex: number): void {
    this.levelIndex = levelIndex;
    this.frames = [];
    this.active = true;
  }

  captureFrame(playerPos: Pos, boxPositions: Pos[], facing: string): void {
    if (!this.active) return;
    if (this.frames.length >= 800) return; // 限制最多800帧防内存/存储溢出
    this.frames.push({
      playerPos: { ...playerPos },
      boxPositions: boxPositions.map(b => ({ ...b })),
      facing,
    });
  }

  stop(): void { this.active = false; }

  save(moves: number): void {
    if (this.levelIndex < 0 || this.frames.length === 0) return;
    saveGhostRecord({
      levelIndex: this.levelIndex,
      frames: this.frames,
      totalMoves: moves,
      recordedAt: Date.now(),
    });
  }

  reset(): void { this.frames = []; this.active = false; }
}

// ─── 回放器 ───────────────────────────────────────────────────────────────────

export class GhostPlayer {
  private record: GhostRecord | null = null;
  private currentFrame: number = 0;
  private visible: boolean = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onFrameCallback: ((frame: GhostFrame, progress: number) => void) | null = null;

  load(levelIndex: number): boolean {
    this.record = loadGhostRecord(levelIndex);
    this.currentFrame = 0;
    return this.record !== null;
  }

  start(onFrame: (frame: GhostFrame, progress: number) => void, intervalMs = 200): void {
    if (!this.record) return;
    this.visible = true;
    this.currentFrame = 0;
    this.onFrameCallback = onFrame;
    this.intervalId = setInterval(() => this.tick(), intervalMs);
  }

  private tick(): void {
    if (!this.record || !this.visible) { this.stop(); return; }
    if (this.currentFrame >= this.record.frames.length) {
      this.stop(); return;
    }
    const frame = this.record.frames[this.currentFrame];
    const progress = this.currentFrame / (this.record.frames.length - 1);
    this.onFrameCallback?.(frame, progress);
    this.currentFrame++;
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.visible = false;
  }

  isVisible(): boolean { return this.visible; }
  getCurrentFrame(): number { return this.currentFrame; }
  getTotalFrames(): number { return this.record?.frames.length ?? 0; }
}

// ─── 单例导出 ─────────────────────────────────────────────────────────────────

export const ghostRecorder = new GhostRecorder();
export const ghostPlayer = new GhostPlayer();
