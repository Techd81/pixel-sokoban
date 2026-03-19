// ─── 成就徽章 SVG 动画系统 Achievement Badge Animations ─────────────────────
// 成就解锁时生成 SVG 动画徽章，带光晕和粒子效果

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;  // emoji or SVG path
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  condition: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_clear',    name: '初出茅庐', desc: '通关第一个关卡',        icon: '🎯', tier: 'bronze',   condition: 'cleared >= 1' },
  { id: 'ten_clear',      name: '十关老手', desc: '通关10个关卡',         icon: '💪', tier: 'bronze',   condition: 'cleared >= 10' },
  { id: 'half_clear',     name: '半程勇士', desc: '通关35个关卡',         icon: '🗺️', tier: 'silver',   condition: 'cleared >= 35' },
  { id: 'all_clear',      name: '推箱传说', desc: '通关全部70个关卡',     icon: '👑', tier: 'gold',     condition: 'cleared >= 70' },
  { id: 'first_star3',    name: '完美执行', desc: '首次三星通关',          icon: '⭐', tier: 'bronze',   condition: 'stars3 >= 1' },
  { id: 'ten_star3',      name: '三星达人', desc: '10个关卡三星通关',      icon: '🌟', tier: 'silver',   condition: 'stars3 >= 10' },
  { id: 'all_star3',      name: '满天繁星', desc: '所有关卡三星通关',      icon: '✨', tier: 'platinum', condition: 'stars3 >= 70' },
  { id: 'speedrun',       name: '风驰电掣', desc: '3分钟内速通5关',        icon: '⚡', tier: 'gold',     condition: 'ta_cleared >= 5' },
  { id: 'no_hint',        name: '独立自主', desc: '不用提示通关10关',      icon: '🧠', tier: 'silver',   condition: 'no_hint_clears >= 10' },
  { id: 'combo_master',   name: '连击大师', desc: '达成5连击',             icon: '🔥', tier: 'silver',   condition: 'max_combo >= 5' },
  { id: 'ghost_beater',   name: '超越自我', desc: '打破幽灵最佳记录',      icon: '👻', tier: 'gold',     condition: 'beat_ghost >= 1' },
  { id: 'sharer',         name: '传道者',  desc: '分享关卡给好友',         icon: '🔗', tier: 'bronze',   condition: 'shared >= 1' },
];

const TIER_COLORS = {
  bronze:   { bg: '#cd7f32', glow: '#ffaa55', text: '#fff8f0' },
  silver:   { bg: '#c0c0c0', glow: '#e8e8ff', text: '#1a1a2e' },
  gold:     { bg: '#ffd700', glow: '#fffacd', text: '#1a1a00' },
  platinum: { bg: '#e5e4e2', glow: '#f0f8ff', text: '#0a0a1a' },
};

// ─── 生成 SVG 徽章 ────────────────────────────────────────────────────────────

