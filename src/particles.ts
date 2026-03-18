// ─── 粒子特效系统 Particle Effects System ───────────────────────────────────
// 推箱到目标点爆炸、连击光晕、通关彩屑等视觉特效

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;      // 0~1，1=新生，0=死亡
  decay: number;     // 每帧衰减量
  size: number;
  color: string;
  type: 'spark' | 'star' | 'ring' | 'trail';
  rotation: number;
  rotSpeed: number;
}

const COLORS_PUSH   = ['#ffd166', '#ff6b6b', '#f72585', '#ffbe0b'];
const COLORS_GOAL   = ['#06d6a0', '#8be9fd', '#50fa7b', '#00b4d8'];
const COLORS_COMBO  = ['#ff79c6', '#bd93f9', '#ff5555', '#ffb86c'];
const COLORS_WIN    = ['#ffd700', '#ff69b4', '#00fa9a', '#87ceeb', '#ff6347'];

let particles: Particle[] = [];
let rafId: number | null = null;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

function ensureCanvas(): void {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.id = 'particle-canvas';
  canvas.style.cssText = [
    'position:fixed', 'top:0', 'left:0',
    'width:100vw', 'height:100vh',
    'pointer-events:none', 'z-index:9998',
  ].join(';');
  document.body.appendChild(canvas);
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas(): void {
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function spawnParticles(
  x: number, y: number,
  count: number,
  colors: string[],
  type: Particle['type'],
  speedMult = 1,
): void {
  if (document.body.classList.contains('low-fx')) return;
  ensureCanvas();
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = (2 + Math.random() * 4) * speedMult;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 2,
      life: 1,
      decay: 0.02 + Math.random() * 0.03,
      size: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      type,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
    });
  }
  if (rafId === null) loop();
}

function loop(): void {
  if (!canvas || !ctx) {
    ctx = canvas?.getContext('2d') ?? null;
  }
  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 原地 swap 删除死亡粒子，避免 filter 每帧创建新数组
  let i = particles.length - 1;
  while (i >= 0) {
    if (particles[i].life <= 0) {
      particles[i] = particles[particles.length - 1];
      particles.pop();
    }
    i--;
  }

  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    if (p.type === 'star') {
      ctx.fillStyle = p.color;
      drawStar(ctx, 0, 0, p.size, p.size / 2, 5);
    } else if (p.type === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * (2 - p.life), 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += 0.15; // gravity
    p.life -= p.decay;
    p.rotation += p.rotSpeed;
    p.vx *= 0.98;
  }

  if (particles.length > 0) {
    rafId = requestAnimationFrame(loop);
  } else {
    rafId = null;
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  outerR: number, innerR: number,
  points: number,
): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    i === 0
      ? ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
      : ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();
}

/** 获取 DOM 元素的屏幕中心坐标 */
export function getElementCenter(el: Element): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// ─── 公共特效 API ─────────────────────────────────────────────────────────────

/** 推箱子到目标点时的爆炸特效 */
export function emitGoalExplosion(x: number, y: number): void {
  spawnParticles(x, y, 20, COLORS_GOAL, 'star', 1.2);
  spawnParticles(x, y, 8,  COLORS_GOAL, 'ring', 0.5);
}

/** 推箱子（未到目标）时的小火花 */
export function emitPushSpark(x: number, y: number): void {
  spawnParticles(x, y, 8, COLORS_PUSH, 'spark', 0.8);
}

/** 连击特效 */
export function emitCombo(x: number, y: number, count: number): void {
  const mult = Math.min(count / 3, 3);
  spawnParticles(x, y, Math.floor(12 * mult), COLORS_COMBO, 'star', 1.5 * mult);
}

/** 通关全屏彩屑 */
export function emitWinBurst(): void {
  const W = window.innerWidth;
  const H = window.innerHeight;
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      spawnParticles(W * Math.random(), H * 0.3, 30, COLORS_WIN, 'star', 2);
      spawnParticles(W * Math.random(), H * 0.5, 20, COLORS_WIN, 'spark', 1.5);
    }, i * 150);
  }
}

/** 移动轨迹残影 */
export function emitTrail(x: number, y: number, color = '#8be9fd'): void {
  spawnParticles(x, y, 3, [color], 'trail', 0.3);
}
