// ─── 关卡编辑器（基于 index.html 的 editorModal）────────────────────────────
// 目标：让 editorBtn 以及 editorModal 内关键按钮可用（最小可用版）

import { TILE, type Level, type TileChar, type Pos } from './types';
import { LEVELS } from './levels';
import { generateLevel } from './generator';
import { loadLevel, state } from './game';
import { solveAsync } from './solver';
import { showShareModal } from './share';
import { setMessage } from './ui';
import { copyText, escapeHtml } from './web_utils';
import { predictDifficulty } from './difficulty';
import { validateLevel } from './validator';

type ToolTile = TileChar | 'E';
type DrawMode = 'paint' | 'line' | 'rect' | 'fill';

const MAX_HISTORY = 50;
const MAX_W = 16;
const MAX_H = 14;
const MIN_W = 5;
const MIN_H = 5;
let tempPlayLevelIndex = -1;

function clampInt(n: number, min: number, max: number): number {
  const v = Number.isFinite(n) ? Math.trunc(n) : min;
  return Math.max(min, Math.min(max, v));
}

function cloneGrid(grid: TileChar[][]): TileChar[][] {
  return grid.map(row => [...row]);
}

function gridToMap(grid: TileChar[][]): string[] {
  return grid.map(row => row.join(''));
}

function parseMapText(text: string): string[] {
  const rawLines = text.replace(/\r/g, '').split('\n');
  // 保留中间空行（用于用户粘贴时的视觉），但去掉首尾纯空行
  while (rawLines.length && rawLines[0].trim() === '') rawLines.shift();
  while (rawLines.length && rawLines[rawLines.length - 1].trim() === '') rawLines.pop();
  return rawLines;
}

function normalizeMap(lines: string[]): TileChar[][] {
  const h = clampInt(lines.length || 1, MIN_H, MAX_H);
  const w = clampInt(Math.max(...lines.map(l => l.length), 1), MIN_W, MAX_W);
  const grid: TileChar[][] = Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => {
      const ch = lines[y]?.[x] ?? ' ';
      const ok: TileChar =
        ch === TILE.WALL || ch === TILE.FLOOR || ch === TILE.GOAL ||
        ch === TILE.BOX || ch === TILE.PLAYER || ch === TILE.BOX_ON_GOAL || ch === TILE.PLAYER_ON_GOAL
          ? (ch as TileChar)
          : TILE.FLOOR;
      return ok;
    })
  );
  return grid;
}

function getUnder(tile: TileChar): TileChar {
  if (tile === TILE.GOAL || tile === TILE.BOX_ON_GOAL || tile === TILE.PLAYER_ON_GOAL) return TILE.GOAL;
  return TILE.FLOOR;
}

function findPlayer(grid: TileChar[][]): Pos | null {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const c = grid[y][x];
      if (c === TILE.PLAYER || c === TILE.PLAYER_ON_GOAL) return { x, y };
    }
  }
  return null;
}

function collectGoals(grid: TileChar[][]): Pos[] {
  const goals: Pos[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const c = grid[y][x];
      if (c === TILE.GOAL || c === TILE.BOX_ON_GOAL || c === TILE.PLAYER_ON_GOAL) goals.push({ x, y });
    }
  }
  return goals;
}

function countTiles(grid: TileChar[][]): { player: number; box: number; goal: number } {
  let player = 0, box = 0, goal = 0;
  for (const row of grid) {
    for (const c of row) {
      if (c === TILE.PLAYER || c === TILE.PLAYER_ON_GOAL) player++;
      if (c === TILE.BOX || c === TILE.BOX_ON_GOAL) box++;
      if (c === TILE.GOAL || c === TILE.BOX_ON_GOAL || c === TILE.PLAYER_ON_GOAL) goal++;
    }
  }
  return { player, box, goal };
}

