// ─── AI 求解路径可视化 AI Solver Visualization ───────────────────────────────
// 逐步高亮路径、箱子轨迹热力图、最优解回放动画

import type { Pos } from './types';
import { TILE } from './types';

export interface SolveVizStep {
  playerPos: Pos;
  boxPositions: Pos[];
  pushCount: number;
  isBoxPush: boolean;
}

// ─── 热力图：记录每格被经过的次数 ────────────────────────────────────────────

export class HeatMap {
  private grid: Map<string, number> = new Map();
  private maxVal = 0;

  record(x: number, y: number, weight = 1): void {
    const k = `${x},${y}`;
    const v = (this.grid.get(k) ?? 0) + weight;
    this.grid.set(k, v);
    if (v > this.maxVal) this.maxVal = v;
  }

  get(x: number, y: number): number {
    return this.grid.get(`${x},${y}`) ?? 0;
  }

  getNormalized(x: number, y: number): number {
    if (this.maxVal === 0) return 0;
    return this.get(x, y) / this.maxVal;
  }

  clear(): void { this.grid.clear(); this.maxVal = 0; }
}

// ─── 解法路径可视化渲染器 ─────────────────────────────────────────────────────

export class SolverVisualizer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private heatMap = new HeatMap();
  private steps: SolveVizStep[] = [];
  private currentStep = 0;
  private playbackId: ReturnType<typeof setInterval> | null = null;
  private tileSize = 48;

  attach(board: HTMLElement): void {
    this.detach();
    const canvas = document.createElement('canvas');
    canvas.id = 'solverVizCanvas';
    canvas.style.cssText = [
      'position:absolute', 'top:0', 'left:0',
      'width:100%', 'height:100%',
      'pointer-events:none', 'z-index:10',
      'border-radius:inherit'
    ].join(';');
    const parent = board.parentElement ?? board;
    parent.style.position = 'relative';
    parent.appendChild(canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize(board);
  }

  private resize(board: HTMLElement): void {
    if (!this.canvas) return;
    const rect = board.getBoundingClientRect();
    this.canvas.width = rect.width || 400;
    this.canvas.height = rect.height || 400;
    const cols = Math.max(...(board.style.gridTemplateColumns
      .match(/\d+/g) || ['8'])
      .map(Number));
    this.tileSize = (rect.width || 400) / cols;
  }

  detach(): void {
    this.stopPlayback();
    this.canvas?.remove();
    this.canvas = null;
    this.ctx = null;
  }

  loadSteps(steps: SolveVizStep[]): void {
    this.steps = steps;
    this.currentStep = 0;
    this.heatMap.clear();
    // 建立热力图
    steps.forEach(s => {
      this.heatMap.record(s.playerPos.x, s.playerPos.y);
      s.boxPositions.forEach(b => this.heatMap.record(b.x, b.y, 2));
    });
  }

  drawHeatMap(rows: number, cols: number): void {
    const { ctx, canvas, tileSize } = this;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const v = this.heatMap.getNormalized(x, y);
        if (v < 0.01) continue;
        ctx.fillStyle = `rgba(139,233,253,${v * 0.5})`;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }

  drawStep(stepIndex: number): void {
    const { ctx, canvas, tileSize } = this;
    if (!ctx || !canvas || !this.steps[stepIndex]) return;
    const step = this.steps[stepIndex];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 玩家位置：绿色光晕
    const px = step.playerPos.x * tileSize + tileSize / 2;
    const py = step.playerPos.y * tileSize + tileSize / 2;
    const grad = ctx.createRadialGradient(px, py, 2, px, py, tileSize * 0.7);
    grad.addColorStop(0, 'rgba(80,250,123,0.8)');
    grad.addColorStop(1, 'rgba(80,250,123,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, tileSize * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // 箱子位置：橙色边框
    step.boxPositions.forEach(b => {
      ctx.strokeStyle = step.isBoxPush ? '#ffb86c' : '#6272a4';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        b.x * tileSize + 3, b.y * tileSize + 3,
        tileSize - 6, tileSize - 6
      );
    });

    // 步骤计数器
    ctx.fillStyle = 'rgba(248,248,242,0.9)';
    ctx.font = `bold ${Math.round(tileSize * 0.3)}px monospace`;
    ctx.fillText(`${stepIndex + 1}/${this.steps.length}`, 8, tileSize * 0.4);
  }

  startPlayback(intervalMs = 200, onDone?: () => void): void {
    this.stopPlayback();
    this.currentStep = 0;
    this.playbackId = setInterval(() => {
      this.drawStep(this.currentStep);
      this.currentStep++;
      if (this.currentStep >= this.steps.length) {
        this.stopPlayback();
        onDone?.();
      }
    }, intervalMs);
  }

  stopPlayback(): void {
    if (this.playbackId !== null) {
      clearInterval(this.playbackId);
      this.playbackId = null;
    }
  }

  clear(): void {
    const { ctx, canvas } = this;
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

export const solverVisualizer = new SolverVisualizer();
