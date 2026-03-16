// ─── 游戏内通知系统 In-Game Notification System ──────────────────────────────
// 统一的 Toast 通知、横幅、模态框管理

export type NotifyType = 'info' | 'success' | 'warning' | 'error' | 'achievement' | 'win';

export interface NotifyOptions {
  type?: NotifyType;
  duration?: number;     // ms，0 = 永久
  icon?: string;
  onClick?: () => void;
  position?: 'top' | 'bottom' | 'top-left' | 'top-right';
}

const TYPE_STYLES: Record<NotifyType, { bg: string; border: string; icon: string }> = {
  info:        { bg: '#282a36', border: '#6272a4', icon: 'ℹ️' },
  success:     { bg: '#1a3a1a', border: '#50fa7b', icon: '✅' },
  warning:     { bg: '#3a2a00', border: '#ffd166', icon: '⚠️' },
  error:       { bg: '#3a0a0a', border: '#ff5555', icon: '❌' },
  achievement: { bg: '#2a1a00', border: '#ffd700', icon: '🏅' },
  win:         { bg: '#0a2a1a', border: '#06d6a0', icon: '🎉' },
};

let container: HTMLElement | null = null;
let notifyCount = 0;

function ensureContainer(position: string): HTMLElement {
  if (container) return container;
  container = document.createElement('div');
  container.id = 'notify-container';
  const pos = position.split('-');
  container.style.cssText = [
    'position:fixed', 'z-index:9999',
    'display:flex', 'flex-direction:column', 'gap:8px',
    'padding:12px', 'pointer-events:none',
    pos.includes('bottom') ? 'bottom:0' : 'top:0',
    pos.includes('left') ? 'left:0' : 'right:0',
    'max-width:320px',
  ].join(';');
  document.body.appendChild(container);
  return container;
}

export function notify(
  message: string,
  optionsOrType: NotifyOptions | NotifyType = 'info'
): void {
  const opts: NotifyOptions = typeof optionsOrType === 'string'
    ? { type: optionsOrType } : optionsOrType;
  const { type = 'info', duration = 3000, icon, onClick, position = 'top-right' } = opts;
  const style = TYPE_STYLES[type];
  const c = ensureContainer(position);

  const el = document.createElement('div');
  const id = ++notifyCount;
  el.id = `notify-${id}`;
  el.style.cssText = [
    `background:${style.bg}`, `border:1px solid ${style.border}`,
    'border-radius:8px', 'padding:10px 14px',
    'color:#f8f8f2', 'font-size:0.9em',
    'display:flex', 'align-items:center', 'gap:8px',
    'pointer-events:all', 'cursor:pointer',
    'box-shadow:0 4px 12px rgba(0,0,0,0.4)',
    'transition:all 0.3s ease', 'opacity:0', 'transform:translateX(20px)',
    'max-width:300px', 'word-break:break-word',
  ].join(';');
  el.innerHTML = `<span>${icon ?? style.icon}</span><span>${message}</span>`;

  if (onClick) el.addEventListener('click', onClick);
  el.addEventListener('click', () => remove(el));
  c.appendChild(el);

  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(0)';
  });

  function remove(elem: HTMLElement) {
    elem.style.opacity = '0';
    elem.style.transform = 'translateX(20px)';
    setTimeout(() => elem.remove(), 300);
  }

  if (duration > 0) setTimeout(() => remove(el), duration);
}

export function notifyWin(levelName: string, moves: number, rank: string): void {
  notify(`🎉 通关「${levelName}」！${moves}步 ${rank}`, { type: 'win', duration: 4000 });
}

export function notifyRecord(moves: number): void {
  notify(`🏆 新纪录！${moves}步`, { type: 'achievement', duration: 3000 });
}

export function notifyAchievement(name: string, desc: string): void {
  notify(`🏅 成就解锁：${name} — ${desc}`, { type: 'achievement', duration: 5000 });
}

export function clearAllNotifications(): void {
  container?.querySelectorAll('[id^="notify-"]').forEach(el => el.remove());
}
