// ─── 触觉反馈系统 Haptic Feedback ───────────────────────────────────────────
// 在移动端提供振动反馈，增强推箱子的触感体验

export type HapticPattern = 'move' | 'push' | 'win' | 'fail' | 'undo' | 'combo' | 'achievement';

const PATTERNS: Record<HapticPattern, VibratePattern> = {
  move:        10,
  push:        [20, 10, 20],
  win:         [50, 30, 100, 30, 200],
  fail:        [30, 20, 30],
  undo:        15,
  combo:       [15, 10, 15, 10, 30],
  achievement: [100, 50, 100, 50, 300],
};

let enabled = true;

export function initHaptics(): void {
  const saved = localStorage.getItem('sokoban_haptic');
  enabled = saved !== '0';
}

export function setHapticsEnabled(on: boolean): void {
  enabled = on;
  localStorage.setItem('sokoban_haptic', on ? '1' : '0');
}

export function isHapticsEnabled(): boolean { return enabled; }

export function haptic(pattern: HapticPattern): void {
  if (!enabled) return;
  if (!navigator.vibrate) return;
  try { navigator.vibrate(PATTERNS[pattern]); } catch { }
}

export function hapticCustom(pattern: VibratePattern): void {
  if (!enabled || !navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch { }
}
