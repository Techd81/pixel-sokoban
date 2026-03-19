// ─── 关卡笔记系统 Level Notes ────────────────────────────────────────────────
// 玩家可为每个关卡添加个人笔记/攻略提示，持久化存储

const NOTES_KEY = 'sokoban_level_notes';

export interface LevelNote {
  levelIndex: number;
  text: string;
  updatedAt: number;
}

function loadNotes(): Record<number, LevelNote> {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}'); } catch { return {}; }
}

function saveNotes(notes: Record<number, LevelNote>): void {
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch { }
}

export function getNote(levelIndex: number): string {
  return loadNotes()[levelIndex]?.text ?? '';
}

export function setNote(levelIndex: number, text: string): void {
  const notes = loadNotes();
  if (text.trim() === '') {
    delete notes[levelIndex];
  } else {
    notes[levelIndex] = { levelIndex, text: text.trim(), updatedAt: Date.now() };
  }
  saveNotes(notes);
}

export function getAllNotes(): LevelNote[] {
  return Object.values(loadNotes()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function showNoteEditor(levelIndex: number, levelName: string): void {
  const existing = getNote(levelIndex);
  // 移除旧的 noteModal 重新创建，防止监听器堆积
  document.getElementById('noteModal')?.remove();
  let modal = null;
  {
    modal = document.createElement('div');
    modal.id = 'noteModal';
    modal.style.cssText = [
      'position:fixed', 'inset:0', 'background:rgba(0,0,0,0.7)',
      'display:flex', 'align-items:center', 'justify-content:center',
      'z-index:10000'
    ].join(';');
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div style="background:#1e1e2e;border:1px solid #444;border-radius:12px;padding:20px;width:min(400px,90vw)">
      <h3 id="noteTitle" style="margin:0 0 10px;color:#8be9fd"></h3>
      <textarea id="noteText" rows="6" style="width:100%;box-sizing:border-box;background:#13131f;color:#f8f8f2;border:1px solid #555;border-radius:8px;padding:8px;font-size:14px;resize:vertical"></textarea>
      <div style="display:flex;gap:8px;margin-top:10px;justify-content:flex-end">
        <button id="noteSave" style="background:#50fa7b;color:#000;border:none;padding:8px 16px;border-radius:8px;cursor:pointer">保存</button>
        <button id="noteClose" style="background:#555;color:#fff;border:none;padding:8px 16px;border-radius:8px;cursor:pointer">关闭</button>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
  // 用textContent安全设置标题和内容（防XSS）
  const titleEl = document.getElementById('noteTitle');
  if (titleEl) titleEl.textContent = '📝 关卡笔记 — ' + levelName;
  const textarea = document.getElementById('noteText') as HTMLTextAreaElement;
  if (textarea) textarea.value = existing;
  textarea?.focus();
  document.getElementById('noteSave')?.addEventListener('click', () => {
    setNote(levelIndex, textarea?.value ?? '');
    modal!.style.display = 'none';
  });
  document.getElementById('noteClose')?.addEventListener('click', () => {
    modal!.style.display = 'none';
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal!.style.display = 'none';
  });
}
