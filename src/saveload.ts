// ─── 存档/读档系统 Save & Load System ───────────────────────────────────────
// 支持3个存档槽，保存完整游戏状态，可随时中断和恢复

import type { GameState } from './types';

export interface SaveSlot {
  id: number;
  name: string;
  levelIndex: number;
  levelName: string;
  moves: number;
  timeMs: number;
  savedAt: number;
  grid: string[][];
  history: unknown[];
  recording: unknown[];
}

const SAVE_PREFIX = 'sokoban_save_';
const MAX_SLOTS = 3;

export function getSaveSlots(): Array<SaveSlot | null> {
  return Array.from({ length: MAX_SLOTS }, (_, i) => {
    try {
      const raw = localStorage.getItem(SAVE_PREFIX + i);
      return raw ? JSON.parse(raw) as SaveSlot : null;
    } catch { return null; }
  });
}

export function saveGame(slot: number, state: GameState, levelName: string): SaveSlot {
  const data: SaveSlot = {
    id: slot,
    name: `存档${slot + 1}`,
    levelIndex: state.levelIndex,
    levelName,
    moves: state.moves,
    timeMs: state.timer.elapsedMs,
    savedAt: Date.now(),
    grid: state.grid.map(row => [...row]),
    history: state.history,
    recording: state.recording,
  };
  localStorage.setItem(SAVE_PREFIX + slot, JSON.stringify(data));
  return data;
}

export function loadGame(slot: number): SaveSlot | null {
  try {
    const raw = localStorage.getItem(SAVE_PREFIX + slot);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function deleteSave(slot: number): void {
  localStorage.removeItem(SAVE_PREFIX + slot);
}

export function formatSaveDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

export function renderSaveSlots(
  container: HTMLElement,
  onSave: (slot: number) => void,
  onLoad: (slot: SaveSlot) => void,
  onDelete: (slot: number) => void
): void {
  const slots = getSaveSlots();
  container.innerHTML = slots.map((s, i) => `
    <div class="save-slot" data-slot="${i}">
      <div class="save-slot-info">
        ${s
          ? `<strong>存档${i+1}</strong> L${s.levelIndex+1} ${s.levelName}<br>
             <small>${s.moves}步 · ${formatSaveDate(s.savedAt)}</small>`
          : `<strong>存档${i+1}</strong> <em>空</em>`
        }
      </div>
      <div class="save-slot-btns">
        <button class="save-btn" data-slot="${i}">保存</button>
        ${s ? `<button class="load-btn" data-slot="${i}">读取</button>
               <button class="del-btn" data-slot="${i}">删除</button>` : ''}
      </div>
    </div>
  `).join('');

  container.querySelectorAll<HTMLButtonElement>('.save-btn').forEach(btn => {
    btn.addEventListener('click', () => onSave(Number(btn.dataset.slot)));
  });
  container.querySelectorAll<HTMLButtonElement>('.load-btn').forEach(btn => {
    const slot = slots[Number(btn.dataset.slot)];
    if (slot) btn.addEventListener('click', () => onLoad(slot));
  });
  container.querySelectorAll<HTMLButtonElement>('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      onDelete(Number(btn.dataset.slot));
      renderSaveSlots(container, onSave, onLoad, onDelete);
    });
  });
}
