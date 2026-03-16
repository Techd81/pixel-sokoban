// ─── PWA 增强模块 PWA Enhancement ───────────────────────────────────────────
// 安装提示、离线状态检测、更新通知

let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function initPWA(onInstallable?: () => void): void {
  // 捕获安装提示事件
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    onInstallable?.();
    showInstallBanner();
  });

  // 安装成功
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallBanner();
    console.log('PWA installed');
  });

  // 离线检测
  updateOnlineStatus();
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // SW 更新检测
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner();
            }
          });
        });
      })
      .catch(e => console.warn('SW fail', e));
  }
}

export async function triggerInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === 'accepted';
}

function updateOnlineStatus(): void {
  const badge = document.getElementById('offlineBadge');
  if (badge) badge.classList.toggle('show', !navigator.onLine);
}

function showInstallBanner(): void {
  let banner = document.getElementById('pwaInstallBanner');
  if (banner) { banner.classList.remove('hidden'); return; }
  banner = document.createElement('div');
  banner.id = 'pwaInstallBanner';
  banner.style.cssText = [
    'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
    'background:#282a36', 'border:2px solid #50fa7b', 'border-radius:12px',
    'padding:12px 20px', 'z-index:8000', 'display:flex', 'gap:12px',
    'align-items:center', 'color:#f8f8f2', 'font-family:monospace',
    'box-shadow:0 4px 16px rgba(0,0,0,0.5)',
  ].join(';');
  banner.innerHTML = `
    <span>📲 安装到主屏幕，随时离线畅玩</span>
    <button id="pwaInstallBtn" style="background:#50fa7b;color:#17121f;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:bold">安装</button>
    <button id="pwaInstallClose" style="background:none;border:none;color:#888;cursor:pointer;font-size:1.2em">×</button>
  `;
  document.body.appendChild(banner);
  document.getElementById('pwaInstallBtn')?.addEventListener('click', async () => {
    const ok = await triggerInstall();
    if (ok) hideInstallBanner();
  });
  document.getElementById('pwaInstallClose')?.addEventListener('click', hideInstallBanner);
}

function hideInstallBanner(): void {
  document.getElementById('pwaInstallBanner')?.remove();
}

function showUpdateBanner(): void {
  let banner = document.getElementById('pwaUpdateBanner');
  if (banner) return;
  banner = document.createElement('div');
  banner.id = 'pwaUpdateBanner';
  banner.style.cssText = [
    'position:fixed', 'top:16px', 'left:50%', 'transform:translateX(-50%)',
    'background:#282a36', 'border:2px solid #8be9fd', 'border-radius:10px',
    'padding:10px 18px', 'z-index:8000', 'display:flex', 'gap:10px',
    'align-items:center', 'color:#f8f8f2', 'font-family:monospace',
  ].join(';');
  banner.innerHTML = `
    <span>🔄 发现新版本</span>
    <button id="pwaReloadBtn" style="background:#8be9fd;color:#17121f;border:none;padding:5px 12px;border-radius:6px;cursor:pointer">立即更新</button>
  `;
  document.body.appendChild(banner);
  document.getElementById('pwaReloadBtn')?.addEventListener('click', () => window.location.reload());
}
