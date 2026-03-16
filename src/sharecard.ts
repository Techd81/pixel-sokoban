// ─── 社交分享卡片生成器 Social Share Card Generator ─────────────────────────
// 用 Canvas 生成精美分享图片，可下载或分享

import type { Level } from './types';
import { TILE } from './types';

export interface ShareCardOptions {
  levelName: string;
  levelIndex: number;
  moves: number;
  timeMs: number;
  rank: string;
  par: number;
  map: string[];
  playerName?: string;
}

export function generateShareCard(opts: ShareCardOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  // 背景渐变
  const grad = ctx.createLinearGradient(0, 0, 640, 360);
  grad.addColorStop(0, '#17121f');
  grad.addColorStop(1, '#1e1a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 640, 360);

  // 边框
  ctx.strokeStyle = '#8be9fd';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 624, 344);

  // 标题
  ctx.fillStyle = '#8be9fd';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('PIXEL SOKOBAN', 30, 50);

  // 关卡名
  ctx.fillStyle = '#f8f8f2';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`L${opts.levelIndex + 1} · ${opts.levelName}`, 30, 85);

  // 迷你地图预览
  const mapX = 30, mapY = 100;
  const mapW = 200, mapH = 180;
  const rows = opts.map.length;
  const cols = Math.max(...opts.map.map(r => r.length));
  const tw = mapW / cols, th = mapH / rows;
  const colors: Record<string, string> = {
    [TILE.WALL]: '#5c4b73', [TILE.FLOOR]: '#3c3150',
    [TILE.GOAL]: '#ffd166', [TILE.BOX]: '#c98f52',
    [TILE.PLAYER]: '#7ee081', [TILE.BOX_ON_GOAL]: '#06d6a0',
    [TILE.PLAYER_ON_GOAL]: '#7ee081',
  };
  ctx.fillStyle = '#17121f';
  ctx.fillRect(mapX, mapY, mapW, mapH);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const c = (opts.map[y] || '')[x] || ' ';
      ctx.fillStyle = colors[c] || '#3c3150';
      ctx.fillRect(mapX + x * tw + 0.5, mapY + y * th + 0.5, tw - 1, th - 1);
    }

  // 统计信息
  const statsX = 260, statsY = 110;
  const statItems = [
    { label: '步数', value: String(opts.moves), color: opts.moves <= opts.par ? '#50fa7b' : '#ffd166' },
    { label: '目标', value: String(opts.par), color: '#888' },
    { label: '时间', value: formatMs(opts.timeMs), color: '#8be9fd' },
    { label: '评级', value: opts.rank || '-', color: '#ffd700' },
  ];
  ctx.font = '14px monospace';
  statItems.forEach((s, i) => {
    const y = statsY + i * 42;
    ctx.fillStyle = '#555';
    ctx.fillText(s.label, statsX, y);
    ctx.fillStyle = s.color;
    ctx.font = 'bold 22px monospace';
    ctx.fillText(s.value, statsX, y + 24);
    ctx.font = '14px monospace';
  });

  // 玩家名
  if (opts.playerName) {
    ctx.fillStyle = '#bd93f9';
    ctx.font = '16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`👤 ${opts.playerName}`, 610, 50);
  }

  // 底部水印
  ctx.fillStyle = '#555';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('pixel-sokoban · ' + new Date().toLocaleDateString('zh-CN'), 320, 340);

  return canvas;
}

function formatMs(ms: number): string {
  if (!ms) return '-';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}:${String(s % 60).padStart(2, '0')}` : `${s}s`;
}

export function downloadShareCard(opts: ShareCardOptions): void {
  const canvas = generateShareCard(opts);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `sokoban_L${opts.levelIndex + 1}_${Date.now()}.png`;
  a.click();
}

export function showShareCardModal(opts: ShareCardOptions): void {
  const canvas = generateShareCard(opts);
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;z-index:10000';
  const inner = document.createElement('div');
  inner.style.cssText = 'background:#17121f;border:2px solid #8be9fd;border-radius:12px;padding:20px;text-align:center';
  canvas.style.cssText = 'max-width:90vw;border-radius:8px;display:block;margin:0 auto 12px';
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:10px;justify-content:center;margin-top:10px';
  const dlBtn = document.createElement('button');
  dlBtn.textContent = '⬇ 下载图片';
  dlBtn.style.cssText = 'background:#8be9fd;color:#17121f;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:bold';
  dlBtn.onclick = () => downloadShareCard(opts);
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕ 关闭';
  closeBtn.style.cssText = 'background:#44475a;color:#f8f8f2;border:none;padding:8px 16px;border-radius:6px;cursor:pointer';
  closeBtn.onclick = () => modal.remove();
  btnRow.append(dlBtn, closeBtn);
  inner.append(canvas, btnRow);
  modal.append(inner);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}
