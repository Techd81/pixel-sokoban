// ─── 关卡分享系统 Level Share System ────────────────────────────────────────
// URL 编码分享 + 轻量二维码生成（基于 canvas，无需外部库）

import type { Level } from './types';
import { copyText, escapeHtml } from './web_utils';

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
    // 安全限制：编码串不能超过4KB
    if (encoded.length > 4096) return null;
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/') +
      '=='.slice(0, (4 - encoded.length % 4) % 4);
    const raw = decodeURIComponent(atob(padded));
    // 解码后原始字符串不能超过2KB
    if (raw.length > 2048) return null;
    const [name, parStr, starsStr, mapStr] = raw.split('|');
    if (!name || !parStr || !starsStr || !mapStr) return null;
    // 名称长度限制
    if (name.length > 50) return null;
    const [three, two, one] = starsStr.split(',').map(Number);
    if ([three, two, one].some(n => !Number.isFinite(n) || n < 0 || n > 9999)) return null;
    const map = mapStr.split('/');
    // 地图行数限制：3~20行
    if (map.length < 3 || map.length > 20) return null;
    // 每行长度限制：3~30字符，且只含合法推箱子字符
    const validChars = /^[# .@$*+\s]*$/;
    if (map.some(row => row.length < 3 || row.length > 30 || !validChars.test(row))) return null;
    // 必须有且只有一个玩家
    const flat = map.join('');
    if ((flat.match(/@/g)||[]).length !== 1) return null;
    // 箱子数必须等于目标数
    const boxes = (flat.match(/\$/g)||[]).length + (flat.match(/\*/g)||[]).length;
    const goals = (flat.match(/\./g)||[]).length + (flat.match(/\*/g)||[]).length + (flat.match(/\+/g)||[]).length;
    if (boxes !== goals || boxes === 0) return null;
    const parMoves = Number(parStr);
    if (!Number.isFinite(parMoves) || parMoves < 1 || parMoves > 9999) return null;
    return { name: name.trim(), parMoves, starMoves: { three, two, one }, map };
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
      <h3>分享关卡「${escapeHtml(level.name)}」</h3>
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
  document.getElementById('shareCopyBtn')?.addEventListener('click', async () => {
    if (await copyText(url)) {
      const btn = document.getElementById('shareCopyBtn');
      if (btn) { btn.textContent = '已复制！'; setTimeout(() => { btn.textContent = '复制'; }, 2000); }
      return;
    }
    const input = document.getElementById('shareUrlInput') as HTMLInputElement | null;
    input?.focus();
    input?.select();
  });

  // 关闭
  const close = () => modal.remove();
  document.getElementById('shareCloseBtn')?.addEventListener('click', close);
  document.getElementById('shareOverlay')?.addEventListener('click', close);
}
