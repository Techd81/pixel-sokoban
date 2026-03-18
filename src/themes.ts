// ─── 主题动态过渡系统 Theme Transition ───────────────────────────────────────
export type ThemeName = 'dark' | 'light' | 'rainbow' | 'cyber' | 'forest' | 'ocean' | 'sunset' | 'monochrome';

export interface ThemeConfig {
  name: ThemeName; label: string;
  bg: string; fg: string; accent: string;
  wall: string; floor: string; box: string; goal: string; player: string;
}

export const THEMES: Record<ThemeName, ThemeConfig> = {
  dark:       { name:'dark',       label:'🌙 暗色',  bg:'#17121f', fg:'#f8f8f2', accent:'#8be9fd', wall:'#5c4b73', floor:'#3c3150', box:'#c98f52', goal:'#ffd166', player:'#7ee081' },
  light:      { name:'light',      label:'☀️ 亮色',  bg:'#f8f8f2', fg:'#282a36', accent:'#6272a4', wall:'#6272a4', floor:'#e8e4d0', box:'#b07030', goal:'#f0c040', player:'#50a050' },
  rainbow:    { name:'rainbow',    label:'🌈 彩虹',  bg:'#1a0530', fg:'#ffffff', accent:'#ff79c6', wall:'#7b2d8b', floor:'#2d0a4e', box:'#ff6b6b', goal:'#ffd93d', player:'#6bcb77' },
  cyber:      { name:'cyber',      label:'💜 赛博',  bg:'#0d0d1a', fg:'#00ff41', accent:'#ff00ff', wall:'#1a1a3e', floor:'#0a0a1a', box:'#ff6600', goal:'#00ffff', player:'#ff00ff' },
  forest:     { name:'forest',     label:'🌲 森林',  bg:'#0d1f0d', fg:'#a8d5a2', accent:'#50c878', wall:'#2d4a2d', floor:'#1a3a1a', box:'#8b4513', goal:'#ffd700', player:'#90ee90' },
  ocean:      { name:'ocean',      label:'🌊 海洋',  bg:'#0a1628', fg:'#e0f0ff', accent:'#00b4d8', wall:'#1a3a5c', floor:'#0d2240', box:'#e76f51', goal:'#90e0ef', player:'#48cae4' },
  sunset:     { name:'sunset',     label:'🌅 日落',  bg:'#1a0a00', fg:'#ffe8cc', accent:'#ff6b35', wall:'#4a1a00', floor:'#2a0f00', box:'#c77dff', goal:'#ffd60a', player:'#ff6b35' },
  monochrome: { name:'monochrome', label:'⬜ 单色',  bg:'#111111', fg:'#ffffff', accent:'#888888', wall:'#444444', floor:'#222222', box:'#aaaaaa', goal:'#ffffff', player:'#cccccc' },
};

const TRANSITION_MS = 400;

export function applyTheme(name: ThemeName): void {
  const t = THEMES[name];
  if (!t) return;
  document.documentElement.style.setProperty('--transition-speed', `${TRANSITION_MS}ms`);
  const root = document.documentElement;
  root.dataset.theme = name;
  root.style.setProperty('--bg',     t.bg);
  root.style.setProperty('--text',   t.fg); // CSS使用--text而非--fg
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--wall',   t.wall);
  root.style.setProperty('--wall-deep', t.wall);
  root.style.setProperty('--floor',  t.floor);
  root.style.setProperty('--floor-deep', t.floor);
  root.style.setProperty('--crate',    t.box);
  root.style.setProperty('--crate-top', t.box);
  root.style.setProperty('--crate-deep', t.box);
  root.style.setProperty('--goal',   t.goal);
  root.style.setProperty('--goal-deep', t.goal);
  root.style.setProperty('--player', t.player);
  root.style.setProperty('--player-top', t.player);
  root.style.setProperty('--player-deep', t.player);
  localStorage.setItem('pixelSokobanTheme', name);
}

export function getCurrentTheme(): ThemeName {
  return (localStorage.getItem('pixelSokobanTheme') as ThemeName) || 'dark';
}

export function cycleTheme(): ThemeName {
  const names = Object.keys(THEMES) as ThemeName[];
  const cur = getCurrentTheme();
  const idx = names.indexOf(cur);
  const next = names[(idx + 1) % names.length];
  applyTheme(next);
  return next;
}

export function initThemeButtons(): void {
  document.querySelectorAll<HTMLElement>('[data-theme]').forEach(btn => {
    const theme = btn.dataset.theme as ThemeName;
    if (!THEMES[theme]) return;
    btn.addEventListener('click', () => applyTheme(theme));
  });
  applyTheme(getCurrentTheme());
}
