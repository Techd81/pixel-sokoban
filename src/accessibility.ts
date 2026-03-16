// ─── 无障碍辅助系统 Accessibility System ────────────────────────────────────
export type ColorBlindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'monochrome';

const COLOR_FILTERS: Record<ColorBlindMode, string> = {
  none: '',
  deuteranopia: 'matrix(0.625 0.375 0 0 0 0.700 0.300 0 0 0 0 0.300 0.700 0 0 0 0 0 1 0)',
  protanopia:   'matrix(0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0)',
  tritanopia:   'matrix(0.950 0.050 0 0 0 0     0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0)',
  monochrome:   'saturate(0)',
};

let currentMode: ColorBlindMode = 'none';

export function setColorBlindMode(mode: ColorBlindMode): void {
  currentMode = mode;
  localStorage.setItem('sokoban_a11y_cbm', mode);
  const filter = COLOR_FILTERS[mode];
  document.documentElement.style.filter = filter ? `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><filter id='f'><feColorMatrix type='${mode === 'monochrome' ? 'saturate' : 'matrix'}' values='${filter.replace('saturate(0)', '0').replace('matrix(', '').replace(')', '')}'/></filter></svg>#f")` : '';
  document.body.dataset.cbMode = mode;
}

export function getColorBlindMode(): ColorBlindMode { return currentMode; }

export function initAccessibility(): void {
  const saved = localStorage.getItem('sokoban_a11y_cbm') as ColorBlindMode | null;
  if (saved && saved !== 'none') setColorBlindMode(saved);
  injectHighContrastToggle();
  initScreenReaderAnnouncer();
}

function injectHighContrastToggle(): void {
  const btn = document.getElementById('highContrastBtn');
  if (!btn) return;
  const stored = localStorage.getItem('sokoban_a11y_hc') === '1';
  if (stored) document.body.classList.add('high-contrast');
  btn.addEventListener('click', () => {
    const on = document.body.classList.toggle('high-contrast');
    localStorage.setItem('sokoban_a11y_hc', on ? '1' : '0');
  });
}

let announcer: HTMLElement | null = null;
export function announce(text: string): void {
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden';
    document.body.appendChild(announcer);
  }
  announcer.textContent = '';
  requestAnimationFrame(() => { if (announcer) announcer.textContent = text; });
}

function initScreenReaderAnnouncer(): void {
  // 将关键游戏事件通知屏幕阅读器
  document.addEventListener('keydown', (e) => {
    const moveMap: Record<string, string> = {
      ArrowUp: '向上', ArrowDown: '向下', ArrowLeft: '向左', ArrowRight: '向右',
      w: '向上', s: '向下', a: '向左', d: '向右',
    };
    if (moveMap[e.key]) announce(`移动${moveMap[e.key]}`);
  });
}
