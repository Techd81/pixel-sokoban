// ─── 触摸手势识别系统 Touch Gesture System ───────────────────────────────────
export type GestureType = 'swipe-up' | 'swipe-down' | 'swipe-left' | 'swipe-right'
  | 'pinch-in' | 'pinch-out' | 'tap' | 'double-tap' | 'long-press';

export interface GestureEvent {
  type: GestureType;
  startX: number; startY: number;
  endX: number;   endY: number;
  deltaX: number; deltaY: number;
  duration: number;
  scale?: number;
}

type GestureHandler = (e: GestureEvent) => void;

export class GestureRecognizer {
  private handlers: Map<GestureType, GestureHandler[]> = new Map();
  private touches: Touch[] = [];
  private startTime = 0;
  private startTouches: Touch[] = [];
  private longPressId: ReturnType<typeof setTimeout> | null = null;
  private lastTapTime = 0;
  private disposed = false;

  constructor(private el: HTMLElement, private options = { swipeThreshold: 30, longPressMs: 500 }) {
    this.el.addEventListener('touchstart',  this.onStart.bind(this),  { passive: false });
    this.el.addEventListener('touchmove',   this.onMove.bind(this),   { passive: false });
    this.el.addEventListener('touchend',    this.onEnd.bind(this),    { passive: false });
    this.el.addEventListener('touchcancel', this.onCancel.bind(this), { passive: false });
  }

  on(type: GestureType, handler: GestureHandler): this {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type)!.push(handler); return this;
  }

  private emit(type: GestureType, e: GestureEvent): void {
    this.handlers.get(type)?.forEach(h => h(e));
  }

  private onStart(e: TouchEvent): void {
    this.startTime = performance.now();
    this.startTouches = [...e.touches] as unknown as Touch[];
    this.touches = [...e.touches] as unknown as Touch[];
    if (e.touches.length === 1) {
      this.longPressId = setTimeout(() => {
        const t = e.touches[0];
        this.emit('long-press', { type:'long-press', startX:t.clientX, startY:t.clientY, endX:t.clientX, endY:t.clientY, deltaX:0, deltaY:0, duration: this.options.longPressMs });
      }, this.options.longPressMs);
    }
  }

  private onMove(e: TouchEvent): void {
    this.touches = [...e.touches] as unknown as Touch[];
    if (e.touches.length === 1 && this.longPressId) {
      const t = e.touches[0], s = this.startTouches[0];
      if (Math.hypot(t.clientX - s.clientX, t.clientY - s.clientY) > 10) {
        clearTimeout(this.longPressId); this.longPressId = null;
      }
    }
  }

  private onEnd(e: TouchEvent): void {
    if (this.longPressId) { clearTimeout(this.longPressId); this.longPressId = null; }
    const duration = performance.now() - this.startTime;
    if (this.startTouches.length === 1 && e.changedTouches.length === 1) {
      const s = this.startTouches[0], t = e.changedTouches[0];
      const dx = t.clientX - s.clientX, dy = t.clientY - s.clientY;
      const dist = Math.hypot(dx, dy);
      if (dist < 10 && duration < 300) {
        const now = performance.now();
        if (now - this.lastTapTime < 300) { this.emit('double-tap', { type:'double-tap', startX:s.clientX, startY:s.clientY, endX:t.clientX, endY:t.clientY, deltaX:dx, deltaY:dy, duration }); }
        else this.emit('tap', { type:'tap', startX:s.clientX, startY:s.clientY, endX:t.clientX, endY:t.clientY, deltaX:dx, deltaY:dy, duration });
        this.lastTapTime = now;
      } else if (dist >= this.options.swipeThreshold) {
        const type: GestureType = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? 'swipe-right' : 'swipe-left')
          : (dy > 0 ? 'swipe-down' : 'swipe-up');
        this.emit(type, { type, startX:s.clientX, startY:s.clientY, endX:t.clientX, endY:t.clientY, deltaX:dx, deltaY:dy, duration });
      }
    } else if (this.startTouches.length === 2 && e.touches.length === 0) {
      const s1=this.startTouches[0], s2=this.startTouches[1];
      const t1=e.changedTouches[0], t2=e.changedTouches[1] || e.changedTouches[0];
      const startDist = Math.hypot(s2.clientX-s1.clientX, s2.clientY-s1.clientY);
      const endDist = Math.hypot(t2.clientX-t1.clientX, t2.clientY-t1.clientY);
      const scale = endDist / (startDist || 1);
      const type: GestureType = scale < 0.8 ? 'pinch-in' : 'pinch-out';
      this.emit(type, { type, startX:s1.clientX, startY:s1.clientY, endX:t1.clientX, endY:t1.clientY, deltaX:0, deltaY:0, duration, scale });
    }
  }

  private onCancel(): void {
    if (this.longPressId) { clearTimeout(this.longPressId); this.longPressId = null; }
  }

  dispose(): void {
    if (this.disposed) return; this.disposed = true;
    this.el.removeEventListener('touchstart',  this.onStart.bind(this));
    this.el.removeEventListener('touchmove',   this.onMove.bind(this));
    this.el.removeEventListener('touchend',    this.onEnd.bind(this));
    this.el.removeEventListener('touchcancel', this.onCancel.bind(this));
  }
}
