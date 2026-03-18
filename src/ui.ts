import { TILE, type Pos } from './types';
import { state } from './game';
import { LEVELS } from './levels';
import { formatBest, getRecord, getLevelConfig, formatMs, getElapsedTimeMs } from './game';

// ─── DOM 元素引用 ──────────────────────────────────────────────────────────────

export const els = {
  board:        null as HTMLElement | null,
  moveCount:    null as HTMLElement | null,
  pushCount:    null as HTMLElement | null,
  parMoves:     null as HTMLElement | null,
  bestMoves:    null as HTMLElement | null,
  bestRank:     null as HTMLElement | null,
  levelLabel:   null as HTMLElement | null,
  message:      null as HTMLElement | null,
  timeDisplay:  null as HTMLElement | null,
  progressText: null as HTMLElement | null,
  progressFill: null as HTMLElement | null,
};

export function initDomRefs(): void {
  const byId = (...ids: string[]): HTMLElement | null => {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  };
  els.board        = document.getElementById('board');
  els.moveCount    = byId('moveCount', 'move-count');
  els.pushCount    = byId('pushCount', 'push-count');
  els.parMoves     = byId('parMoves', 'par-moves');
  els.bestMoves    = byId('bestMoves', 'best-moves');
  els.bestRank     = byId('bestRank', 'best-rank');
  els.levelLabel   = byId('levelLabel', 'level-label');
  els.message      = document.getElementById('message');
  els.timeDisplay  = byId('timeDisplay', 'time-display');
  els.progressText = byId('progressText', 'progress-text');
  els.progressFill = byId('progressFill', 'progress-fill');
}

// ─── 主渲染 ────────────────────────────────────────────────────────────────────

export function updateTimerDisplay(): void {
  if (els.timeDisplay) {
    els.timeDisplay.textContent = formatMs(getElapsedTimeMs());
  }
}

let _lastGridCols = 0;
let _lastGridRows = 0;

