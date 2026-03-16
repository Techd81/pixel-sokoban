import { LEVELS } from './levels';
import { state, loadLevel, tryMove, undo, restartLevel, gameEvents } from './game';
import { initDomRefs, render, renderProgress, setMessage } from './ui';
import { audioSystem } from './audio';
import { solveAsync } from './solver';
import { ghostRecorder, ghostPlayer, loadGhostRecord } from './ghost';
import { emitGoalExplosion, emitPushSpark, emitCombo, emitWinBurst } from './particles';
import { generateLevel } from './generator';
import { encodeLevelToUrl, decodeLevelFromUrl, checkUrlLevelParam, showShareModal } from './share';
import { SolverVisualizer } from './visualizer';
import { saveReplay, TimelineUI } from './timeline';
import { analyzePlayer, getNextRecommended } from './adaptive';
import { checkAchievements, showAchievementUnlock, injectAchievementStyles } from './achievements';
import { MacroRecorder } from './macro';
import { RaceMode } from './race';
import { renderStatsHeatmap } from './heatmap';

const macroRecorder = new MacroRecorder();
const raceMode = new RaceMode();
const _timelineUI = new TimelineUI(); // 备用
void saveReplay; void renderStatsHeatmap;

const solverViz = new SolverVisualizer();

// ─── 获取棋盘格大小 ──────────────────────────────────────────────────────────
function getTileSize(): number {
  const board = document.getElementById('board');
  if (!board) return 48;
  return parseInt(getComputedStyle(board).getPropertyValue('--tile-size') || '48') || 48;
}

function getTileScreenPos(x: number, y: number): { sx: number; sy: number } {
  const board = document.getElementById('board');
  const ts = getTileSize();
  if (!board) return { sx: x * ts, sy: y * ts };
  const rect = board.getBoundingClientRect();
  return { sx: rect.left + x * ts + ts / 2, sy: rect.top + y * ts + ts / 2 };
}

