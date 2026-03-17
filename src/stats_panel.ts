// ─── 统计面板 Stats Panel ─────────────────────────────────────────────────────
import type { Records } from './types';
import { renderStatsHeatmap } from './heatmap';
import { drawBarChart, drawLineChart, buildProgressData } from './charts';
import { renderActivityCalendar, setCalendarData } from './calendar';

// 使用 game.ts 中实际的 stats 结构（比 types.ts 中 PlayerStats 更完整）
interface StatsData {
  maxCombo: number;
  hintCount: number;
  maxLevel: number;
  taPlayed: boolean;
  undoUsed: number;
  sessions: number;
  totalMoves: number;
  activityLog: number[];
  [key: string]: unknown;
}

let _overlay: HTMLDivElement | null = null;

const S = {
  overlay: 'position:fixed;inset:0;background:rgba(0,0,0,0.72);display:flex;align-items:center;justify-content:center;z-index:8000;',
  panel: 'background:#17121f;border:1.5px solid #8be9fd;border-radius:10px;width:min(680px,96vw);max-height:90vh;overflow:hidden;display:flex;flex-direction:column;font-family:monospace;color:#f8f8f2;box-shadow:0 8px 40px #000a;',
  header: 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px 0;',
  tabBar: 'display:flex;gap:4px;padding:4px 16px 0;border-bottom:1px solid #333;',
  tabBtn: 'padding:5px 14px;border:1px solid #44475a;border-bottom:none;border-radius:5px 5px 0 0;background:transparent;color:#888;cursor:pointer;font:12px monospace;',
  tabBtnActive: 'padding:5px 14px;border:1px solid #8be9fd;border-bottom:2px solid #17121f;border-radius:5px 5px 0 0;background:#17121f;color:#8be9fd;cursor:pointer;font:12px monospace;',
  tabContent: 'padding:16px;overflow-y:auto;flex:1;',
  closeBtn: 'background:transparent;border:none;color:#ff5555;font-size:18px;cursor:pointer;line-height:1;padding:2px 6px;border-radius:4px;',
  statCard: 'background:#211a30;border:1px solid #44475a;border-radius:6px;padding:10px 14px;display:flex;flex-direction:column;gap:4px;',
};

export function createStatsPanel(
  container: HTMLElement,
  records: Records,
  heatmap: number[][],
  stats: StatsData,
  initialTab = 0
): void {
  destroyStatsPanel();

  _overlay = document.createElement('div');
  _overlay.style.cssText = S.overlay;
  _overlay.addEventListener('click', (e) => {
    if (e.target === _overlay) destroyStatsPanel();
  });

  const panel = document.createElement('div');
  panel.style.cssText = S.panel;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', '统计面板');

  // header
  const header = document.createElement('div');
  header.style.cssText = S.header;
  const title = document.createElement('span');
  title.style.cssText = 'font-size:15px;font-weight:bold;color:#8be9fd';
  title.textContent = '📊 玩家统计';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = S.closeBtn;
  closeBtn.title = '关闭 (ESC)';
  closeBtn.addEventListener('click', destroyStatsPanel);
  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // tab bar
  const tabLabels = ['总览', '热力图', '图表'];
  const safeInitial = Math.max(0, Math.min(tabLabels.length - 1, Math.trunc(initialTab)));
  const tabBar = document.createElement('div');
  tabBar.style.cssText = S.tabBar;

  const tabContent = document.createElement('div');
  tabContent.style.cssText = S.tabContent;

  tabLabels.forEach((label, idx) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.dataset.tab = String(idx);
    btn.style.cssText = idx === safeInitial ? S.tabBtnActive : S.tabBtn;
    btn.addEventListener('click', () => {
      tabBar.querySelectorAll<HTMLButtonElement>('button').forEach(b => {
        b.style.cssText = b === btn ? S.tabBtnActive : S.tabBtn;
      });
      renderTab(idx, tabContent, records, heatmap, stats);
    });
    tabBar.appendChild(btn);
  });

  panel.appendChild(tabBar);
  panel.appendChild(tabContent);

  renderTab(safeInitial, tabContent, records, heatmap, stats);

  _overlay.appendChild(panel);
  container.appendChild(_overlay);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { destroyStatsPanel(); document.removeEventListener('keydown', onKey); }
  };
  document.addEventListener('keydown', onKey);
}

export function destroyStatsPanel(): void {
  _overlay?.remove();
  _overlay = null;
}