export function render(): void {
  // 统计数值——无论 board/grid 状态如何都要更新
  const cfg = getLevelConfig(state.levelIndex);
  const par = cfg?.parMoves ?? 0;
  if (els.moveCount) {
    els.moveCount.textContent = String(state.moves);
    if (par > 0 && state.moves > 0) {
      els.moveCount.style.color = state.moves <= par ? 'var(--goal)' : state.moves <= par * 1.5 ? 'var(--accent)' : 'var(--danger)';
    } else {
      els.moveCount.style.color = '';
    }
  }
  if (els.pushCount)  els.pushCount.textContent  = String(state.pushes);
  if (els.levelLabel) els.levelLabel.textContent = `${state.levelIndex + 1} / ${LEVELS.length}`;
  if (els.timeDisplay) els.timeDisplay.textContent = formatMs(getElapsedTimeMs());
  if (els.parMoves && cfg) els.parMoves.textContent = String(par || '-');
  const rec = getRecord(state.levelIndex);
  if (els.bestMoves) els.bestMoves.textContent = formatBest(rec);
  if (els.bestRank)  els.bestRank.textContent  = rec?.bestRank ?? '';
  renderProgress();

  const board = els.board;
  if (!board) return;

  const grid   = state.grid;
  const rows   = grid.length;
  const cols   = rows > 0 ? grid[0].length : 0;
  if (rows === 0 || cols === 0) return;

  // grid 布局尺寸（只在尺寸变化时更新，避免每帧触发 layout）
  if (cols !== _lastGridCols || rows !== _lastGridRows) {
    board.style.gridTemplateColumns = `repeat(${cols}, var(--tile-size))`;
    board.style.gridTemplateRows    = `repeat(${rows}, var(--tile-size))`;
    _lastGridCols = cols;
    _lastGridRows = rows;
  }

  // 复用 DOM 节点
  const needed = rows * cols;
  while (board.children.length > needed) {
    board.removeChild(board.lastChild!);
  }
  while (board.children.length < needed) {
    board.appendChild(document.createElement('div'));
  }

  const px = state.player.x;
  const py = state.player.y;
  const deadlockSet = new Set(
    (state.effects.deadlocks ?? []).map((p: Pos) => `${p.x},${p.y}`)
  );

  let idx = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = board.children[idx++] as HTMLElement;
      const tile = grid[y][x];
      const isPlayer =
        tile === TILE.PLAYER || tile === TILE.PLAYER_ON_GOAL ||
        (px === x && py === y);

      cell.className = 'tile';
      cell.removeAttribute('data-facing');
      cell.removeAttribute('data-step');

      switch (tile) {
        case TILE.WALL:           cell.classList.add('wall'); break;
        case TILE.GOAL:           cell.classList.add('goal'); break;
        case TILE.BOX:            cell.classList.add('crate'); break;
        case TILE.BOX_ON_GOAL:    cell.classList.add('crate', 'goal'); break;
        case TILE.PLAYER_ON_GOAL: cell.classList.add('goal'); break;
        default: break;
      }

      if (isPlayer) {
        cell.classList.add('player');
        cell.dataset.facing = state.facing || 'down';
        cell.dataset.step = String(state.stepFrame ?? 0);
        if (state.playerMoved) cell.classList.add('moving');
      }

      // 特效
      if (
        state.effects.goalFlash &&
        state.effects.goalFlash.x === x &&
        state.effects.goalFlash.y === y
      ) {
        cell.classList.add('flash');
      }
      if (
        state.effects.cratePulse &&
        state.effects.cratePulse.x === x &&
        state.effects.cratePulse.y === y
      ) {
        cell.classList.add('pulse');
      }
      if (deadlockSet.has(`${x},${y}`)) cell.classList.add('deadlock');

      // AI 提示箭头
      if (
        state.ai.hintBox &&
        state.ai.hintBox.x === x &&
        state.ai.hintBox.y === y &&
        cell.classList.contains('crate')
      ) {
        cell.classList.add('hint-box');
      }
    }
  }

  board.classList.toggle('is-won', state.won);
  if (state.effects.shake) {
    board.classList.remove('shake');
    void board.offsetWidth; // 重启动画
    board.classList.add('shake');
  }

  // 一次性特效：渲染后清除，便于下次触发
  state.playerMoved = false;
  state.effects.shake = false;
  state.effects.goalFlash = null;
  state.effects.cratePulse = null;
}

// ─── 进度条 ────────────────────────────────────────────────────────────────────

let _progressCache = -1;
export function markProgressDirty(): void { _progressCache = -1; }

export function renderProgress(): void {
  const total   = LEVELS.length;
  let cleared = 0, challenged = 0, stars3 = 0;
  for (let i = 0; i < total; i++) {
    const rec = getRecord(i);
    if (rec?.bestMoves && rec.bestMoves > 0) {
      cleared++;
      if (rec.challengeCleared) challenged++;
      if (rec.bestRank === '★★★') stars3++;
    }
  }
  // 用 cleared*1000 + challenged*100 + stars3 做缓存键
  const cacheKey = cleared * 1000000 + challenged * 1000 + stars3;
  if (cacheKey === _progressCache) return;
  _progressCache = cacheKey;
  const pct = total > 0 ? Math.round((cleared / total) * 100) : 0;
  if (els.progressText) els.progressText.textContent = `已通关 ${cleared}/${total} · 挑战 ${challenged}/${total} · ★ ${stars3}`;
  if (els.progressFill) (els.progressFill as HTMLElement).style.width = `${pct}%`;
}

// ─── 关卡预览 canvas ───────────────────────────────────────────────────────────