export function createBadgeSVG(achievement: Achievement): string {
  const c = TIER_COLORS[achievement.tier];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
  <defs>
    <radialGradient id="glow-${achievement.id}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${c.glow}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${c.bg}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur-${achievement.id}">
      <feGaussianBlur stdDeviation="2"/>
    </filter>
  </defs>
  <!-- 光晕 -->
  <circle cx="40" cy="40" r="38" fill="url(#glow-${achievement.id})" filter="url(#blur-${achievement.id})"/>
  <!-- 主体 -->
  <circle cx="40" cy="40" r="32" fill="${c.bg}" stroke="${c.glow}" stroke-width="2"/>
  <!-- 内圈 -->
  <circle cx="40" cy="40" r="28" fill="none" stroke="${c.text}" stroke-width="0.5" stroke-opacity="0.3"/>
  <!-- 图标 -->
  <text x="40" y="46" text-anchor="middle" font-size="24" font-family="system-ui">${achievement.icon}</text>
  <!-- 动画 -->
  <animateTransform attributeName="transform" type="rotate" from="0 40 40" to="360 40 40" dur="8s" repeatCount="indefinite" additive="sum"/>
</svg>`;
}

// ─── 解锁动画 Toast ───────────────────────────────────────────────────────────

export function showAchievementUnlock(achievement: Achievement): void {
  const el = document.createElement('div');
  el.className = 'achievement-unlock-toast';
  const c = TIER_COLORS[achievement.tier];
  el.style.cssText = [
    'position:fixed', 'bottom:80px', 'right:20px',
    'display:flex', 'align-items:center', 'gap:12px',
    `background:${c.bg}`, `color:${c.text}`,
    'padding:12px 18px', 'border-radius:12px',
    `box-shadow:0 0 20px ${c.glow}`,
    'z-index:10000', 'animation:slideInRight 0.4s ease',
    'max-width:280px', 'font-family:system-ui',
  ].join(';');

  const svgWrap = document.createElement('div');
  svgWrap.style.cssText = 'width:48px;height:48px;flex-shrink:0';
  svgWrap.innerHTML = createBadgeSVG(achievement);

  const info = document.createElement('div');
  info.innerHTML = `<div style="font-weight:700;font-size:14px">🏅 成就解锁！</div>
    <div style="font-size:13px;margin-top:2px">${achievement.name}</div>
    <div style="font-size:11px;opacity:0.8;margin-top:2px">${achievement.desc}</div>`;

  el.appendChild(svgWrap);
  el.appendChild(info);
  document.body.appendChild(el);

  // 自动移除
  setTimeout(() => {
    el.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

// ─── CSS 注入 ─────────────────────────────────────────────────────────────────

export function injectAchievementStyles(): void {
  if (document.getElementById('achievement-styles')) return;
  const style = document.createElement('style');
  style.id = 'achievement-styles';
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(120%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0);    opacity: 1; }
      to   { transform: translateX(120%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ─── 成就检查 ─────────────────────────────────────────────────────────────────

const UNLOCKED_KEY = 'sokoban_achievements_v2';

let _unlockedCache: Set<string> | null = null;

export function getUnlocked(): Set<string> {
  if (_unlockedCache) return _unlockedCache;
  try {
    const raw = localStorage.getItem(UNLOCKED_KEY);
    _unlockedCache = new Set(raw ? JSON.parse(raw) : []);
    return _unlockedCache;
  } catch { return new Set(); }
}

export function markUnlocked(id: string): void {
  const set = getUnlocked();
  set.add(id);
  _unlockedCache = set; // 更新缓存
  try { localStorage.setItem(UNLOCKED_KEY, JSON.stringify([...set])); } catch { }
}

export interface AchievementStats {
  cleared: number;
  stars3: number;
  ta_cleared: number;
  no_hint_clears: number;
  max_combo: number;
  beat_ghost: number;
  shared: number;
}

export function checkAchievements(stats: AchievementStats): Achievement[] {
  const unlocked = getUnlocked();
  const newlyUnlocked: Achievement[] = [];

  const check = (id: string, condition: boolean) => {
    if (condition && !unlocked.has(id)) {
      const a = ACHIEVEMENTS.find(a => a.id === id);
      if (a) { markUnlocked(id); newlyUnlocked.push(a); }
    }
  };

  check('first_clear',  stats.cleared >= 1);
  check('ten_clear',    stats.cleared >= 10);
  check('half_clear',   stats.cleared >= 35);
  check('all_clear',    stats.cleared >= 70);
  check('first_star3',  stats.stars3 >= 1);
  check('ten_star3',    stats.stars3 >= 10);
  check('all_star3',    stats.stars3 >= 70);
  check('speedrun',     stats.ta_cleared >= 5);
  check('no_hint',      stats.no_hint_clears >= 10);
  check('combo_master', stats.max_combo >= 5);
  check('ghost_beater', stats.beat_ghost >= 1);
  check('sharer',       stats.shared >= 1);

  return newlyUnlocked;
}
