// ─── 音乐可视化器 Audio Visualizer ──────────────────────────────────────────
// 将 BGM 频谱实时可视化为游戏板背景动态波形

export class AudioVisualizer {
  private analyser: AnalyserNode | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private rafId: number | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private active = false;

  connect(audioCtx: AudioContext, sourceNode: AudioNode): void {
    this.analyser = audioCtx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.8;
    sourceNode.connect(this.analyser);
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
  }

  attachCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  start(): void {
    if (this.active || !this.analyser || !this.canvas || !this.ctx) return;
    this.active = true;
    this.loop();
  }

  stop(): void {
    this.active = false;
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    if (this.ctx && this.canvas)
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private loop(): void {
    if (!this.active || !this.analyser || !this.ctx || !this.canvas || !this.dataArray) return;
    this.rafId = requestAnimationFrame(() => this.loop());
    this.analyser.getByteFrequencyData(this.dataArray);
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    const bars = this.dataArray.length;
    const barW = width / bars;
    for (let i = 0; i < bars; i++) {
      const v = this.dataArray[i] / 255;
      const barH = v * height * 0.6;
      const hue = 200 + v * 60;
      this.ctx.fillStyle = `hsla(${hue},80%,60%,${0.3 + v * 0.4})`;
      this.ctx.fillRect(i * barW, height - barH, barW - 1, barH);
    }
  }
}

export const audioVisualizer = new AudioVisualizer();
