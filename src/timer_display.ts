// ─── 计时器显示组件 Timer Display ────────────────────────────────────────────
export type TimerMode = 'stopwatch' | 'countdown' | 'split';

export interface TimerDisplayOptions {
  mode?: TimerMode;
  countdownMs?: number;
  onExpire?: () => void;
  format?: 'compact' | 'full' | 'ms';
}

export function formatTime(ms: number, fmt: 'compact'|'full'|'ms' = 'compact'): string {
  if (fmt === 'ms') return ms.toFixed(0) + 'ms';
  const totalS = Math.floor(ms / 1000);
  const min = Math.floor(totalS / 60);
  const sec = totalS % 60;
  const centis = Math.floor((ms % 1000) / 10);
  if (fmt === 'full') return `${min}:${String(sec).padStart(2,'0')}.${String(centis).padStart(2,'0')}`;
  return min > 0 ? `${min}m${String(sec).padStart(2,'0')}s` : `${sec}.${String(centis).padStart(2,'0')}s`;
}

export class TimerDisplay {
  private el: HTMLElement | null = null;
  private startMs = 0;
  private elapsedMs = 0;
  private running = false;
  private rafId: number | null = null;
  private opts: TimerDisplayOptions;

  constructor(opts: TimerDisplayOptions = {}) { this.opts = opts; }

  attach(el: HTMLElement): void { this.el = el; }

  start(): void {
    this.startMs = performance.now() - this.elapsedMs;
    this.running = true;
    this.tick();
  }

  stop(): void { this.running = false; if (this.rafId) cancelAnimationFrame(this.rafId); }

  reset(): void { this.stop(); this.elapsedMs = 0; this.render(0); }

  getElapsed(): number { return this.elapsedMs; }

  private tick(): void {
    if (!this.running) return;
    this.elapsedMs = performance.now() - this.startMs;
    const displayMs = this.opts.mode === 'countdown'
      ? Math.max(0, (this.opts.countdownMs||0) - this.elapsedMs)
      : this.elapsedMs;
    this.render(displayMs);
    if (this.opts.mode === 'countdown' && displayMs <= 0) {
      this.stop(); this.opts.onExpire?.(); return;
    }
    this.rafId = requestAnimationFrame(() => this.tick());
  }

  private render(ms: number): void {
    if (this.el) this.el.textContent = formatTime(ms, this.opts.format);
  }
}