export function renderLevelPreview(
  canvas: HTMLCanvasElement,
  map: string[]
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rows = map.length;
  const cols = map[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return;

  const W = canvas.width;
  const H = canvas.height;
  const cell = Math.min(Math.floor(W / cols), Math.floor(H / rows));
  const offX = Math.floor((W - cell * cols) / 2);
  const offY = Math.floor((H - cell * rows) / 2);

  ctx.clearRect(0, 0, W, H);

  const COLORS: Record<string, string> = {
    [TILE.WALL]:           '#5a5a7a',
    [TILE.FLOOR]:          '#e8e4d0',
    [TILE.GOAL]:           '#f0c040',
    [TILE.BOX]:            '#b07030',
    [TILE.BOX_ON_GOAL]:    '#50c050',
    [TILE.PLAYER]:         '#4080ff',
    [TILE.PLAYER_ON_GOAL]: '#4080ff',
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile  = map[r][c];
      const color = COLORS[tile] ?? 'transparent';
      if (color === 'transparent') continue;
      ctx.fillStyle = color;
      ctx.fillRect(offX + c * cell, offY + r * cell, cell, cell);
    }
  }
}

// ─── 消息提示 ──────────────────────────────────────────────────────────────────

let _messageTimer: ReturnType<typeof setTimeout> | null = null;

export function setMessage(text: string, type: string = 'info'): void {
  const el = els.message;
  if (!el) return;

  if (_messageTimer !== null) {
    clearTimeout(_messageTimer);
    _messageTimer = null;
  }

  el.textContent = text;
  const typeClassMap: Record<string, string> = {
    info: 'is-info',
    warn: 'is-warn',
    win: 'is-win',
    error: 'is-error',
  };
  const cls = typeClassMap[type] ?? 'is-info';
  el.className = `message ${cls}`;

  if (text) {
    _messageTimer = setTimeout(() => {
      el.className = 'message';
      _messageTimer = null;
    }, 3000);
  }
}

// ─── 自动缩放棋盘 ─────────────────────────────────────────────────────────────

export function autoScaleBoard(): void {
  const board = els.board;
  if (!board) return;

  const rows = state.grid.length;
  const cols = rows > 0 ? state.grid[0].length : 0;
  if (rows === 0 || cols === 0) return;

  const container = board.parentElement as HTMLElement | null;
  if (!container) return;

  const px = (raw: string): number => {
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  };

  const containerStyle = getComputedStyle(container);
  const padX = px(containerStyle.paddingLeft) + px(containerStyle.paddingRight);
  const padY = px(containerStyle.paddingTop) + px(containerStyle.paddingBottom);
  const gap = px(containerStyle.gap || '0');

  const containerW = container.clientWidth || window.innerWidth;
  const containerH = Math.min(container.clientHeight || window.innerHeight, window.innerHeight);

  const contentW = containerW - padX;
  const contentH = containerH - padY;

  let siblingsH = 0;
  let visibleSiblings = 0;
  for (const el of Array.from(container.children)) {
    if (!(el instanceof HTMLElement)) continue;
    if (el === board) continue;
    const s = getComputedStyle(el);
    if (s.display === 'none') continue;
    if (s.position === 'absolute' || s.position === 'fixed') continue;
    siblingsH += el.offsetHeight + px(s.marginTop) + px(s.marginBottom);
    visibleSiblings++;
  }

  // container is a vertical flex; gaps exist between each in-flow child
  const availableH = contentH - siblingsH - gap * visibleSiblings;
  const availableW = contentW;

  const boardStyle = getComputedStyle(board);
  const boardExtraW =
    px(boardStyle.paddingLeft) +
    px(boardStyle.paddingRight) +
    px(boardStyle.borderLeftWidth) +
    px(boardStyle.borderRightWidth);
  const boardExtraH =
    px(boardStyle.paddingTop) +
    px(boardStyle.paddingBottom) +
    px(boardStyle.borderTopWidth) +
    px(boardStyle.borderBottomWidth);

  const gridW = availableW - boardExtraW;
  const gridH = availableH - boardExtraH;
  if (gridW <= 0 || gridH <= 0) return;

  const cellByW = Math.floor(gridW / cols);
  const cellByH = Math.floor(gridH / rows);

  // Allow larger tiles on wide screens so the board can better fill the center stage.
  // The value is still constrained by gridW/gridH, so it won't overflow the container.
  const maxCell = 120;
  const cell    = Math.max(16, Math.min(cellByW, cellByH, maxCell));

  document.documentElement.style.setProperty('--tile-size', `${cell}px`);

  // Sprite pixel-art is authored at a 48px baseline tile. When tiles grow, scale the
  // player/crate sprites too (but don't scale down below 1 to keep the original look).
  const baseTile = 48;
  const spriteScale = cell > baseTile ? cell / baseTile : 1;
  document.documentElement.style.setProperty('--sprite-scale', spriteScale.toFixed(4));
  document.documentElement.style.setProperty('--sprite-inset-crate', `${Math.round(7 * spriteScale)}px`);
  document.documentElement.style.setProperty('--sprite-inset-player', `${Math.round(8 * spriteScale)}px`);
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

let _confettiAnimId: number | null = null;
let _confettiCanvas: HTMLCanvasElement | null = null;
let _confettiResize: (() => void) | null = null;

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  color: string;
  angle: number;
  spin: number;
  life: number;
}

