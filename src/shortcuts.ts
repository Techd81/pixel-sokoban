// ─── 快捷键帮助系统 Keyboard Shortcuts Help ─────────────────────────────────

export interface ShortcutGroup {
  group: string;
  shortcuts: Array<{ keys: string[]; desc: string }>;
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    group: '移动',
    shortcuts: [
      { keys: ['↑', 'W'], desc: '向上移动' },
      { keys: ['↓', 'S'], desc: '向下移动' },
      { keys: ['←', 'A'], desc: '向左移动' },
      { keys: ['→', 'D'], desc: '向右移动' },
    ],
  },
  {
    group: '操作',
    shortcuts: [
      { keys: ['Z'], desc: '撤销一步' },
      { keys: ['R'], desc: '重新开始' },
      { keys: ['H'], desc: 'AI 提示' },
      { keys: ['F'], desc: '收藏/取消收藏' },
    ],
  },
  {
    group: '关卡',
    shortcuts: [
      { keys: ['N', 'Enter'], desc: '下一关' },
      { keys: ['P'], desc: '上一关' },
      { keys: ['L'], desc: '关卡选择' },
      { keys: ['E'], desc: '关卡编辑器' },
    ],
  },
  {
    group: '界面',
    shortcuts: [
      { keys: ['?'], desc: '快捷键帮助' },
      { keys: ['+', '-'], desc: '放大/缩小' },
      { keys: ['M'], desc: '切换 BGM' },
      { keys: ['Esc'], desc: '关闭弹窗' },
    ],
  },
  {
    group: '高级',
    shortcuts: [
      { keys: ['Ctrl+Z'], desc: '撤销（同 Z）' },
      { keys: ['T'], desc: '速通挑战' },
      { keys: ['G'], desc: '随机关卡' },
      { keys: ['I'], desc: '显示统计' },
      { keys: ['`'], desc: 'FPS 性能显示' },
      { keys: ['Ctrl+1~6'], desc: '跳转世界章节' },
      { keys: ['Ctrl+M'], desc: '宏录制开始/停止' },
    ],
  },
];

let helpEl: HTMLElement | null = null;

export function showKeyboardHelp(): void {
  if (helpEl) { helpEl.remove(); helpEl = null; return; }
  helpEl = document.createElement('div');
  helpEl.id = 'keyboardHelp';
  helpEl.style.cssText = [
    'position:fixed', 'top:50%', 'left:50%',
    'transform:translate(-50%,-50%)',
    'background:#1e1e2e', 'border:2px solid #8be9fd',
    'border-radius:16px', 'padding:24px', 'z-index:9000',
    'min-width:340px', 'max-width:90vw', 'max-height:80vh',
    'overflow-y:auto', 'font-family:monospace', 'color:#f8f8f2',
    'box-shadow:0 8px 32px rgba(0,0,0,0.7)',
  ].join(';');

  const groups = SHORTCUT_GROUPS.map(g => `
    <div style="margin-bottom:12px">
      <div style="color:#8be9fd;font-weight:bold;margin-bottom:6px;font-size:0.85em;text-transform:uppercase;letter-spacing:0.1em">${g.group}</div>
      ${g.shortcuts.map(s => `
        <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a3e">
          <div>${s.keys.map(k => `<kbd style="background:#282a36;border:1px solid #44475a;border-radius:4px;padding:1px 6px;margin-right:4px;font-size:0.8em">${k}</kbd>`).join('')}</div>
          <div style="color:#a8a8b8;font-size:0.85em">${s.desc}</div>
        </div>
      `).join('')}
    </div>
  `).join('');

  helpEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="margin:0;color:#ffd166">⌨️ 快捷键列表</h3>
      <button id="helpClose" style="background:none;border:none;color:#888;cursor:pointer;font-size:1.5em">×</button>
    </div>
    ${groups}
  `;
  document.body.appendChild(helpEl);
  helpEl.querySelector('#helpClose')?.addEventListener('click', () => {
    helpEl?.remove(); helpEl = null;
  });
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { helpEl?.remove(); helpEl = null; document.removeEventListener('keydown', handler); }
  });
}

export function isHelpOpen(): boolean { return !!helpEl; }
