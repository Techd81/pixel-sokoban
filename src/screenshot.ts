// ─── 屏幕截图系统 Screenshot System ─────────────────────────────────────────
import { TILE } from './types';
import { state } from './game';

export interface ScreenshotOptions {
  watermark?: boolean;
  watermarkText?: string;
  format?: 'png' | 'jpeg';
}

// 用 game state 重绘棋盘到 canvas（真实截图）
export function captureBoard(opts: ScreenshotOptions = {}): HTMLCanvasElement | null {
  const { watermark = true, watermarkText = 'PIXEL SOKOBAN' } = opts;
  const grid = state.grid;
  if (!grid || grid.length === 0) return null;

  const rows = grid.length;
  const cols = Math.max(...grid.map(r => r.length));
  const TILE_PX = 32;
  const PAD = 12;
  const W = cols * TILE_PX + PAD * 2;
  const H = rows * TILE_PX + PAD * 2 + (watermark ? 22 : 0);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 背景
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#17121f';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 颜色表
  const COLORS: Record<string, string> = {
    [TILE.WALL]:           '#5c4b73',
    [TILE.GOAL]:           '#ffd166',
    [TILE.BOX]:            '#c98f52',
    [TILE.BOX_ON_GOAL]:    '#06d6a0',
    [TILE.PLAYER]:         '#7ee081',
    [TILE.PLAYER_ON_GOAL]: '#7ee081',
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = (grid[r]?.[c]) ?? ' ';
      const color = COLORS[tile] ?? '#3c3150';
      const x = PAD + c * TILE_PX;
      const y = PAD + r * TILE_PX;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, TILE_PX - 1, TILE_PX - 1);

      // 目标点高亮圆点
      if (tile === TILE.GOAL) {
        ctx.fillStyle = '#ffbe0b';
        ctx.beginPath();
        ctx.arc(x + TILE_PX/2, y + TILE_PX/2, TILE_PX/5, 0, Math.PI * 2);
        ctx.fill();
      }
      // 玩家标识
      if (tile === TILE.PLAYER || tile === TILE.PLAYER_ON_GOAL) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${TILE_PX * 0.6}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('@', x + TILE_PX/2, y + TILE_PX/2);
        ctx.textBaseline = 'alphabetic';
      }
    }
  }

  // 水印
  if (watermark) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(
      `${watermarkText}  L${state.levelIndex + 1}  ${state.moves}步`,
      W - 8,
      H - 6
    );
  }

  return canvas;
}

export function downloadScreenshot(canvas: HTMLCanvasElement, filename?: string): void {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = filename || `sokoban_L${state.levelIndex + 1}_${Date.now()}.png`;
  a.click();
}

export function showScreenshotPreview(canvas: HTMLCanvasElement): void {
  const existing = document.getElementById('screenshotModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'screenshotModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px';

  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  img.style.cssText = 'max-width:90vw;max-height:70vh;border:3px solid #8be9fd;border-radius:8px;image-rendering:pixelated';

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:10px';

  const dlBtn = document.createElement('button');
  dlBtn.textContent = '⬇ 下载截图';
  dlBtn.style.cssText = 'padding:10px 24px;background:#8be9fd;color:#17121f;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:1em';
  dlBtn.onclick = () => downloadScreenshot(canvas);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '关闭';
  closeBtn.style.cssText = 'padding:10px 24px;background:#56406f;color:#f6f1ff;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:1em';
  closeBtn.onclick = () => modal.remove();

  btnRow.appendChild(dlBtn);
  btnRow.appendChild(closeBtn);
  modal.appendChild(img);
  modal.appendChild(btnRow);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  // ESC 关闭
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', onKey); }
  };
  document.addEventListener('keydown', onKey);
  closeBtn.addEventListener('click', () => document.removeEventListener('keydown', onKey));

  document.body.appendChild(modal);
}
