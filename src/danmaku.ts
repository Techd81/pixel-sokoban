// ─── 弹幕/实时评论系统 Danmaku System ────────────────────────────────────────
// 通关时显示飘过的弹幕评论，增加游戏趣味性

export interface DanmakuMessage {
  text: string;
  color: string;
  speed: number;    // px/s
  y: number;        // 垂直位置
  x: number;        // 当前水平位置
  opacity: number;
  fontSize: number;
}

const PRESET_MESSAGES = [
  '太厉害了！', '完美通关！', '推箱子大师！', '一气呵成！',
  '666666！', '好棒！', '神操作！', '完美！', '厉害厉害！',
  '继续加油！', '下一关更难哦~', '推箱子天才！', 'PERFECT!',
  '三星达成！', '新纪录！', '速通模式启动！', '无敌了！',
];

const COLORS = ['#ff79c6','#8be9fd','#50fa7b','#ffd166','#ffb86c','#bd93f9','#ff6b6b'];

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let messages: DanmakuMessage[] = [];
let rafId: number | null = null;
let lastTime = 0;

function ensureCanvas(): void {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1000';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  window.addEventListener('resize', () => {
    if (canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  });
}

function loop(now: number): void {
  if (!ctx || !canvas || messages.length === 0) { rafId = null; return; }
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  messages = messages.filter(m => m.x + 300 > 0 && m.opacity > 0.01);
  for (const m of messages) {
    m.x -= m.speed * dt;
    if (m.x < -200) m.opacity -= dt * 2;
    ctx.globalAlpha = m.opacity;
    ctx.font = `bold ${m.fontSize}px sans-serif`;
    ctx.fillStyle = m.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeText(m.text, m.x, m.y);
    ctx.fillText(m.text, m.x, m.y);
  }
  ctx.globalAlpha = 1;
  rafId = requestAnimationFrame(loop);
}

export function sendDanmaku(text?: string): void {
  ensureCanvas();
  if (!canvas) return;
  const msg = text || PRESET_MESSAGES[Math.floor(Math.random() * PRESET_MESSAGES.length)];
  messages.push({
    text: msg,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    speed: 80 + Math.random() * 120,
    y: 60 + Math.random() * (canvas.height - 120),
    x: canvas.width + 10,
    opacity: 1,
    fontSize: 16 + Math.floor(Math.random() * 12),
  });
  if (!rafId) { lastTime = performance.now(); rafId = requestAnimationFrame(loop); }
}

export function sendWinDanmaku(rank: string): void {
  const count = rank === '★★★' ? 8 : rank === '★★' ? 5 : 3;
  for (let i = 0; i < count; i++) {
    setTimeout(() => sendDanmaku(), i * 200);
  }
}

export function clearDanmaku(): void {
  messages = [];
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
}
