// ─── 高级动画系统 Advanced Animation System ─────────────────────────────────
// easing函数库、序列动画、CSS关键帧注入

export type EasingFn = (t: number) => number;

export const Easing = {
  linear:     (t: number) => t,
  easeIn:     (t: number) => t * t,
  easeOut:    (t: number) => 1 - (1 - t) ** 2,
  easeInOut:  (t: number) => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2,
  bounce:     (t: number) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1/d1) return n1*t*t;
    else if (t < 2/d1) return n1*(t-=1.5/d1)*t+0.75;
    else if (t < 2.5/d1) return n1*(t-=2.25/d1)*t+0.9375;
    else return n1*(t-=2.625/d1)*t+0.984375;
  },
  elastic:    (t: number) => t === 0 ? 0 : t === 1 ? 1 :
    -(2 ** (10*t-10)) * Math.sin((t*10-10.75) * (2*Math.PI)/3),
  spring:     (t: number) => 1 - Math.cos(t * Math.PI * 4) * (1 - t),
} as const;

export interface AnimationOptions {
  duration: number;       // ms
  easing?: EasingFn;
  delay?: number;
  onUpdate: (progress: number) => void;
  onComplete?: () => void;
}

export function animate(opts: AnimationOptions): () => void {
  const { duration, easing = Easing.easeOut, delay = 0, onUpdate, onComplete } = opts;
  let startTime: number | null = null;
  let rafId: number;
  let cancelled = false;

  function frame(now: number) {
    if (cancelled) return;
    if (!startTime) startTime = now + delay;
    const elapsed = now - startTime;
    if (elapsed < 0) { rafId = requestAnimationFrame(frame); return; }
    const t = Math.min(1, elapsed / duration);
    onUpdate(easing(t));
    if (t < 1) rafId = requestAnimationFrame(frame);
    else onComplete?.();
  }

  rafId = requestAnimationFrame(frame);
  return () => { cancelled = true; cancelAnimationFrame(rafId); };
}

export function animateValue(
  from: number, to: number,
  opts: Omit<AnimationOptions, 'onUpdate'> & { onUpdate: (v: number) => void }
): () => void {
  return animate({ ...opts, onUpdate: (p) => opts.onUpdate(from + (to - from) * p) });
}

export function fadeIn(el: HTMLElement, durationMs = 300): void {
  el.style.opacity = '0'; el.style.display = '';
  animate({ duration: durationMs, onUpdate: p => { el.style.opacity = String(p); } });
}

export function fadeOut(el: HTMLElement, durationMs = 300, remove = false): void {
  animate({ duration: durationMs, onUpdate: p => { el.style.opacity = String(1 - p); },
    onComplete: () => { if (remove) el.remove(); else el.style.display = 'none'; } });
}

export function slideIn(el: HTMLElement, dir: 'up'|'down'|'left'|'right' = 'up', durationMs = 300): void {
  const offsets = { up:'0,30px', down:'0,-30px', left:'30px,0', right:'-30px,0' };
  el.style.opacity = '0'; el.style.transform = `translate(${offsets[dir]})`;
  el.style.display = '';
  animate({ duration: durationMs, easing: Easing.easeOut,
    onUpdate: p => { el.style.opacity = String(p); el.style.transform = `translate(${offsets[dir].split(',').map(v => `calc(${v} * ${1-p})`).join(',')})`; }
  });
}