// ─── Tab 渲染调度 ─────────────────────────────────────────────────────────────
function renderTab(
  idx: number,
  container: HTMLElement,
  records: Records,
  heatmap: number[][],
  stats: StatsData
): void {
  container.innerHTML = '';
  if (idx === 0) renderOverviewTab(container, records, stats);
  else if (idx === 1) renderHeatmapTab(container, records, heatmap);
  else renderChartsTab(container, records);
}

// ─── Tab0：总览 ───────────────────────────────────────────────────────────────
function renderOverviewTab(
  container: HTMLElement,
  records: Records,
  stats: StatsData
): void {
  const cleared = Object.values(records).filter((r: any) => r?.bestMoves > 0).length;
  const stars3  = Object.values(records).filter((r: any) => r?.bestRank === '★★★').length;

  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px';

  const items = [
    { label: '已通关', value: `${cleared} 关` },
    { label: '三星通关', value: `${stars3} 关` },
    { label: '总步数', value: String(stats.totalMoves) },
    { label: '最佳连击', value: `x${stats.maxCombo}` },
    { label: '游戏场次', value: `${stats.sessions} 次` },
    { label: '提示使用', value: `${stats.hintCount} 次` },
  ];

  items.forEach(({ label, value }) => {
    const card = document.createElement('div');
    card.style.cssText = S.statCard;
    card.innerHTML =
      `<span style="font-size:11px;color:#888">${label}</span>` +
      `<strong style="font-size:18px;color:#50fa7b">${value}</strong>`;
    grid.appendChild(card);
  });
  container.appendChild(grid);

  // 活动日历
  const calTitle = document.createElement('p');
  calTitle.style.cssText = 'font-size:12px;color:#8be9fd;margin:0 0 8px';
  calTitle.textContent = '最近一年活动日历';
  container.appendChild(calTitle);

  const calCanvas = document.createElement('canvas');
  calCanvas.style.cssText = 'display:block;border-radius:6px;max-width:100%';
  container.appendChild(calCanvas);

  setCalendarData(calCanvas, stats.activityLog);
  renderActivityCalendar(calCanvas, stats.activityLog);
}

// ─── Tab1：热力图 ─────────────────────────────────────────────────────────────
function renderHeatmapTab(
  container: HTMLElement,
  records: Records,
  _heatmap: number[][]
): void {
  const title = document.createElement('p');
  title.style.cssText = 'font-size:12px;color:#8be9fd;margin:0 0 10px';
  title.textContent = '各关卡移动热力图';
  container.appendChild(title);

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 220;
  canvas.style.cssText = 'display:block;border-radius:6px;max-width:100%';
  container.appendChild(canvas);

  renderStatsHeatmap(canvas, records);
}

// ─── Tab2：图表 ───────────────────────────────────────────────────────────────
function renderChartsTab(
  container: HTMLElement,
  records: Records
): void {
  const { moves, labels } = buildProgressData(records);

  if (moves.length === 0) {
    const empty = document.createElement('p');
    empty.style.cssText = 'color:#888;text-align:center;padding:40px 0';
    empty.textContent = '暂无通关数据';
    container.appendChild(empty);
    return;
  }

  const barTitle = document.createElement('p');
  barTitle.style.cssText = 'font-size:12px;color:#8be9fd;margin:0 0 6px';
  barTitle.textContent = '各关卡最佳步数（柱状图）';
  container.appendChild(barTitle);

  const barCanvas = document.createElement('canvas');
  barCanvas.width = 600;
  barCanvas.height = 160;
  barCanvas.style.cssText = 'display:block;border-radius:6px;max-width:100%;margin-bottom:16px';
  container.appendChild(barCanvas);
  drawBarChart(barCanvas, moves, labels, { title: '最佳步数', color: '#8be9fd' });

  const lineTitle = document.createElement('p');
  lineTitle.style.cssText = 'font-size:12px;color:#ff79c6;margin:0 0 6px';
  lineTitle.textContent = '通关步数趋势（折线图）';
  container.appendChild(lineTitle);

  const lineCanvas = document.createElement('canvas');
  lineCanvas.width = 600;
  lineCanvas.height = 160;
  lineCanvas.style.cssText = 'display:block;border-radius:6px;max-width:100%';
  container.appendChild(lineCanvas);
  drawLineChart(lineCanvas, moves, labels, { title: '步数趋势' });
}