export function startConfetti(rank: string | null, challenge: boolean): void {
  stopConfetti();

  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  Object.assign(canvas.style, {
    position:      'fixed',
    top:           '0',
    left:          '0',
    width:         '100%',
    height:        '100%',
    pointerEvents: 'none',
    zIndex:        '9999',
  });
  document.body.appendChild(canvas);
  _confettiCanvas = canvas;

  const resize = (): void => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  _confettiResize = resize;
  resize();
  window.addEventListener('resize', resize);

  const ctx = canvas.getContext('2d')!;

  const palette: string[] = challenge
    ? ['#ff4444', '#ff8800', '#ffdd00', '#44ff44', '#4488ff', '#cc44ff']
    : rank === '★★★'
    ? ['#ffd700', '#ffec6e', '#fff0a0', '#ffd700']
    : rank === '★★'
    ? ['#c0c0c0', '#e8e8e8', '#a0a0a0']
    : ['#4488ff', '#88bbff', '#2255cc'];

  const COUNT = 120;
  const particles: Particle[] = [];
  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height * 0.4 - canvas.height * 0.1,
      vx:    (Math.random() - 0.5) * 4,
      vy:    Math.random() * 3 + 1,
      r:     Math.random() * 6 + 3,
      color: palette[Math.floor(Math.random() * palette.length)],
      angle: Math.random() * Math.PI * 2,
      spin:  (Math.random() - 0.5) * 0.2,
      life:  1,
    });
  }

  const tick = (): void => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.x     += p.vx;
      p.y     += p.vy;
      p.vy    += 0.05;
      p.angle += p.spin;
      p.life  -= 0.004;
      if (p.life <= 0 || p.y > canvas.height + 20) continue;
      alive = true;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life * 3);
      ctx.fillStyle   = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      ctx.restore();
    }
    if (alive) {
      _confettiAnimId = requestAnimationFrame(tick);
    } else {
      stopConfetti();
    }
  };

  _confettiAnimId = requestAnimationFrame(tick);
}

export function stopConfetti(): void {
  if (_confettiAnimId !== null) {
    cancelAnimationFrame(_confettiAnimId);
    _confettiAnimId = null;
  }
  if (_confettiResize !== null) {
    window.removeEventListener('resize', _confettiResize);
    _confettiResize = null;
  }
  if (_confettiCanvas) {
    _confettiCanvas.remove();
    _confettiCanvas = null;
  }
}

// ─── 翻转动画 ─────────────────────────────────────────────────────────────────

export function applyFlipAnimation(): void {
  const board = els.board;
  if (!board) return;
  board.classList.remove('flip-anim');
  void board.offsetWidth; // 强制重排，重启动画
  board.classList.add('flip-anim');
  board.addEventListener(
    'animationend',
    () => board.classList.remove('flip-anim'),
    { once: true }
  );
}
