// ─── 摄像机/视口系统 Camera/Viewport System ─────────────────────────────────
// 大地图时支持平移和缩放，跟踪玩家位置

export interface CameraState {
  x: number;       // 视口偏移
  y: number;
  scale: number;   // 缩放倍数 0.5~3
  targetX: number;
  targetY: number;
  targetScale: number;
}

export const defaultCamera = (): CameraState => ({
  x: 0, y: 0, scale: 1,
  targetX: 0, targetY: 0, targetScale: 1,
});

export function cameraFollowPlayer(
  cam: CameraState,
  px: number, py: number,
  tileSize: number,
  viewW: number, viewH: number
): CameraState {
  const targetX = viewW/2 - px * tileSize - tileSize/2;
  const targetY = viewH/2 - py * tileSize - tileSize/2;
  return { ...cam, targetX, targetY };
}

export function cameraLerp(cam: CameraState, dt: number, speed = 8): CameraState {
  const t = Math.min(1, speed * dt / 1000);
  return {
    ...cam,
    x: cam.x + (cam.targetX - cam.x) * t,
    y: cam.y + (cam.targetY - cam.y) * t,
    scale: cam.scale + (cam.targetScale - cam.scale) * t,
  };
}

export function applyCameraTransform(
  el: HTMLElement, cam: CameraState
): void {
  el.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`;
  el.style.transformOrigin = '0 0';
}

export function cameraZoom(cam: CameraState, delta: number): CameraState {
  const scale = Math.max(0.5, Math.min(3, cam.targetScale + delta));
  return { ...cam, targetScale: scale };
}

export function initCameraControls(
  el: HTMLElement,
  onUpdate: (cam: CameraState) => void
): () => void {
  let cam = defaultCamera();
  let isDragging = false;
  let dragStart = { x: 0, y: 0, cx: 0, cy: 0 };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    cam = cameraZoom(cam, e.deltaY > 0 ? -0.1 : 0.1);
    onUpdate(cam);
  };
  const onMouseDown = (e: MouseEvent) => {
    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY, cx: cam.targetX, cy: cam.targetY };
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    cam = { ...cam, targetX: dragStart.cx + e.clientX - dragStart.x, targetY: dragStart.cy + e.clientY - dragStart.y };
    onUpdate(cam);
  };
  const onMouseUp = () => { isDragging = false; };

  el.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  return () => {
    el.removeEventListener('wheel', onWheel);
    el.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };
}
