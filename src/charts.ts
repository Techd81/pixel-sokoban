// ─── 统计图表系统 Stats Charts ───────────────────────────────────────────────
import type { Records } from './types';
import { LEVELS } from './levels';

export function drawBarChart(
  canvas: HTMLCanvasElement,
  data: number[], labels: string[],
  options: { title?: string; color?: string; maxVal?: number } = {}
): void {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const { title = '', color = '#8be9fd', maxVal } = options;
  const W = canvas.width, H = canvas.height;
  const PAD = { top: 30, right: 10, bottom: 40, left: 45 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const max = maxVal ?? (data.length > 0 ? data.reduce((a,b)=>Math.max(a,b), 0) : 0) || 1;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#17121f'; ctx.fillRect(0, 0, W, H);
  if (title) {
    ctx.fillStyle = '#f8f8f2'; ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center'; ctx.fillText(title, W / 2, 18);
  }
  // grid lines
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = PAD.top + chartH - (i / 4) * chartH;
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + chartW, y); ctx.stroke();
    ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.textAlign = 'right';
    ctx.fillText(String(Math.round(max * i / 4)), PAD.left - 3, y + 4);
  }
  // bars
  const bw = Math.max(2, chartW / data.length - 2);
  data.forEach((v, i) => {
    const bh = (v / max) * chartH;
    const x = PAD.left + i * (chartW / data.length) + 1;
    const y = PAD.top + chartH - bh;
    ctx.fillStyle = color; ctx.fillRect(x, y, bw, bh);
    if (labels[i] && data.length <= 20) {
      ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
      ctx.fillText(labels[i].slice(0, 4), x + bw / 2, PAD.top + chartH + 12);
    }
  });
}

export function drawLineChart(
  canvas: HTMLCanvasElement,
  data: number[], labels: string[],
  options: { title?: string; color?: string } = {}
): void {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const { title = '', color = '#ff79c6' } = options;
  const W = canvas.width, H = canvas.height;
  const PAD = { top: 30, right: 10, bottom: 40, left: 45 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const max = (data.length > 0 ? data.reduce((a,b)=>Math.max(a,b), 0) : 0) || 1;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#17121f'; ctx.fillRect(0, 0, W, H);
  if (title) {
    ctx.fillStyle = '#f8f8f2'; ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center'; ctx.fillText(title, W / 2, 18);
  }
  // gradient fill
  const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + chartH);
  grad.addColorStop(0, color + '88'); grad.addColorStop(1, color + '00');
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = PAD.left + (i / (data.length - 1)) * chartW;
    const y = PAD.top + chartH - (v / max) * chartH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(PAD.left + chartW, PAD.top + chartH);
  ctx.lineTo(PAD.left, PAD.top + chartH);
  ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
  // line
  ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
  data.forEach((v, i) => {
    const x = PAD.left + (i / (data.length - 1)) * chartW;
    const y = PAD.top + chartH - (v / max) * chartH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
}

export function buildProgressData(records: Records): { moves: number[]; labels: string[] } {
  const moves: number[] = []; const labels: string[] = [];
  LEVELS.forEach((l, i) => {
    const r = records[i];
    if (r?.bestMoves) { moves.push(r.bestMoves); labels.push(`L${i+1}`); }
  });
  return { moves, labels };
}
