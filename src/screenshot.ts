// ─── 屏幕截图系统 Screenshot System ─────────────────────────────────────────
export interface ScreenshotOptions {
  watermark?: boolean;
  watermarkText?: string;
  format?: 'png' | 'jpeg';
}

export function captureBoard(opts: ScreenshotOptions = {}): HTMLCanvasElement | null {
  const { watermark = true, watermarkText = 'PIXEL SOKOBAN' } = opts;
  const board = document.getElementById('board');
  if (!board) return null;
  const rect = board.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#17121f';
  ctx.fillStyle = bg; ctx.fillRect(0, 0, rect.width, rect.height);
  if (watermark) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(watermarkText || '', rect.width - 8, rect.height - 8);
  }
  return canvas;
}

export function downloadScreenshot(canvas: HTMLCanvasElement, filename?: string): void {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = filename || 'sokoban_' + Date.now() + '.png';
  a.click();
}

export function showScreenshotPreview(canvas: HTMLCanvasElement): void {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px';
  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  img.style.cssText = 'max-width:90vw;max-height:70vh;border:2px solid #8be9fd;border-radius:8px';
  const btn = document.createElement('button');
  btn.textContent = '⬇ 下载截图';
  btn.style.cssText = 'padding:10px 24px;background:#8be9fd;color:#17121f;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:1em';
  btn.onclick = () => downloadScreenshot(canvas);
  modal.appendChild(img); modal.appendChild(btn);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  document.body.appendChild(modal);
}
