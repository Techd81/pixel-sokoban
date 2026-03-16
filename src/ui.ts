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
  els.board        = document.getElementById('board');
  els.moveCount    = document.getElementById('move-count');
  els.pushCount    = document.getElementById('push-count');
  els.parMoves     = document.getElementById('par-moves');
  els.bestMoves    = document.getElementById('best-moves');
  els.bestRank     = document.getElementById('best-rank');
  els.levelLabel   = document.getElementById('level-label');
  els.message      = document.getElementById('message');
  els.timeDisplay  = document.getElementById('time-display');
  els.progressText = document.getElementById('progress-text');
  els.progressFill = document.getElementById('progress-fill');
}

// ─── 主渲染 ────────────────────────────────────────────────────────────────────

export function render(): void {
  const board = els.board;
  if (!board) return;

  const grid   = state.grid;
  const rows   = grid.length;
  const cols   = rows > 0 ? grid[0].length : 0;
  if (rows === 0 || cols === 0) return;

  // grid 布局尺寸
  board.style.gridTemplateColumns = `repeat(${cols}, var(--cell))`;
  board.style.gridTemplateRows    = `repeat(${rows}, var(--cell))`;

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
  const prevBoxSet = new Set(
    (state.effects.prevBoxes ?? []).map(b => `${b.from.x},${b.from.y}`)
  );

  let idx = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = board.children[idx++] as HTMLElement;
      const tile = grid[y][x];
      const isPlayer =
        tile === TILE.PLAYER || tile === TILE.PLAYER_ON_GOAL ||
        (px === x && py === y);

      cell.className = 'cell';

      switch (tile) {
        case TILE.WALL:           cell.classList.add('wall');            break;
        case TILE.FLOOR:          cell.classList.add('floor');           break;
        case TILE.GOAL:           cell.classList.add('goal');            break;
        case TILE.PLAYER_ON_GOAL: cell.classList.add('goal');            break;
        case TILE.BOX:            cell.classList.add('box');             break;
        case TILE.BOX_ON_GOAL:    cell.classList.add('box', 'on-goal'); break;
        default:                  cell.classList.add('empty');           break;
      }

      if (isPlayer) {
        cell.classList.add('player');
        if (state.facing) cell.classList.add(`dir-${state.facing}`);
        if (state.playerMoved && state.stepFrame === 1) cell.classList.add('step1');
      }

      // 特效
      if (state.effects.shake && isPlayer) cell.classList.add('shake');
      if (
        state.effects.goalFlash &&
        state.effects.goalFlash.x === x &&
        state.effects.goalFlash.y === y
      ) {
        cell.classList.add('goal-flash');
      }
      if (
        state.effects.cratePulse &&
        state.effects.cratePulse.x === x &&
        state.effects.cratePulse.y === y
      ) {
        cell.classList.add('crate-pulse');
      }
      if (deadlockSet.has(`${x},${y}`)) cell.classList.add('deadlock');
      if (prevBoxSet.has(`${x},${y}`))  cell.classList.add('box-moved');

      // AI 提示箭头
      if (
        state.ai.hintArrow &&
        state.ai.hintBox &&
        state.ai.hintBox.x === x &&
        state.ai.hintBox.y === y
      ) {
        cell.classList.add('hint-box', `hint-${state.ai.hintArrow}`);
      }
    }
  }

  // 统计数值
  if (els.moveCount)  els.moveCount.textContent  = String(state.moves);
  if (els.pushCount)  els.pushCount.textContent  = String(state.pushes);

  const cfg = getLevelConfig(state.levelIndex);
  if (els.parMoves && cfg) {
    els.parMoves.textContent = String(cfg.parMoves ?? '-');
  }

  const rec = getRecord(state.levelIndex);
  if (els.bestMoves) els.bestMoves.textContent = formatBest(rec);
  if (els.bestRank)  els.bestRank.textContent  = rec?.bestRank ?? '';

  if (els.levelLabel && cfg) {
    els.levelLabel.textContent = cfg.name ?? `Level ${state.levelIndex + 1}`;
  }

  if (els.timeDisplay) {
    els.timeDisplay.textContent = formatMs(getElapsedTimeMs());
  }

  renderProgress();
  autoScaleBoard();
}

// ─── 进度条 ────────────────────────────────────────────────────────────────────

export function renderProgress(): void {
  const total   = LEVELS.length;
  const cleared = LEVELS.filter((_: unknown, i: number) => (getRecord(i)?.bestMoves ?? 0) > 0).length;
  const pct     = total > 0 ? Math.round((cleared / total) * 100) : 0;

  if (els.progressText) {
    els.progressText.textContent = `${cleared} / ${total}`;
  }
  if (els.progressFill) {
    (els.progressFill as HTMLElement).style.width = `${pct}%`;
  }
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
  el.className   = `message message--${type} message--visible`;

  if (text) {
    _messageTimer = setTimeout(() => {
      el.classList.remove('message--visible');
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

  const maxW = container.clientWidth  || window.innerWidth;
  const maxH = container.clientHeight || window.innerHeight;

  const cellByW = Math.floor(maxW / cols);
  const cellByH = Math.floor(maxH / rows);
  const cell    = Math.max(16, Math.min(cellByW, cellByH, 64));

  document.documentElement.style.setProperty('--cell', `${cell}px`);
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
