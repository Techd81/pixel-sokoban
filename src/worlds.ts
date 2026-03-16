// ─── 关卡世界/章节系统 World System ──────────────────────────────────────────
import { LEVELS } from './levels';
import { predictDifficulty } from './difficulty';

export interface World {
  id: string;
  name: string;
  emoji: string;
  color: string;
  levelRange: [number, number];  // [start, end] inclusive
  description: string;
  unlockCleared: number;
}

export const WORLDS: World[] = [
  { id:'tutorial', name:'新手村',     emoji:'🌱', color:'#88ff88', levelRange:[0,9],   description:'基础推箱子操作练习',     unlockCleared:0  },
  { id:'storage',  name:'仓库区',     emoji:'🏭', color:'#8be9fd', levelRange:[10,24],  description:'中等难度，需要规划路线', unlockCleared:8  },
  { id:'maze',     name:'迷宫区',     emoji:'🌀', color:'#ffd166', levelRange:[25,39],  description:'复杂走廊，考验耐心',     unlockCleared:20 },
  { id:'factory',  name:'工厂区',     emoji:'⚙️', color:'#ff79c6', levelRange:[40,54],  description:'多箱联动，策略为先',     unlockCleared:35 },
  { id:'palace',   name:'宫殿区',     emoji:'🏰', color:'#bd93f9', levelRange:[55,64],  description:'高难度关卡，挑战极限',   unlockCleared:50 },
  { id:'legend',   name:'传奇殿堂',   emoji:'👑', color:'#ffd700', levelRange:[65,69],  description:'终极挑战，推箱子传说',   unlockCleared:65 },
];

export function getWorldForLevel(levelIndex: number): World | null {
  return WORLDS.find(w => levelIndex >= w.levelRange[0] && levelIndex <= w.levelRange[1]) ?? null;
}

export function isWorldUnlocked(world: World, cleared: number): boolean {
  return cleared >= world.unlockCleared;
}

export function getWorldProgress(world: World, records: Record<number,{bestMoves?:number}|null>): {cleared:number;total:number;pct:number} {
  const [s,e] = world.levelRange;
  const total = e - s + 1;
  const cleared = Array.from({length:total},(_,i)=>i+s).filter(i=>records[i]?.bestMoves).length;
  return { cleared, total, pct: Math.round(cleared/total*100) };
}

export function renderWorldMap(container: HTMLElement, records: Record<number,{bestMoves?:number}|null>, onSelect: (idx:number)=>void): void {
  container.innerHTML = '';
  const totalCleared = Object.values(records).filter(r=>r?.bestMoves).length;
  WORLDS.forEach(world => {
    const unlocked = isWorldUnlocked(world, totalCleared);
    const prog = getWorldProgress(world, records);
    const div = document.createElement('div');
    div.style.cssText = `border:2px solid ${world.color};border-radius:12px;padding:12px;margin:8px 0;opacity:${unlocked?1:0.4};cursor:${unlocked?'pointer':'not-allowed'}`;
    div.innerHTML = `<div style="font-size:1.5em">${world.emoji} ${world.name}</div><div style="font-size:0.8em;color:#888">${world.description}</div><div style="font-size:0.85em;margin-top:4px">${prog.cleared}/${prog.total} 关 · ${prog.pct}%${!unlocked?` · 需通关${world.unlockCleared}关解锁`:''}</div>`;
    if (unlocked) div.addEventListener('click', () => onSelect(world.levelRange[0]));
    container.appendChild(div);
  });
}
