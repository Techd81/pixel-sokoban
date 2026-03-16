// ─── 皮肤/角色外观系统 Skin System ──────────────────────────────────────────
// 支持多种角色和箱子外观，CSS变量驱动

export interface Skin {
  id: string;
  name: string;
  emoji: string;         // 角色emoji
  boxEmoji: string;      // 箱子emoji
  goalEmoji: string;     // 目标点emoji
  playerColor: string;
  boxColor: string;
  goalColor: string;
  unlockCondition: string; // 解锁条件描述
  unlockCleared: number;   // 需要通关数量
}

export const SKINS: Skin[] = [
  { id: 'default',   name: '仓管员',   emoji: '🧑',  boxEmoji: '📦', goalEmoji: '🎯', playerColor: '#7ee081', boxColor: '#c98f52', goalColor: '#ffd166', unlockCondition: '默认解锁', unlockCleared: 0 },
  { id: 'robot',     name: '机器人',   emoji: '🤖',  boxEmoji: '🗃️', goalEmoji: '⭕', playerColor: '#8be9fd', boxColor: '#6272a4', goalColor: '#ff79c6', unlockCondition: '通关10关', unlockCleared: 10 },
  { id: 'ninja',     name: '忍者',     emoji: '🥷',  boxEmoji: '🎁', goalEmoji: '💮', playerColor: '#44475a', boxColor: '#ff5555', goalColor: '#50fa7b', unlockCondition: '通关25关', unlockCleared: 25 },
  { id: 'astronaut', name: '宇航员',   emoji: '👨‍🚀', boxEmoji: '🛸', goalEmoji: '🌟', playerColor: '#f1fa8c', boxColor: '#bd93f9', goalColor: '#ffb86c', unlockCondition: '通关40关', unlockCleared: 40 },
  { id: 'wizard',    name: '魔法师',   emoji: '🧙',  boxEmoji: '📮', goalEmoji: '✨', playerColor: '#bd93f9', boxColor: '#8be9fd', goalColor: '#ffd700', unlockCondition: '通关55关', unlockCleared: 55 },
  { id: 'legend',    name: '传说仓管', emoji: '👑',  boxEmoji: '💰', goalEmoji: '🏆', playerColor: '#ffd700', boxColor: '#ff6b6b', goalColor: '#ffffff', unlockCondition: '通关全部70关', unlockCleared: 70 },
];

const SKIN_KEY = 'sokoban_skin';

export function getCurrentSkin(): Skin {
  const id = localStorage.getItem(SKIN_KEY) || 'default';
  return SKINS.find(s => s.id === id) || SKINS[0];
}

export function setSkin(id: string, clearedCount: number): boolean {
  const skin = SKINS.find(s => s.id === id);
  if (!skin) return false;
  if (clearedCount < skin.unlockCleared) return false;
  localStorage.setItem(SKIN_KEY, id);
  applySkin(skin);
  return true;
}

export function applySkin(skin: Skin): void {
  const root = document.documentElement;
  root.style.setProperty('--player-color', skin.playerColor);
  root.style.setProperty('--box-color', skin.boxColor);
  root.style.setProperty('--goal-color', skin.goalColor);
  root.dataset.skin = skin.id;
}

export function initSkin(clearedCount: number): void {
  const skin = getCurrentSkin();
  if (clearedCount >= skin.unlockCleared) applySkin(skin);
  else applySkin(SKINS[0]);
}

export function getUnlockedSkins(clearedCount: number): Skin[] {
  return SKINS.filter(s => clearedCount >= s.unlockCleared);
}

export function renderSkinSelector(container: HTMLElement, clearedCount: number): void {
  const current = getCurrentSkin();
  container.innerHTML = `
    <h3 style="margin:0 0 12px;color:#ffd166">🎨 选择外观</h3>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
      ${SKINS.map(s => {
        const unlocked = clearedCount >= s.unlockCleared;
        return `
          <div data-skin-id="${s.id}" style="
            border:2px solid ${s.id === current.id ? '#ffd166' : unlocked ? '#444' : '#222'};
            border-radius:10px;padding:10px;text-align:center;
            cursor:${unlocked ? 'pointer' : 'default'};
            opacity:${unlocked ? 1 : 0.4};
            background:${s.id === current.id ? '#2a2a1a' : '#1e1e2e'};
            transition:all 0.2s
          ">
            <div style="font-size:1.8em">${s.emoji}</div>
            <div style="font-size:0.75em;margin-top:4px;color:#f8f8f2">${s.name}</div>
            <div style="font-size:0.65em;color:${unlocked ? '#50fa7b' : '#888'}">
              ${unlocked ? '已解锁' : s.unlockCondition}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  container.querySelectorAll<HTMLElement>('[data-skin-id]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.skinId!;
      if (setSkin(id, clearedCount)) {
        renderSkinSelector(container, clearedCount);
      }
    });
  });
}
