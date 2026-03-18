// ─── 时间线回放系统 Timeline Replay ─────────────────────────────────────────
import type { Pos } from './types';

export interface ReplayStep {
  dx: number;
  dy: number;
  facing: string;
  isPush: boolean;
  timestamp: number;
}

export interface ReplayData {
  levelIndex: number;
  levelName: string;
  steps: ReplayStep[];
  totalMoves: number;
  totalTimeMs: number;
  recordedAt: number;
}

const REPLAY_PREFIX = 'sokoban_replay_';
const MAX_REPLAY_STEPS = 500;

export function saveReplay(data: ReplayData): void {
  try {
    const steps = data.steps.length > MAX_REPLAY_STEPS
      ? data.steps.slice(-MAX_REPLAY_STEPS)
      : data.steps;
    localStorage.setItem(REPLAY_PREFIX + data.levelIndex, JSON.stringify({ ...data, steps }));
  } catch { }
}

export function loadReplay(levelIndex: number): ReplayData | null {
  try {
    const raw = localStorage.getItem(REPLAY_PREFIX + levelIndex);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export class TimelineUI {
  private container: HTMLElement | null = null;
  private scrubber: HTMLInputElement | null = null;
  private playBtn: HTMLButtonElement | null = null;
  private speedBtn: HTMLButtonElement | null = null;
  private stepLabel: HTMLElement | null = null;
  private data: ReplayData | null = null;
  private currentStep = 0;
  private playing = false;
  private speed = 1;
  private playIntervalId: ReturnType<typeof setInterval> | null = null;
  private onSeek: ((step: number) => void) | null = null;

  create(parent: HTMLElement, data: ReplayData, onSeek: (step: number) => void): void {
    this.data = data;
    this.onSeek = onSeek;
    this.currentStep = 0;

    this.container = document.createElement('div');
    this.container.className = 'timeline-ui';
    this.container.innerHTML = `
      <div class="tl-header">
        <span class="tl-title">回放：${data.levelName}</span>
        <span class="tl-total">${data.totalMoves}步 ${(data.totalTimeMs/1000).toFixed(1)}s</span>
        <button class="tl-close">×</button>
      </div>
      <div class="tl-controls">
        <button class="tl-play">▶</button>
        <input type="range" class="tl-scrubber" min="0" max="${data.steps.length}" value="0" />
        <span class="tl-label">0/${data.steps.length}</span>
        <button class="tl-speed">1×</button>
      </div>`;
    parent.appendChild(this.container);

    this.playBtn = this.container.querySelector('.tl-play');
    this.scrubber = this.container.querySelector('.tl-scrubber');
    this.stepLabel = this.container.querySelector('.tl-label');
    this.speedBtn = this.container.querySelector('.tl-speed');

    this.scrubber?.addEventListener('input', () => {
      this.currentStep = Number(this.scrubber!.value);
      this.updateLabel();
      this.onSeek?.(this.currentStep);
    });

    this.playBtn?.addEventListener('click', () => this.togglePlay());
    this.speedBtn?.addEventListener('click', () => this.cycleSpeed());
    this.container.querySelector('.tl-close')?.addEventListener('click', () => this.destroy());
  }

  private togglePlay(): void {
    this.playing = !this.playing;
    if (this.playBtn) this.playBtn.textContent = this.playing ? '⏸' : '▶';
    if (this.playing) {
      this.playIntervalId = setInterval(() => {
        if (!this.data || this.currentStep >= this.data.steps.length) {
          this.stop(); return;
        }
        this.currentStep++;
        if (this.scrubber) this.scrubber.value = String(this.currentStep);
        this.updateLabel();
        this.onSeek?.(this.currentStep);
      }, Math.round(300 / this.speed));
    } else {
      if (this.playIntervalId) clearInterval(this.playIntervalId);
    }
  }

  private stop(): void {
    this.playing = false;
    if (this.playBtn) this.playBtn.textContent = '▶';
    if (this.playIntervalId) clearInterval(this.playIntervalId);
  }

  private cycleSpeed(): void {
    const speeds = [0.5, 1, 2, 4];
    const idx = speeds.indexOf(this.speed);
    this.speed = speeds[(idx + 1) % speeds.length];
    if (this.speedBtn) this.speedBtn.textContent = `${this.speed}×`;
    if (this.playing) { this.stop(); this.togglePlay(); }
  }

  private updateLabel(): void {
    if (this.stepLabel && this.data)
      this.stepLabel.textContent = `${this.currentStep}/${this.data.steps.length}`;
  }

  destroy(): void {
    this.stop();
    this.container?.remove();
    this.container = null;
  }

  isActive(): boolean { return this.container !== null; }
}
