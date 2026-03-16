// ─── 关卡小地图 Mini Map ──────────────────────────────────────────────────────
import type { Pos } from './types';
import { TILE } from './types';

const COLORS: Record<string, string> = {
  [TILE.WALL]:           '#5c4b73',
  [TILE.FLOOR]:          '#3c3150',
  [TILE.GOAL]:           '#ffd166',
  [TILE.BOX]:            '#c98f52',
  [TILE.PLAYER]:         '#7ee081',
  [TILE.BOX_ON_GOAL]:    '#06d6a0',
  [TILE.PLAYER_ON_GOAL]: '#7ee081',
};

export function renderMinimap(
  canvas: HTMLCanvasElement,
  grid: string[][],
  player: Pos,
  goals: Pos[],
  options: { borderColor?: string; scale?: number } = {}
): void {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const rows = grid.length;
  const cols = Math.max(...grid.map(r => r.length));
  const tw = canvas.width / cols;
  const th = canvas.height / rows;
  ctx.fillStyle = '#17121f'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = (grid[y]||[])[x] || ' ';
      ctx.fillStyle = COLORS[cell] || '#3c3150';
      ctx.fillRect(x*tw+0.5, y*th+0.5, tw-1, th-1);
    }
  }
  // Player glow
  ctx.fillStyle = '#7ee081';
  ctx.beginPath();
  ctx.arc((player.x+0.5)*tw, (player.y+0.5)*th, Math.max(tw,th)*0.7, 0, Math.PI*2);
  ctx.fill();
  if (options.borderColor) {
    ctx.strokeStyle = options.borderColor; ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width-2, canvas.height-2);
  }
}

export function createMinimapOverlay(
  parentEl: HTMLElement,
  size = 120
): HTMLCanvasElement {
  let canvas = document.getElementById('sokoban-minimap') as HTMLCanvasElement;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'sokoban-minimap';
    canvas.width = size; canvas.height = size;
    canvas.style.cssText = `position:absolute;bottom:8px;right:8px;border-radius:4px;opacity:0.85;pointer-events:none;z-index:100;border:1px solid #5c4b73`;
    parentEl.style.position = 'relative';
    parentEl.appendChild(canvas);
  }
  return canvas;
}
