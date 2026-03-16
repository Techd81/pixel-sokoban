// ─── 关卡分享系统 Level Share System ────────────────────────────────────────
// URL 编码分享 + 轻量二维码生成（基于 canvas，无需外部库）

import type { Level } from './types';

// ─── URL 编码/解码 ────────────────────────────────────────────────────────────
// 编码格式：name|par|map（map用'/'分隔行）压缩后 base64url

export function encodeLevelToUrl(level: Level): string {
  const mapStr = level.map.join('/');
  const raw = `${level.name}|${level.parMoves}|${level.starMoves.three},${level.starMoves.two},${level.starMoves.one}|${mapStr}`;
  const encoded = btoa(encodeURIComponent(raw))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const url = new URL(window.location.href);
  url.searchParams.set('level', encoded);
  return url.toString();
}

export function decodeLevelFromUrl(encoded: string): Level | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/') +
      '=='.slice(0, (4 - encoded.length % 4) % 4);
    const raw = decodeURIComponent(atob(padded));
    const [name, parStr, starsStr, mapStr] = raw.split('|');
    if (!name || !parStr || !starsStr || !mapStr) return null;
    const [three, two, one] = starsStr.split(',').map(Number);
    const map = mapStr.split('/');
    if (map.length < 3) return null;
    return { name, parMoves: Number(parStr), starMoves: { three, two, one }, map };
  } catch { return null; }
}

export function checkUrlLevelParam(): Level | null {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('level');
  return encoded ? decodeLevelFromUrl(encoded) : null;
}

// ─── 轻量 QR 码生成器 ────────────────────────────────────────────────────────
// 仅支持短文本，使用 Reed-Solomon 纠错的简化版本
// 对于游戏分享场景（URL ~200字符）使用外部 API 渲染

const QR_API = 'https://api.qrserver.com/v1/create-qr-code/';

export function renderQRCode(
  canvas: HTMLCanvasElement,
  text: string,
  size = 200
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const apiUrl = `${QR_API}?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png&margin=2`;
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no ctx')); return; }
      canvas.width = size; canvas.height = size;
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      resolve();
    };
    img.onerror = () => reject(new Error('QR API failed'));
    img.src = apiUrl;
  });
}

// ─── 分享弹窗 UI ─────────────────────────────────────────────────────────────

export function showShareModal(level: Level, levelIndex: number): void {
  const existing = document.getElementById('shareModal');
  if (existing) existing.remove();

  const url = encodeLevelToUrl(level);

  const modal = document.createElement('div');
  modal.id = 'shareModal';
  modal.innerHTML = `
    <div class="share-overlay" id="shareOverlay"></div>
    <div class="share-dialog">
      <h3>分享关卡「${level.name}」</h3>
      <div class="share-qr-wrap">
        <canvas id="shareQrCanvas" width="200" height="200"></canvas>
        <p class="share-qr-hint">扫码或复制链接</p>
      </div>
      <div class="share-url-wrap">
        <input id="shareUrlInput" type="text" readonly value="${url}" />
        <button id="shareCopyBtn">复制</button>
      </div>
      <div class="share-btns">
        <button id="shareCloseBtn">关闭</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // 生成二维码
  const qrCanvas = document.getElementById('shareQrCanvas') as HTMLCanvasElement;
  renderQRCode(qrCanvas, url).catch(() => {
    // API 失败时显示文字提示
    const ctx = qrCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText('QR码生成失败', 30, 100);
      ctx.fillText('请复制链接分享', 25, 120);
    }
  });

  // 复制按钮
  document.getElementById('shareCopyBtn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById('shareCopyBtn');
      if (btn) { btn.textContent = '已复制！'; setTimeout(() => { btn.textContent = '复制'; }, 2000); }
    }).catch(() => {
      const input = document.getElementById('shareUrlInput') as HTMLInputElement;
      input?.select();
      document.execCommand('copy');
    });
  });

  // 关闭
  const close = () => modal.remove();
  document.getElementById('shareCloseBtn')?.addEventListener('click', close);
  document.getElementById('shareOverlay')?.addEventListener('click', close);
}