function buildLevelFromGrid(grid: TileChar[][]): Level {
  const { box } = countTiles(grid);
  const par = Math.max(10, box * 8);
  return {
    name: '自定义关卡',
    parMoves: par,
    starMoves: { three: par, two: par * 2, one: par * 3 },
    map: gridToMap(grid),
  };
}

export interface EditorModalApi {
  open(level?: Level): void;
  close(): void;
  isOpen(): boolean;
}

export function initEditorModal(): EditorModalApi {
  const modal = document.getElementById('editorModal');
  const boardEl = document.getElementById('editorBoard');
  const statusEl = document.getElementById('editorStatus');
  const coordEl = document.getElementById('editorCoord');
  const wInput = document.getElementById('editorW') as HTMLInputElement | null;
  const hInput = document.getElementById('editorH') as HTMLInputElement | null;
  const importBox = document.getElementById('editorImportBox');
  const importText = document.getElementById('editorImportText') as HTMLTextAreaElement | null;
  const templateSelect = document.getElementById('editorTemplateSelect') as HTMLSelectElement | null;

  if (!modal || !boardEl || !statusEl || !coordEl || !wInput || !hInput || !importBox || !importText) {
    // DOM 不存在时返回空实现，避免运行时崩溃
    return { open: () => {}, close: () => {}, isOpen: () => false };
  }

  let grid: TileChar[][] = normalizeMap(['########', '#@ $.  #', '########']);
  let tool: ToolTile = TILE.WALL;
  let mode: DrawMode = 'paint';
  let lineStart: Pos | null = null;
  let rectStart: Pos | null = null;
  let symmetric = false;
  let painting = false;
  let gestureHistoryPushed = false;

  let history: TileChar[][][] = [];
  let historyIndex = -1;

  const pushHistory = (): void => {
    const snap = cloneGrid(grid);
    history = history.slice(0, historyIndex + 1);
    history.push(snap);
    if (history.length > MAX_HISTORY) history.shift();
    historyIndex = history.length - 1;
  };

  const restoreHistory = (idx: number): void => {
    const snap = history[idx];
    if (!snap) return;
    grid = cloneGrid(snap);
    historyIndex = idx;
    renderAll();
  };

  const clearPlayerEverywhere = (): void => {
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const c = grid[y][x];
        if (c === TILE.PLAYER) grid[y][x] = TILE.FLOOR;
        if (c === TILE.PLAYER_ON_GOAL) grid[y][x] = TILE.GOAL;
      }
    }
  };

  const paintAt = (x: number, y: number): void => {
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[y].length) return;

    const apply = (tx: number, ty: number): void => {
      const cur = grid[ty][tx];
      let next: TileChar = cur;

      if (tool === 'E') {
        next = getUnder(cur);
      } else if (tool === TILE.WALL) {
        next = TILE.WALL;
      } else if (tool === TILE.FLOOR) {
        next = TILE.FLOOR;
      } else if (tool === TILE.GOAL) {
        if (cur === TILE.BOX) next = TILE.BOX_ON_GOAL;
        else if (cur === TILE.PLAYER) next = TILE.PLAYER_ON_GOAL;
        else next = TILE.GOAL;
      } else if (tool === TILE.BOX) {
        if (cur === TILE.GOAL) next = TILE.BOX_ON_GOAL;
        else if (cur === TILE.PLAYER_ON_GOAL) next = TILE.BOX_ON_GOAL;
        else next = TILE.BOX;
      } else if (tool === TILE.PLAYER) {
        clearPlayerEverywhere();
        if (cur === TILE.GOAL) next = TILE.PLAYER_ON_GOAL;
        else if (cur === TILE.BOX_ON_GOAL) next = TILE.PLAYER_ON_GOAL;
        else next = TILE.PLAYER;
      } else {
        next = tool;
      }

      grid[ty][tx] = next;
    };

    if (!gestureHistoryPushed) {
      pushHistory();
      gestureHistoryPushed = true;
    }
    apply(x, y);
    if (symmetric) {
      const mirrorX = grid[0].length - 1 - x;
      if (mirrorX !== x) apply(mirrorX, y);
    }
    renderAll();
  };

  const floodFill = (sx: number, sy: number): void => {
    if (tool === 'E') return;
    const from = grid[sy]?.[sx];
    if (from == null) return;

    const target: TileChar =
      tool === TILE.PLAYER ? (from === TILE.GOAL ? TILE.PLAYER_ON_GOAL : TILE.PLAYER) :
      tool === TILE.BOX ? (from === TILE.GOAL ? TILE.BOX_ON_GOAL : TILE.BOX) :
      tool;

    if (from === target) return;

    pushHistory();
    const q: Array<[number, number]> = [[sx, sy]];
    const seen = new Set<string>([`${sx},${sy}`]);
    while (q.length) {
      const [x, y] = q.shift()!;
      if (grid[y]?.[x] !== from) continue;
      if (tool === TILE.PLAYER) clearPlayerEverywhere();
      grid[y][x] = target;
      const neigh = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
      for (const [nx, ny] of neigh) {
        if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) continue;
        const k = `${nx},${ny}`;
        if (seen.has(k)) continue;
        seen.add(k);
        q.push([nx, ny]);
      }
    }
    renderAll();
  };

  const drawLine = (a: Pos, b: Pos): void => {
    if (tool === 'E') return;
    pushHistory();
    // Bresenham
    let x0 = a.x, y0 = a.y, x1 = b.x, y1 = b.y;
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      grid[y0][x0] = tool === TILE.PLAYER ? TILE.PLAYER : tool;
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    renderAll();
  };

  const drawRect = (a: Pos, b: Pos): void => {
    if (tool === 'E') return;
    pushHistory();
    const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x);
    const y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        grid[y][x] = tool === TILE.PLAYER ? TILE.PLAYER : tool;
      }
    }
    renderAll();
  };

  const resizeGrid = (w: number, h: number): void => {
    pushHistory();
    const old = grid;
    const newGrid: TileChar[][] = Array.from({ length: h }, (_, y) =>
      Array.from({ length: w }, (_, x) => old[y]?.[x] ?? TILE.FLOOR)
    );
    grid = newGrid;
    renderAll();
  };

  const renderBoard = (): void => {
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    boardEl.style.display = 'grid';
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 36px)`;

    const needed = rows * cols;
    while (boardEl.children.length > needed) boardEl.removeChild(boardEl.lastChild!);
    while (boardEl.children.length < needed) {
      const cell = document.createElement('div');
      cell.className = 'editor-cell';
      boardEl.appendChild(cell);
    }

    const glyph = (c: TileChar): string => {
      if (c === TILE.WALL) return '🧱';
      if (c === TILE.GOAL) return '🟡';
      if (c === TILE.BOX || c === TILE.BOX_ON_GOAL) return '📦';
      if (c === TILE.PLAYER || c === TILE.PLAYER_ON_GOAL) return '🧑';
      return '';
    };

    let idx = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const el = boardEl.children[idx++] as HTMLElement;
        el.textContent = glyph(grid[y][x]);
        el.dataset.x = String(x);
        el.dataset.y = String(y);
      }
    }
  };

  const renderStatus = (): void => {
    const { player, box, goal } = countTiles(grid);
    let msg = `玩家 ${player} · 箱子 ${box} · 目标 ${goal}`;
    if (player !== 1) msg += '  |  ⚠ 需要且只能放置 1 个玩家';
    else if (box === 0 || goal === 0) msg += '  |  ⚠ 需要放置箱子与目标';
    else if (box !== goal) msg += '  |  ⚠ 箱子与目标数量需相等';
    else {
      const diff = predictDifficulty({ name:'', parMoves:0, starMoves:{three:0,two:0,one:0}, map:gridToMap(grid) });
      msg += `  |  难度: ${diff.label}(${diff.score.toFixed(0)}分)`;
    }
    statusEl.textContent = msg;
  };

  const renderAll = (): void => {
    renderBoard();
    renderStatus();
    wInput.value = String(grid[0]?.length ?? MIN_W);
    hInput.value = String(grid.length ?? MIN_H);
  };

  // ─── UI 绑定 ───────────────────────────────────────────────────────────────

  modal.addEventListener('click', (e) => {
    if (e.target === modal) api.close();
  });

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && api.isOpen()) api.close();
  };
  document.addEventListener('keydown', onKey);

  // 工具选择
  modal.querySelectorAll<HTMLButtonElement>('.editor-tool').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = (btn.dataset.tile ?? TILE.WALL) as ToolTile;
      tool = t;
      mode = 'paint';
      lineStart = null;
      rectStart = null;
      modal.querySelectorAll('.editor-tool').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // 画板交互
  const resolveCell = (target: EventTarget | null): Pos | null => {
    const el = target as HTMLElement | null;
    if (!el || !el.classList.contains('editor-cell')) return null;
    const x = Number(el.dataset.x);
    const y = Number(el.dataset.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  };

  boardEl.addEventListener('pointerdown', (e) => {
    const p = resolveCell(e.target);
    if (!p) return;
    painting = true;
    gestureHistoryPushed = false;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
    if (mode === 'fill') { floodFill(p.x, p.y); mode = 'paint'; return; }
    if (mode === 'line') {
      if (!lineStart) { lineStart = p; setMessage('已选择起点，再点一次确定终点', 'info'); return; }
      drawLine(lineStart, p); lineStart = null; mode = 'paint'; return;
    }
    if (mode === 'rect') {
      if (!rectStart) { rectStart = p; setMessage('已选择起点，再点一次确定矩形', 'info'); return; }
      drawRect(rectStart, p); rectStart = null; mode = 'paint'; return;
    }
    paintAt(p.x, p.y);
  });
  boardEl.addEventListener('pointermove', (e) => {
    if (!painting) return;
    const p = resolveCell(e.target);
    if (!p) return;
    if (mode !== 'paint') return;
    paintAt(p.x, p.y);
  });
  boardEl.addEventListener('pointerup', () => { painting = false; gestureHistoryPushed = false; });
  boardEl.addEventListener('pointerleave', () => { painting = false; gestureHistoryPushed = false; });

  boardEl.addEventListener('pointerover', (e) => {
    const p = resolveCell(e.target);
    if (!p) return;
    coordEl.textContent = `(${p.x}, ${p.y})`;
  });

  // 大小调整
  document.getElementById('editorResizeBtn')?.addEventListener('click', () => {
    const w = clampInt(Number(wInput.value), MIN_W, MAX_W);
    const h = clampInt(Number(hInput.value), MIN_H, MAX_H);
    resizeGrid(w, h);
  });

  // 边框填墙
  document.getElementById('editorFillWallBtn')?.addEventListener('click', () => {
    pushHistory();
    const h = grid.length, w = grid[0]?.length ?? 0;
    for (let x = 0; x < w; x++) { grid[0][x] = TILE.WALL; grid[h - 1][x] = TILE.WALL; }
    for (let y = 0; y < h; y++) { grid[y][0] = TILE.WALL; grid[y][w - 1] = TILE.WALL; }
    renderAll();
  });

  // 清空
  document.getElementById('editorClearBtn')?.addEventListener('click', () => {
    pushHistory();
    grid = grid.map(row => row.map(() => TILE.FLOOR));
    renderAll();
  });

  // 对称
  const symBtn = document.getElementById('editorSymBtn') as HTMLButtonElement | null;
  const syncSym = () => { if (symBtn) symBtn.textContent = symmetric ? '对称 ON' : '对称 OFF'; };
  syncSym();
  symBtn?.addEventListener('click', () => { symmetric = !symmetric; syncSym(); });

  // 翻转/旋转
  document.getElementById('editorFlipHBtn')?.addEventListener('click', () => {
    pushHistory();
    grid = grid.map(row => [...row].reverse());
    renderAll();
  });
  document.getElementById('editorFlipVBtn')?.addEventListener('click', () => {
    pushHistory();
    grid = [...grid].reverse();
    renderAll();
  });
  document.getElementById('editorRotBtn')?.addEventListener('click', () => {
    pushHistory();
    const h = grid.length, w = grid[0]?.length ?? 0;
    const rotated: TileChar[][] = Array.from({ length: w }, (_, y) =>
      Array.from({ length: h }, (_, x) => grid[h - 1 - x][y])
    );
    grid = rotated;
    renderAll();
  });

  // 模式工具
  document.getElementById('editorLineBtn')?.addEventListener('click', () => { mode = 'line'; lineStart = null; setMessage('线条：点两次确定', 'info'); });
  document.getElementById('editorRectBtn')?.addEventListener('click', () => { mode = 'rect'; rectStart = null; setMessage('矩形：点两次确定', 'info'); });
  document.getElementById('editorFillBtn')?.addEventListener('click', () => { mode = 'fill'; setMessage('填充：点格子填充连通区域', 'info'); });

  // Undo/Redo
  document.getElementById('editorUndoBtn')?.addEventListener('click', () => {
    if (historyIndex <= 0) return;
    restoreHistory(historyIndex - 1);
  });
  document.getElementById('editorRedoBtn')?.addEventListener('click', () => {
    if (historyIndex >= history.length - 1) return;
    restoreHistory(historyIndex + 1);
  });

  // 随机生成
  document.getElementById('editorRandomBtn')?.addEventListener('click', () => {
    const w = clampInt(Number(wInput.value), MIN_W, MAX_W);
    const h = clampInt(Number(hInput.value), MIN_H, MAX_H);
    const lv = generateLevel({ cols: w, rows: h, boxCount: 2, seed: Date.now() });
    if (!lv) { setMessage('生成失败，请重试', 'error'); return; }
    grid = normalizeMap(lv.map);
    history = []; historyIndex = -1;
    pushHistory();
    renderAll();
  });

  // 模板
  if (templateSelect) {
    templateSelect.innerHTML = '<option value="">📋 模板...</option>' +
      LEVELS.slice(0, 60).map((lv, i) => `<option value="${i}">L${i + 1} ${escapeHtml(lv.name)}</option>`).join('');
    templateSelect.addEventListener('change', () => {
      const idx = Number(templateSelect.value);
      if (!Number.isFinite(idx) || !LEVELS[idx]) return;
      grid = normalizeMap(LEVELS[idx].map);
      history = []; historyIndex = -1;
      pushHistory();
      renderAll();
      templateSelect.value = '';
    });
  }

  // 导入框显隐
  const showImportBox = (): void => { importBox.classList.remove('hidden'); importText.focus(); };
  const hideImportBox = (): void => { importBox.classList.add('hidden'); };

  document.getElementById('editorImportBtn')?.addEventListener('click', showImportBox);
  document.getElementById('editorImportCancelBtn')?.addEventListener('click', hideImportBox);
  document.getElementById('editorImportConfirmBtn')?.addEventListener('click', () => {
    const lines = parseMapText(importText.value);
    if (lines.length === 0) { setMessage('导入内容为空', 'warn'); return; }
    grid = normalizeMap(lines);
    history = []; historyIndex = -1;
    pushHistory();
    hideImportBox();
    renderAll();
    setMessage('导入成功', 'win');
  });

  // 剪贴板导入
  document.getElementById('editorClipBtn')?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      importText.value = text;
      showImportBox();
    } catch {
      setMessage('读取剪贴板失败（可能未授权）', 'warn');
    }
  });

  // 复制代码（地图文本）
  document.getElementById('editorExportBtn')?.addEventListener('click', async () => {
    const txt = gridToMap(grid).join('\n');
    const copied = await copyText(txt);
    setMessage(copied ? '地图已复制' : '复制失败', copied ? 'win' : 'error');
  });

  // 导出文件
  document.getElementById('editorExportFileBtn')?.addEventListener('click', () => {
    const txt = gridToMap(grid).join('\n');
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sokoban_level.txt';
    a.click();
    URL.revokeObjectURL(url);
    setMessage('已导出文件', 'win');
  });

  // 分享链接
  document.getElementById('editorShareBtn')?.addEventListener('click', () => {
    const lv = buildLevelFromGrid(grid);
    showShareModal(lv, -1);
  });

  // AI 验证
  let _editorValidating = false;
  document.getElementById('editorAiBtn')?.addEventListener('click', async () => {
    if (_editorValidating) { setMessage('验证中，请稍候...', 'warn'); return; }
    const player = findPlayer(grid);
    const goals = collectGoals(grid);
    if (!player) { setMessage('缺少玩家', 'warn'); return; }
    if (goals.length === 0) { setMessage('缺少目标点', 'warn'); return; }
    const lv = buildLevelFromGrid(grid);
    const validation = validateLevel(lv);
    if (!validation.valid) { setMessage('地图无效: ' + validation.errors.join('; '), 'error'); return; }
    setMessage('AI 验证中...', 'info');
    _editorValidating = true;
    const result = await solveAsync(grid as unknown as string[][], player, goals);
    _editorValidating = false;
    if (!result) { setMessage('无解或超时', 'error'); return; }
    setMessage(`可解：${result.steps.length}步 · ${validation.stats.mapSize}`, 'win');
  });

  // 试玩（临时关卡）
  document.getElementById('editorTestBtn')?.addEventListener('click', () => {
    const lv = buildLevelFromGrid(grid);
    const tempLevel = Object.assign(lv, { _temp: true }) as typeof LEVELS[0];
    if (tempPlayLevelIndex >= 0 && LEVELS[tempPlayLevelIndex]) {
      LEVELS[tempPlayLevelIndex] = tempLevel;
    } else {
      LEVELS.push(tempLevel);
      tempPlayLevelIndex = LEVELS.length - 1;
    }
    api.close();
    loadLevel(tempPlayLevelIndex);
    setMessage('已进入试玩关卡', 'info');
  });

  // 批量测试：最小实现=对当前关卡重复 AI 验证
  document.getElementById('batchTestBtn')?.addEventListener('click', async () => {
    if (_editorValidating) { setMessage('测试中，请稍候...', 'warn'); return; }
    const player = findPlayer(grid);
    const goals = collectGoals(grid);
    if (!player || goals.length === 0) { setMessage('请先放置玩家与目标点', 'warn'); return; }
    _editorValidating = true;
    setMessage('批量测试（当前关卡）中...', 'info');
    const result = await solveAsync(grid as unknown as string[][], player, goals);
    _editorValidating = false;
    setMessage(result ? `通过：${result.steps.length}步` : '失败：无解/超时', result ? 'win' : 'error');
  });

  // packImport：最小实现=打开导入框
  document.getElementById('packImportBtn')?.addEventListener('click', () => {
    showImportBox();
    setMessage('导入关卡包：请粘贴地图文本', 'info');
  });

  // 关闭
  document.getElementById('editorCloseBtn')?.addEventListener('click', () => api.close());

  const api: EditorModalApi = {
    open(level?: Level): void {
      const base = level ?? LEVELS[state.levelIndex] ?? buildLevelFromGrid(grid);
      grid = normalizeMap(base.map);
      history = []; historyIndex = -1;
      pushHistory();
      renderAll();
      hideImportBox();
      modal.classList.remove('hidden');
      setMessage('编辑器已打开', 'info');
    },
    close(): void {
      hideImportBox();
      modal.classList.add('hidden');
      // reset transient mode
      mode = 'paint';
      lineStart = null;
      rectStart = null;
    },
    isOpen(): boolean {
      return !modal.classList.contains('hidden');
    },
  };

  renderAll();
  pushHistory();
  return api;
}
