// ─── 性能监控 Performance Monitor ───────────────────────────────────────────
// FPS计数器、帧时间、内存使用监控

export interface PerfSnapshot {
  fps: number;
  frameTimeMs: number;
  heapUsedMB: number;
  heapTotalMB: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private frames: number[] = [];
  private lastTime = 0;
  private rafId: number | null = null;
  private visible = false;
  private el: HTMLElement | null = null;
  private snapshots: PerfSnapshot[] = [];

  start(): void {
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  }

  private loop(): void {
    this.rafId = requestAnimationFrame((now) => {
      const delta = now - this.lastTime;
      this.lastTime = now;
      this.frames.push(delta);
      if (this.frames.length > 60) this.frames.shift();
      if (this.visible) this.updateDisplay();
      this.loop();
    });
  }

  getSnapshot(): PerfSnapshot {
    const avgFrame = this.frames.length
      ? this.frames.reduce((a, b) => a + b, 0) / this.frames.length
      : 16.67;
    const mem = (performance as any).memory;
    return {
      fps: Math.round(1000 / avgFrame),
      frameTimeMs: Math.round(avgFrame * 10) / 10,
      heapUsedMB: mem ? Math.round(mem.usedJSHeapSize / 1048576) : 0,
      heapTotalMB: mem ? Math.round(mem.totalJSHeapSize / 1048576) : 0,
      timestamp: Date.now(),
    };
  }

  toggleDisplay(): void {
    this.visible = !this.visible;
    if (this.visible) this.showDisplay();
    else this.hideDisplay();
  }

  private showDisplay(): void {
    if (!this.el) {
      this.el = document.createElement('div');
      this.el.style.cssText = 'position:fixed;top:4px;right:4px;background:#000a;color:#0f0;font:11px monospace;padding:4px 8px;border-radius:4px;z-index:99999;pointer-events:none;line-height:1.4';
      document.body.appendChild(this.el);
    }
    this.el.style.display = 'block';
  }

  private hideDisplay(): void {
    if (this.el) this.el.style.display = 'none';
  }

  private updateDisplay(): void {
    if (!this.el) return;
    const s = this.getSnapshot();
    this.el.innerHTML = `FPS: ${s.fps}<br>Frame: ${s.frameTimeMs}ms${s.heapUsedMB ? `<br>Heap: ${s.heapUsedMB}/${s.heapTotalMB}MB` : ''}`;
  }
}

export const perfMonitor = new PerformanceMonitor();
