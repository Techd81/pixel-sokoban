// ─── 连击系统增强 Enhanced Combo System ─────────────────────────────────────
export interface ComboState {
  count: number;
  lastPushMs: number;
  maxCombo: number;
  multiplier: number;
}

export const COMBO_TIMEOUT_MS = 2000;

export function calcMultiplier(count: number): number {
  if (count < 2) return 1;
  if (count < 4) return 1.5;
  if (count < 7) return 2;
  if (count < 10) return 3;
  return 5;
}

export function getComboLabel(count: number): string {
  if (count < 2) return '';
  if (count < 4) return 'COMBO!';
  if (count < 7) return 'GREAT!!';
  if (count < 10) return 'AMAZING!!!';
  return 'LEGENDARY!!!!'
}

export function getComboColor(count: number): string {
  if (count < 4) return '#ffd166';
  if (count < 7) return '#ff79c6';
  if (count < 10) return '#bd93f9';
  return '#f72585';
}

export function updateCombo(state: ComboState, isPush: boolean, now = performance.now()): ComboState {
  if (!isPush) {
    const expired = now - state.lastPushMs > COMBO_TIMEOUT_MS;
    return expired ? { ...state, count: 0, multiplier: 1 } : state;
  }
  const count = state.count + 1;
  const multiplier = calcMultiplier(count);
  const maxCombo = Math.max(state.maxCombo, count);
  return { count, lastPushMs: now, maxCombo, multiplier };
}

export function renderComboHUD(container: HTMLElement, state: ComboState): void {
  if (state.count < 2) { container.style.display='none'; return; }
  container.style.display = 'block';
  const color = getComboColor(state.count);
  container.innerHTML = `
    <span style="color:${color};font-size:1.4em;font-weight:bold;text-shadow:0 0 10px ${color}">
      ${getComboLabel(state.count)} ×${state.count}
    </span>
    <span style="color:#888;font-size:0.8em"> ×${state.multiplier.toFixed(1)}</span>
  `;
}
