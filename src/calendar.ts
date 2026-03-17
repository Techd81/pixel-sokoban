// ─── 活动日历 Activity Calendar ─────────────────────────────────────────────
// GitHub 风格贡献图，显示最近52周(364天)的游戏活动
// activityLog: number[] — 索引0=最早天，每项为当天移动数

const CELL = 12;
const GAP = 2;
const STEP = CELL + GAP;
const WEEKS = 52;
const DAYS = 7;
const PAD_LEFT = 28;
const PAD_TOP = 20;
const PAD_BOTTOM = 18;

// 4级颜色：无活动 -> 低 -> 中 -> 高
const COLORS = ['#1e1a2e', '#2d5a3d', '#3a8c55', '#50fa7b'];

function getLevel(moves: number): number {
  if (moves <= 0) return 0;
  if (moves < 20) return 1;
  if (moves < 60) return 2;
  return 3;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function renderActivityCalendar(
  canvas: HTMLCanvasElement,
  activityLog: number[]
): void {
  const W = PAD_LEFT + WEEKS * STEP + GAP;
  const H = PAD_TOP + DAYS * STEP + PAD_BOTTOM;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#17121f';
  ctx.fillRect(0, 0, W, H);

  // 构建起始日期：今天往前364天，对齐到周日
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDow = today.getDay(); // 0=周日
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (WEEKS * DAYS - 1) - todayDow);

  // activityLog 索引0 对应 startDate，超出部分视为0
  let lastMonth = -1;
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < DAYS; d++) {
      const dayOffset = w * DAYS + d;
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + dayOffset);

      // 月份标签
      if (d === 0 && cellDate.getMonth() !== lastMonth) {
        lastMonth = cellDate.getMonth();
        ctx.fillStyle = '#888';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(monthNames[cellDate.getMonth()], PAD_LEFT + w * STEP, PAD_TOP - 5);
      }

      const moves = activityLog[dayOffset] ?? 0;
      const level = getLevel(moves);

      const x = PAD_LEFT + w * STEP;
      const y = PAD_TOP + d * STEP;

      ctx.fillStyle = COLORS[level];
      ctx.beginPath();
      (ctx as any).roundRect(x, y, CELL, CELL, 2);
      ctx.fill();
    }
  }

  // 星期标签
  const dayLabels = ['日', '一', '三', '五'];
  const dayRows = [0, 1, 3, 5];
  ctx.fillStyle = '#666';
  ctx.font = '9px monospace';
  ctx.textAlign = 'right';
  dayLabels.forEach((label, i) => {
    ctx.fillText(label, PAD_LEFT - 4, PAD_TOP + dayRows[i] * STEP + CELL - 1);
  });

  // 图例
  const legendY = H - 5;
  ctx.fillStyle = '#666';
  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('少', PAD_LEFT, legendY);
  COLORS.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    (ctx as any).roundRect(PAD_LEFT + 18 + i * (CELL + 2), legendY - CELL + 2, CELL, CELL, 2);
    ctx.fill();
  });
  ctx.fillStyle = '#666';
  ctx.fillText('多', PAD_LEFT + 18 + COLORS.length * (CELL + 2) + 4, legendY);

  // 存储数据供 tooltip 使用
  (canvas as any)._activityLog = activityLog;
  (canvas as any)._calStartDate = new Date(startDate);
  attachTooltip(canvas);
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
let _tooltip: HTMLDivElement | null = null;

function attachTooltip(canvas: HTMLCanvasElement): void {
  if ((canvas as any)._calTooltipAttached) return;
  (canvas as any)._calTooltipAttached = true;

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    const w = Math.floor((mx - PAD_LEFT) / STEP);
    const d = Math.floor((my - PAD_TOP) / STEP);

    if (w < 0 || w >= WEEKS || d < 0 || d >= DAYS) { hideTooltip(); return; }

    const cx = PAD_LEFT + w * STEP;
    const cy = PAD_TOP + d * STEP;
    if (mx < cx || mx > cx + CELL || my < cy || my > cy + CELL) { hideTooltip(); return; }

    const startDate = (canvas as any)._calStartDate as Date;
    const activityLog = (canvas as any)._activityLog as number[];
    const dayOffset = w * DAYS + d;
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + dayOffset);
    const moves = activityLog[dayOffset] ?? 0;

    showTooltip(
      e.clientX, e.clientY,
      `${formatDate(cellDate)}\n${moves > 0 ? moves + ' 步' : '无活动'}`
    );
  });

  canvas.addEventListener('mouseleave', () => hideTooltip());
}

function showTooltip(x: number, y: number, text: string): void {
  if (!_tooltip) {
    _tooltip = document.createElement('div');
    _tooltip.style.cssText = [
      'position:fixed', 'background:#282a36', 'color:#f8f8f2',
      'border:1px solid #6272a4', 'border-radius:4px',
      'padding:4px 8px', 'font:11px monospace',
      'pointer-events:none', 'z-index:9999',
      'white-space:pre', 'line-height:1.5',
    ].join(';');
    document.body.appendChild(_tooltip);
  }
  _tooltip.textContent = text;
  _tooltip.style.display = 'block';
  _tooltip.style.left = `${x + 12}px`;
  _tooltip.style.top = `${y - 8}px`;
}

function hideTooltip(): void {
  if (_tooltip) _tooltip.style.display = 'none';
}

export function setCalendarData(canvas: HTMLCanvasElement, activityLog: number[]): void {
  (canvas as any)._activityLog = activityLog;
  (canvas as any)._calTooltipAttached = false;
}
