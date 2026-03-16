// ─── 关卡难度曲线分析 Difficulty Curve Analyzer ──────────────────────────────
import { LEVELS } from './levels';
import { predictDifficulty } from './difficulty';

export interface CurveAnalysis {
  scores: number[];
  smoothness: number;
  spikes: number[];
  valleys: number[];
  trend: 'rising' | 'flat' | 'mixed';
  recommendations: string[];
}

export function analyzeDifficultyCurve(): CurveAnalysis {
  const scores = LEVELS.map(l => predictDifficulty(l).score);
  const n = scores.length;
  let totalDelta = 0;
  const deltas: number[] = [];
  for (let i = 1; i < n; i++) {
    const d = Math.abs(scores[i] - scores[i-1]);
    deltas.push(d); totalDelta += d;
  }
  const avgDelta = totalDelta / (n-1);
  const variance = deltas.reduce((s,d) => s+(d-avgDelta)**2, 0) / deltas.length;
  const smoothness = Math.max(0, 1 - Math.sqrt(variance)/50);
  const spikes = deltas.map((d,i) => d > avgDelta*2 ? i+1 : -1).filter(i=>i>=0);
  const valleys = deltas.map((d,i) => scores[i+1] < scores[i]-15 ? i+1 : -1).filter(i=>i>=0);
  const half = Math.floor(n/2);
  const firstHalf = scores.slice(0,half).reduce((s,v)=>s+v,0)/half;
  const secondHalf = scores.slice(half).reduce((s,v)=>s+v,0)/(n-half);
  const trend: CurveAnalysis['trend'] = secondHalf > firstHalf+10 ? 'rising' : Math.abs(secondHalf-firstHalf)<10 ? 'flat' : 'mixed';
  const recommendations: string[] = [];
  if (smoothness < 0.5) recommendations.push('难度曲线波动较大，建议重新排列部分关卡');
  if (spikes.length > 5) recommendations.push(`发现${spikes.length}个难度突变点`);
  if (trend === 'flat') recommendations.push('整体难度较平，后期关卡可适当加难');
  return { scores, smoothness, spikes, valleys, trend, recommendations };
}

export function renderCurveChart(canvas: HTMLCanvasElement): void {
  const analysis = analyzeDifficultyCurve();
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  const PAD = { top:20, right:10, bottom:30, left:35 };
  const cW = W-PAD.left-PAD.right, cH = H-PAD.top-PAD.bottom;
  const max = Math.max(...analysis.scores, 1);
  ctx.fillStyle='#17121f'; ctx.fillRect(0,0,W,H);
  const grad = ctx.createLinearGradient(0,PAD.top,0,PAD.top+cH);
  grad.addColorStop(0,'#ff6b6b88'); grad.addColorStop(1,'#ff6b6b00');
  ctx.beginPath();
  analysis.scores.forEach((s,i) => {
    const x = PAD.left + (i/(analysis.scores.length-1))*cW;
    const y = PAD.top + cH - (s/max)*cH;
    i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.lineTo(PAD.left+cW, PAD.top+cH); ctx.lineTo(PAD.left, PAD.top+cH);
  ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
  ctx.beginPath(); ctx.strokeStyle='#ff6b6b'; ctx.lineWidth=2;
  analysis.scores.forEach((s,i) => {
    const x = PAD.left + (i/(analysis.scores.length-1))*cW;
    const y = PAD.top + cH - (s/max)*cH;
    i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.stroke();
  analysis.spikes.forEach(idx => {
    const x = PAD.left + (idx/(analysis.scores.length-1))*cW;
    const y = PAD.top + cH - (analysis.scores[idx]/max)*cH;
    ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2);
    ctx.fillStyle='#ffd166'; ctx.fill();
  });
}