// ─── 初始化 ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDomRefs();
  injectAchievementStyles();

  // ─── 游戏事件监听 ───────────────────────────────────────────────────────
  gameEvents.addEventListener('update', () => {
    render();
    if (!state.won) {
      const boxes = state.grid.flatMap((row, y) =>
        row.flatMap((cell, x) =>
          (cell === '$' || cell === '*') ? [{ x, y }] : []
        )
      );
      ghostRecorder.captureFrame(state.player, boxes, state.facing);
    }
  });

  gameEvents.addEventListener('levelLoaded', () => {
    render();
    renderProgress();
    ghostRecorder.start(state.levelIndex);
    if (ghostPlayer.load(state.levelIndex)) {
      ghostPlayer.start((frame, _progress) => {
        // 幽灵帧回调：可在此绘制幽灵位置（扩展点）
        void frame;
      }, 250);
    }
  });

  gameEvents.addEventListener('pushed', (e: Event) => {
    const detail = (e as CustomEvent).detail as { to: { x: number; y: number } } | undefined;
    if (detail?.to) {
      const { sx, sy } = getTileScreenPos(detail.to.x, detail.to.y);
      if (state.combo.count > 2) {
        emitCombo(sx, sy, state.combo.count);
      } else {
        emitPushSpark(sx, sy);
      }
    }
  });

  gameEvents.addEventListener('won', () => {
    emitWinBurst();
    ghostRecorder.stop();
    ghostRecorder.save(state.moves);
    ghostPlayer.stop();
    audioSystem.playSfx('win');
    // 检查成就
    // 检查成就
    const cleared = Object.values(state.records).filter((r: any) => r?.bestMoves > 0).length;
    const stars3 = Object.values(state.records).filter((r: any) => r?.bestRank === '★★★').length;
    const achStats = {
      cleared,
      stars3,
      ta_cleared: state.stats.taPlayed ? 1 : 0,
      no_hint_clears: state.stats.hintCount === 0 ? cleared : 0,
      max_combo: state.stats.maxCombo,
      beat_ghost: 0,
      shared: 0,
    };
    const newAchievements = checkAchievements(achStats);
    newAchievements.forEach(a => showAchievementUnlock(a));
    // 自适应推荐
    const profile = analyzePlayer(state.records);
    const next = getNextRecommended(state.records, state.levelIndex);
    if (next >= 0 && next !== state.levelIndex) {
      setTimeout(() => setMessage(`推荐下一关：L${next + 1} ${LEVELS[next].name}`, 'info'), 2000);
    }
  });

  // ─── 键盘事件 ────────────────────────────────────────────────────────────
  document.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    const key = ev.key;
    switch (key) {
      case 'ArrowUp':    case 'w': case 'W': audioSystem.unlock(); tryMove(0, -1, 'up');    break;
      case 'ArrowDown':  case 's': case 'S': audioSystem.unlock(); tryMove(0,  1, 'down');  break;
      case 'ArrowLeft':  case 'a': case 'A': audioSystem.unlock(); tryMove(-1, 0, 'left');  break;
      case 'ArrowRight': case 'd': case 'D': audioSystem.unlock(); tryMove(1,  0, 'right'); break;
      case 'z': case 'Z': undo(); break;
      case 'r': case 'R': restartLevel(); break;
      case 'n': loadLevel(Math.min(state.levelIndex + 1, LEVELS.length - 1)); break;
      case 'p': loadLevel(Math.max(state.levelIndex - 1, 0)); break;
      case 'h': case 'H': handleHint(); break;
      case 'g': case 'G': handleGenerate(); break;
    }
  });

  // ─── 触摸滑动 ────────────────────────────────────────────────────────────
  let touchStart = { x: 0, y: 0 };
  document.addEventListener('touchstart', (e) => {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    audioSystem.unlock();
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    if (Math.max(adx, ady) < 20) return;
    if (adx > ady) tryMove(dx > 0 ? 1 : -1, 0, dx > 0 ? 'right' : 'left');
    else tryMove(0, dy > 0 ? 1 : -1, dy > 0 ? 'down' : 'up');
  }, { passive: true });

  // ─── 浮动方向键 ──────────────────────────────────────────────────────────
  document.querySelectorAll<HTMLButtonElement>('.fdpad-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      audioSystem.unlock();
      const dir = btn.dataset.dir;
      if (dir === 'up')    tryMove(0, -1, 'up');
      if (dir === 'down')  tryMove(0,  1, 'down');
      if (dir === 'left')  tryMove(-1, 0, 'left');
      if (dir === 'right') tryMove(1,  0, 'right');
    });
  });

  // ─── AI 提示 ─────────────────────────────────────────────────────────────
  async function handleHint(): Promise<void> {
    setMessage('AI 计算中...', 'info');
    const result = await solveAsync(state.grid as string[][], state.player, state.goals);
    if (!result) { setMessage('无解或超时', 'error'); return; }
    const step = result.steps[0];
    if (!step) { setMessage('已是最优位置', 'info'); return; }
    const dirs: Record<string, string> = { up: '↑', down: '↓', left: '←', right: '→' };
    setMessage(`提示：向 ${dirs[step.facing] ?? step.facing} 移动`, 'info');
  }

  // ─── 程序化关卡生成 ──────────────────────────────────────────────────────
  function handleGenerate(): void {
    setMessage('生成随机关卡...', 'info');
    const level = generateLevel({ cols: 8, rows: 7, boxCount: 2, seed: Date.now() });
    if (!level) { setMessage('生成失败，请重试', 'error'); return; }
    // 临时加入关卡列表并跳转
    (LEVELS as typeof LEVELS & { _temp?: boolean }).push(
      Object.assign(level, { _temp: true }) as typeof LEVELS[0]
    );
    loadLevel(LEVELS.length - 1);
    setMessage(`随机关卡已生成 (${level.map[0].length}×${level.map.length})`, 'win');
  }

  // ─── 按钮事件绑定 ────────────────────────────────────────────────────────
  document.getElementById('undoBtn')?.addEventListener('click', () => undo());
  document.getElementById('restartBtn')?.addEventListener('click', () => restartLevel());
  document.getElementById('hintBtn')?.addEventListener('click', () => handleHint());
  document.getElementById('prevBtn')?.addEventListener('click',
    () => loadLevel(Math.max(state.levelIndex - 1, 0)));
  document.getElementById('nextBtn')?.addEventListener('click',
    () => loadLevel(Math.min(state.levelIndex + 1, LEVELS.length - 1)));
  document.getElementById('generateBtn')?.addEventListener('click', () => handleGenerate());

  // ─── 分享按钮 ────────────────────────────────────────────────────────────
  document.getElementById('shareBtn')?.addEventListener('click', () => {
    showShareModal(LEVELS[state.levelIndex], state.levelIndex);
  });

  document.getElementById('editorShareBtn')?.addEventListener('click', () => {
    showShareModal(LEVELS[state.levelIndex], state.levelIndex);
  });

  document.getElementById('shareResultBtn')?.addEventListener('click', () => {
    const level = LEVELS[state.levelIndex];
    const rec = state.records?.[state.levelIndex];
    const text = `我在「像素推箱子」第${state.levelIndex + 1}关「${level.name}」用了${rec?.bestMoves ?? state.moves}步！${window.location.href}`;
    navigator.clipboard.writeText(text)
      .then(() => setMessage('成绩已复制！', 'win'))
      .catch(() => setMessage('复制失败', 'error'));
  });

  // ─── URL 关卡解析 ────────────────────────────────────────────────────────
  const customLevel = checkUrlLevelParam();
  if (customLevel) {
    LEVELS.push(customLevel);
    setMessage(`加载分享关卡：${customLevel.name}`, 'win');
  }

  // ─── BGM 切换 ────────────────────────────────────────────────────────────
  document.getElementById('bgmBtn')?.addEventListener('click', () => {
    audioSystem.unlock();
    const next = (audioSystem.bgmTrack + 1) % 4;
    audioSystem.setBgmTrack(next);
    const names = ['明快', '忧郁', '激昂', '赛博'];
    setMessage(`BGM：${names[next]}`, 'info');
  });

  // ─── Service Worker ──────────────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('SW registered'))
      .catch(e => console.warn('SW fail', e));
  }

  // ─── 启动 ────────────────────────────────────────────────────────────────
  loadLevel(0);
});
