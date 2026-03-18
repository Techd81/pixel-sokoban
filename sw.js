// 像素推箱子 Service Worker
const CACHE_NAME = 'pixel-sokoban-v4';

async function collectInstallAssets() {
  const response = await fetch('./', { cache: 'no-store' });
  const html = await response.text();
  const assets = new Set(['./']);
  const attrRegex = /(?:href|src)="([^"]+)"/g;
  let match;

  while ((match = attrRegex.exec(html)) !== null) {
    const raw = match[1];
    if (!raw || raw.startsWith('http') || raw.startsWith('data:') || raw.startsWith('#')) continue;
    assets.add(new URL(raw, self.registration.scope).toString());
  }

  const manifestUrl = [...assets].find((asset) => asset.includes('manifest') && asset.endsWith('.json'));
  if (manifestUrl) {
    try {
      const manifest = await fetch(manifestUrl, { cache: 'no-store' }).then((res) => res.json());
      for (const icon of manifest.icons || []) {
        if (!icon?.src) continue;
        assets.add(new URL(icon.src, manifestUrl).toString());
      }
    } catch {
      // Ignore manifest discovery failures and rely on runtime caching.
    }
  }

  return [...assets];
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const assets = await collectInstallAssets();
    await cache.addAll(assets.map((asset) => new Request(asset, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        await cache.put('./', response.clone());
        return response;
      } catch {
        return (await caches.match(event.request)) || (await caches.match('./'));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;

    try {
      const response = await fetch(event.request);
      if (response && response.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      return (await caches.match(event.request)) || Response.error();
    }
  })());
});
