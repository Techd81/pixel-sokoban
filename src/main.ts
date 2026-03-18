import { LEVELS } from './levels';
import {
  state,
  loadLevel,
  tryMove,
  undo,
  restartLevel,
  gameEvents,
  getLevelConfig,
  getUndoLimit,
  getUndoUsed,
  setUndoLimit,
  isPaused,
  togglePause,
  isPushOnlyMode,
  togglePushOnlyMode,
  getPlaybackMode,
  setPlaybackMode,
} from './game';
import { initDomRefs, render, renderProgress, setMessage, autoScaleBoard, updateTimerDisplay, markProgressDirty, renderLevelPreview } from './ui';
import { audioSystem } from './audio';
import { solveAsync } from './solver';
import { ghostRecorder, ghostPlayer, loadGhostRecord } from './ghost';
import { emitGoalExplosion, emitPushSpark, emitCombo, emitWinBurst } from './particles';
import { generateLevel } from './generator';
import { encodeLevelToUrl, decodeLevelFromUrl, checkUrlLevelParam, showShareModal } from './share';
import { SolverVisualizer } from './visualizer';
import { saveReplay, loadReplay, TimelineUI } from './timeline';
import { analyzePlayer, getNextRecommended } from './adaptive';
import { checkAchievements, showAchievementUnlock, injectAchievementStyles } from './achievements';
import { MacroRecorder } from './macro';
import { RaceMode } from './race';
import { renderStatsHeatmap } from './heatmap';
import { generateShareCard, downloadShareCard } from './sharecard';
import { sendWinDanmaku } from './danmaku';
import { createStatsPanel, destroyStatsPanel } from './stats_panel';
import { speedrunTimer } from './speedrun';
import { predictDifficulty } from './difficulty';
import { WORLDS, getWorldForLevel, isWorldUnlocked } from './worlds';
import { getFavorites } from './favorites';
import { getCoachAdvice, renderCoachPanel } from './ai_coach';
import { initThemeButtons } from './themes';
import { showKeyboardHelp } from './shortcuts';
import { captureBoard, showScreenshotPreview } from './screenshot';
import { exportRecords, importRecordsFromJSON } from './export';
import { saveRecords, loadPlayerName, savePlayerName, STORAGE_KEY_LOCK } from './storage';
import { getDailyChallenge } from './daily';
import { initI18n, getLocale, setLocale, t } from './i18n';
import { initEditorModal } from './editor_modal';
import { initPWA, triggerInstall } from './pwa';
import { getNote, setNote } from './notes';
import { copyText, escapeHtml } from './web_utils';


const macroRecorder = new MacroRecorder();
const raceMode = new RaceMode();
const _timelineUI = new TimelineUI(); // 备用

const solverViz = new SolverVisualizer();
const LEVEL_RATING_KEY = 'pixelSokobanLevelRatings';

function loadLevelRatings(): Record<number, number> {
  try {
    const raw = localStorage.getItem(LEVEL_RATING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getLevelRating(levelIndex: number): number {
  return loadLevelRatings()[levelIndex] ?? 0;
}

function saveLevelRating(levelIndex: number, rating: number): void {
  const ratings = loadLevelRatings();
  ratings[levelIndex] = Math.max(0, Math.min(5, Math.trunc(rating)));
  try {
    localStorage.setItem(LEVEL_RATING_KEY, JSON.stringify(ratings));
  } catch {
    // Ignore storage quota issues for optional feedback data.
  }
}

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

const FONT_SIZE_KEY = 'pixelSokobanFontSize';

function initFontSizeControls(): void {
  const apply = (rawSize: number): void => {
    const size = Math.max(10, Math.min(24, Math.round(rawSize)));
    document.documentElement.style.fontSize = `${size}px`;
    localStorage.setItem(FONT_SIZE_KEY, String(size));
  };

  const saved = Number(localStorage.getItem(FONT_SIZE_KEY));
  if (Number.isFinite(saved) && saved > 0) apply(saved);

  document.querySelectorAll<HTMLButtonElement>('[data-font-size]').forEach(btn => {
    const size = Number(btn.dataset.fontSize);
    if (!Number.isFinite(size) || size <= 0) return;
    btn.addEventListener('click', () => apply(size));
  });
}

// ─── 初始化 ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDomRefs();
  injectAchievementStyles();
  initThemeButtons();
  initFontSizeControls();
  initI18n();

  // 语言切换：先做最小可用（lang 属性 + 标题/副标题）
  const titleEl = document.querySelector('.panel--left h1') as HTMLElement | null;
  const subtitleEl = document.querySelector('.panel--left .subtitle') as HTMLElement | null;
  const zhTitle = titleEl?.textContent ?? '像素推箱子';
  const zhSubtitle = subtitleEl?.textContent ?? '把所有木箱推进发光目标点，支持键盘与触屏操作。';

  const applyLocaleToStatic = (): void => {
    const locale = getLocale();
    document.documentElement.lang = locale;
    const langBtn = document.getElementById('langBtn');
    if (locale === 'zh-CN') {
      if (titleEl) titleEl.textContent = zhTitle;
      if (subtitleEl) subtitleEl.textContent = zhSubtitle;
      document.title = zhTitle;
      if (langBtn) langBtn.textContent = 'EN/中';
    } else {
      if (titleEl) titleEl.textContent = t('game.title');
      if (subtitleEl) subtitleEl.textContent = t('game.subtitle');
      document.title = t('game.title');
      if (langBtn) langBtn.textContent = '中/EN';
    }
  };
  applyLocaleToStatic();

  // 轻量特效开关（降低粒子/动画）
  const LOW_FX_KEY = 'pixelSokobanLowFx';
  if (localStorage.getItem(LOW_FX_KEY) === '1') {
    document.body.classList.add('low-fx');
  }

  // 编辑器（基于 index.html 的 editorModal）
  const editorModal = initEditorModal();
  let startupLevelIndex = 0;

  // PWA：安装按钮接入（避免重复 id，统一用右侧工具栏的 pwaInstallBtn）
  initPWA(() => {
    const btn = document.getElementById('pwaInstallBtn') as HTMLButtonElement | null;
    if (!btn) return;
    btn.classList.remove('hidden');
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', async () => {
      const ok = await triggerInstall();
      if (ok) {
        setMessage('已触发安装提示', 'win');
        btn.classList.add('hidden');
      } else {
        setMessage('当前环境暂不可安装', 'warn');
      }
    });
  });

  // 自动缩放棋盘：仅在布局尺寸变化时重算，避免“移动时忽大忽小”
  const setupBoardAutoscale = (): void => {
    const board = document.getElementById('board');
    const container = board?.parentElement;
    if (container && 'ResizeObserver' in window) {
      const ro = new ResizeObserver(() => {
        requestAnimationFrame(() => autoScaleBoard());
      });
      ro.observe(container);
    } else {
      window.addEventListener('resize', () => autoScaleBoard());
    }
  };
  setupBoardAutoscale();

  const playerNameEl = document.getElementById('playerNameDisplay');
  if (playerNameEl) playerNameEl.textContent = loadPlayerName();
  const winModal = document.getElementById('winModal');
  const winTextEl = document.getElementById('winText');
  const winRankEl = document.getElementById('winRank');
  const winChallengeEl = document.getElementById('winChallenge');
  const winBestEl = document.getElementById('winBest');
  const winNoteInput = document.getElementById('winNoteInput') as HTMLTextAreaElement | null;
  const modalNextBtn = document.getElementById('modalNextBtn') as HTMLButtonElement | null;
  const winStarButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('#winModal .star-btn'));

  const syncWinStars = (rating: number): void => {
    winStarButtons.forEach((btn) => {
      const star = Number(btn.dataset.star);
      const active = Number.isFinite(star) && star <= rating;
      btn.textContent = active ? '★' : '☆';
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  };

  const closeWinModal = (): void => {
    winModal?.classList.add('hidden');
  };

  const openWinModal = (rank: string | null, challengeCleared: boolean): void => {
    if (!winModal) return;
    const level = getLevelConfig(state.levelIndex);
    const record = state.records?.[state.levelIndex];
    if (winTextEl) {
      winTextEl.textContent = `你完成了第${state.levelIndex + 1}关「${level.name}」，本次用时 ${Math.max(0, state.timer.elapsedMs / 1000).toFixed(1)} 秒。`;
    }
    if (winRankEl) winRankEl.textContent = rank ?? '通关';
    if (winChallengeEl) {
      winChallengeEl.textContent = challengeCleared ? `达成 ${level.parMoves} 步挑战` : `未达成 ${level.parMoves} 步挑战`;
    }
    if (winBestEl) {
      winBestEl.textContent = record?.bestMoves ? `${record.bestMoves} 步` : `${state.moves} 步`;
    }
    if (winNoteInput) winNoteInput.value = getNote(state.levelIndex);
    if (modalNextBtn) {
      const isLastLevel = state.levelIndex >= LEVELS.length - 1;
      modalNextBtn.disabled = isLastLevel;
      modalNextBtn.textContent = isLastLevel ? '已是最后一关' : '继续下一关';
    }
    syncWinStars(getLevelRating(state.levelIndex));
    winModal.classList.remove('hidden');
  };

  winModal?.addEventListener('click', (event) => {
    if (event.target === winModal) closeWinModal();
  });
  document.getElementById('modalRestartBtn')?.addEventListener('click', () => {
    closeWinModal();
    restartLevel();
  });
  document.getElementById('modalNextBtn')?.addEventListener('click', () => {
    closeWinModal();
    loadLevel(Math.min(state.levelIndex + 1, LEVELS.length - 1));
  });
  document.getElementById('winNoteSaveBtn')?.addEventListener('click', () => {
    setNote(state.levelIndex, winNoteInput?.value ?? '');
    setMessage('笔记已保存', 'win');
  });
  document.getElementById('pathVizBtn')?.addEventListener('click', () => {
    closeWinModal();
    const replayData = loadReplay(state.levelIndex);
    if (!replayData?.steps?.length) {
      setMessage('暂无路径回放', 'info');
      return;
    }
    startReplay();
    setMessage('开始路径回放', 'info');
  });
  winStarButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const rating = Number(btn.dataset.star);
      if (!Number.isFinite(rating)) return;
      saveLevelRating(state.levelIndex, rating);
      syncWinStars(rating);
      setMessage(`已评分 ${rating} 星`, 'win');
    });
  });

  const bgmSlider = document.getElementById('bgmSlider') as HTMLInputElement | null;
  const sfxSlider = document.getElementById('sfxSlider') as HTMLInputElement | null;
  const loadVolume = (key: 'bgm' | 'sfx', fallback: number): number => {
    const raw = localStorage.getItem('pixelSokobanVolume_' + key);
    const val = raw ? Number(raw) : fallback;
    return Number.isFinite(val) ? Math.max(0, Math.min(1, val)) : fallback;
  };
  if (bgmSlider) {
    const val = loadVolume('bgm', Number(bgmSlider.value) || 0.22);
    bgmSlider.value = String(val);
    audioSystem.setVolume('bgm', val);
    bgmSlider.addEventListener('input', () => audioSystem.setVolume('bgm', Number(bgmSlider.value)));
  }
  if (sfxSlider) {
    const val = loadVolume('sfx', Number(sfxSlider.value) || 1);
    sfxSlider.value = String(val);
    audioSystem.setVolume('sfx', val);
    sfxSlider.addEventListener('input', () => audioSystem.setVolume('sfx', Number(sfxSlider.value)));
  }

  // ─── 游戏事件监听 ───────────────────────────────────────────────────────
  gameEvents.addEventListener('update', () => {
    render();
    if (!state.won && getPlaybackMode() === 'none') {
      const boxes: Array<{ x: number; y: number }> = [];
      for (let y = 0; y < state.grid.length; y++) {
        const row = state.grid[y];
        for (let x = 0; x < row.length; x++) {
          if (row[x] === '$' || row[x] === '*') boxes.push({ x, y });
        }
      }
      ghostRecorder.captureFrame(state.player, boxes, state.facing);
    }
  });

  gameEvents.addEventListener('levelLoaded', () => {
    closeWinModal();
    render();
    renderProgress();
    autoScaleBoard();
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

  gameEvents.addEventListener('won', (e: Event) => {
    const detail = (e as CustomEvent).detail as { playback?: boolean; mode?: string } | undefined;
    const playback = detail?.playback ?? (getPlaybackMode() !== 'none');

    emitWinBurst();
    audioSystem.playSfx('win');
    ghostRecorder.stop();
    ghostPlayer.stop();

    // 演示/回放不写入记录、不触发成就/回放保存
    if (playback) {
      if (getPlaybackMode() === 'demo') stopAIDemo();
      if (getPlaybackMode() === 'replay') stopReplay();
      setMessage('演示/回放完成', 'win');
      return;
    }

    sendWinDanmaku(state.records?.[state.levelIndex]?.bestRank ?? '');
    ghostRecorder.save(state.moves);

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
    void analyzePlayer(state.records);
    const next = getNextRecommended(state.records, state.levelIndex);
    if (next >= 0 && next !== state.levelIndex) {
      setTimeout(() => setMessage(`推荐下一关：L${next + 1} ${LEVELS[next].name}`, 'info'), 2000);
    }

    // 保存回放
    saveReplay({
      levelIndex: state.levelIndex,
      levelName: getLevelConfig(state.levelIndex).name,
      steps: state.recording.map(s => ({ ...s })),
      totalMoves: state.moves,
      totalTimeMs: state.timer.elapsedMs,
      recordedAt: Date.now(),
    });

    // ── 速通：记录本关分段 ──────────────────────────────────────────────
    if (speedrunTimer.isActive()) {
      const split = speedrunTimer.split(LEVELS[state.levelIndex], state.levelIndex, state.moves);
      const srHUD = document.getElementById('srHUD');
      if (srHUD && split) {
        const delta = split.delta < 0 ? `<span style="color:#50fa7b">-${Math.abs(split.delta/1000).toFixed(2)}s</span>` : `<span style="color:#ff6b6b">+${(split.delta/1000).toFixed(2)}s</span>`;
        srHUD.innerHTML += `<div style="font-size:0.8em;padding:2px 8px;border-bottom:1px solid #333">${split.levelName}: ${(split.timeMs/1000).toFixed(2)}s (${state.moves}步) ${delta}</div>`;
      }
    }

    // ── AI 教练建议 ─────────────────────────────────────────────────────
    const coachPanel = document.getElementById('coachPanel');
    if (coachPanel) {
      const advices = getCoachAdvice(state.records, state.levelIndex, []);
      renderCoachPanel(coachPanel, advices);
    }

    markProgressDirty();
    renderProgress();
    const record = state.records?.[state.levelIndex];
    openWinModal(record?.bestRank ?? '通关', !!record?.challengeCleared);
  });

  // ─── 键盘事件 ────────────────────────────────────────────────────────────
  document.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    const key = ev.key;
    if (key === 'Escape') {
      closeWinModal();
      document.getElementById('levelSelect')?.classList.add('hidden');
      if (isPaused()) handleTogglePause();
      if (getPlaybackMode() === 'demo') stopAIDemo();
      if (getPlaybackMode() === 'replay') stopReplay();
      return;
    }

    if (winModal && !winModal.classList.contains('hidden')) return;
    if (ev.target instanceof HTMLElement) {
      const tag = ev.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || ev.target.isContentEditable) {
        return;
      }
    }

    if (editorModal.isOpen()) return;

    const canInteractive = getPlaybackMode() === 'none' && !isPaused();
    switch (key) {
      case 'ArrowUp':    case 'w': case 'W':
        if (!canInteractive) break;
        ev.preventDefault();
        audioSystem.unlock(); tryMove(0, -1, 'up'); break;
      case 'ArrowDown':  case 's': case 'S':
        if (!canInteractive) break;
        ev.preventDefault();
        audioSystem.unlock(); tryMove(0,  1, 'down'); break;
      case 'ArrowLeft':  case 'a': case 'A':
        if (!canInteractive) break;
        ev.preventDefault();
        audioSystem.unlock(); tryMove(-1, 0, 'left'); break;
      case 'ArrowRight': case 'd': case 'D':
        if (!canInteractive) break;
        ev.preventDefault();
        audioSystem.unlock(); tryMove(1,  0, 'right'); break;
      case 'z': case 'Z':
        if (!canInteractive) break;
        handleUndo(); break;
      case 'r': case 'R':
        if (!canInteractive) break;
        restartLevel(); break;
      case 'p': case 'P':
        handleTogglePause(); break;
      case 'l': case 'L':
        if (!canInteractive) break;
        {
          const modal = document.getElementById('levelSelect');
          modal?.classList.toggle('hidden');
          if (!modal?.classList.contains('hidden')) renderLevelSelectGrid();
        }
        break;
      case 'e': case 'E':
        if (!canInteractive) break;
        editorModal.open(getLevelConfig(state.levelIndex));
        break;
      case 'n': loadLevel(Math.min(state.levelIndex + 1, LEVELS.length - 1)); break;
      case 'h': case 'H':
        if (!canInteractive) break;
        void handleHint(); break;
      case 'g': case 'G':
        if (!canInteractive) break;
        handleGenerate(); break;
    }
  });

  // ─── 触摸滑动 ────────────────────────────────────────────────────────────
  let touchStart = { x: 0, y: 0 };
  document.addEventListener('touchstart', (e) => {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    audioSystem.unlock();
    if (getPlaybackMode() !== 'none' || isPaused() || editorModal.isOpen()) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    if (Math.max(adx, ady) < 20) return;
    if (adx > ady) tryMove(dx > 0 ? 1 : -1, 0, dx > 0 ? 'right' : 'left');
    else tryMove(0, dy > 0 ? 1 : -1, dy > 0 ? 'down' : 'up');
  }, { passive: true });

  // ─── 方向键按钮（浮动 + 面板）───────────────────────────────────────────
  const bindDirButtons = (selector: string) => {
    document.querySelectorAll<HTMLButtonElement>(selector).forEach(btn => {
      btn.addEventListener('click', () => {
        if (getPlaybackMode() !== 'none' || isPaused() || editorModal.isOpen()) return;
        audioSystem.unlock();
        const dir = btn.dataset.dir;
        if (dir === 'up')    tryMove(0, -1, 'up');
        if (dir === 'down')  tryMove(0,  1, 'down');
        if (dir === 'left')  tryMove(-1, 0, 'left');
        if (dir === 'right') tryMove(1,  0, 'right');
      });
    });
  };
  bindDirButtons('.fdpad-btn');
  bindDirButtons('.dpad button[data-dir]');

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
    // 异步化：避免同步 BFS 阻塞 UI 线程
    setTimeout(() => {
      const level = generateLevel({ cols: 8, rows: 7, boxCount: 2, seed: Date.now() });
      if (!level) { setMessage('生成失败，请重试', 'error'); return; }
      // 临时加入关卡列表并跳转
      (LEVELS as typeof LEVELS & { _temp?: boolean }).push(
        Object.assign(level, { _temp: true }) as typeof LEVELS[0]
      );
      loadLevel(LEVELS.length - 1);
      setMessage(`随机关卡已生成 (${level.map[0].length}×${level.map.length})`, 'win');
    }, 0);
  }

  // ─── 撤销限制 ─────────────────────────────────────────────────────────────
  const UNDO_LIMIT_STORAGE_KEY = 'pixelSokobanUndoLimit';
  const UNDO_LIMIT_CYCLE = [-1, 5, 3, 1, 0];

  const updateUndoLimitBtn = (limit: number): void => {
    const btn = document.getElementById('undoLimitBtn') as HTMLButtonElement | null;
    if (!btn) return;
    btn.textContent = limit < 0 ? '🔄 标准' : `🔄 撤销${limit}次`;
    btn.title = limit < 0 ? '撤销次数限制：无限' : `撤销次数限制：每关最多 ${limit} 次`;
  };

  const savedUndoLimit = Number(localStorage.getItem(UNDO_LIMIT_STORAGE_KEY));
  if (Number.isFinite(savedUndoLimit)) setUndoLimit(savedUndoLimit);
  updateUndoLimitBtn(getUndoLimit());

  const handleUndo = (): void => {
    if (state.history.length === 0) { setMessage('没有可撤销的操作', 'warn'); return; }
    const limit = getUndoLimit();
    const used = getUndoUsed();
    if (limit >= 0 && used >= limit) {
      setMessage(`撤销次数已达上限！(${used}/${limit})`, 'warn');
      return;
    }
    undo();
  };

  // ─── 暂停遮罩 ─────────────────────────────────────────────────────────────
  let pauseOverlay: HTMLDivElement | null = null;

  const ensurePauseOverlay = (): HTMLDivElement => {
    if (pauseOverlay) return pauseOverlay;
    const el = document.createElement('div');
    el.id = 'pauseOverlay';
    el.className = 'pause-overlay hidden';
    el.innerHTML = "<div class='pause-content'><h2>暂停</h2><p>按 P 或点击继续</p></div>";
    el.addEventListener('click', () => handleTogglePause());
    document.body.appendChild(el);
    pauseOverlay = el;
    return el;
  };

  const openPauseOverlay = (): void => {
    ensurePauseOverlay().classList.remove('hidden');
  };

  const closePauseOverlay = (): void => {
    ensurePauseOverlay().classList.add('hidden');
  };

  const handleTogglePause = (): void => {
    togglePause();
    if (isPaused()) openPauseOverlay();
    else closePauseOverlay();
  };

  // ─── 纯推模式 ─────────────────────────────────────────────────────────────
  const syncPushOnlyBtn = (): void => {
    const btn = document.getElementById('pushOnlyBtn') as HTMLButtonElement | null;
    if (!btn) return;
    btn.classList.toggle('active', isPushOnlyMode());
  };
  syncPushOnlyBtn();

  // ─── 演示 / 回放（Playback）───────────────────────────────────────────────
  let demoIntervalId: ReturnType<typeof setInterval> | null = null;
  let replayIntervalId: ReturnType<typeof setInterval> | null = null;
  let replayIndex = 0;
  let replaySteps: Array<{ dx: number; dy: number; facing: string }> = [];

  const setBoardPlaybackGlow = (on: boolean): void => {
    document.getElementById('board')?.classList.toggle('ai-demo', on);
  };

  const stopReplay = (): void => {
    if (replayIntervalId) { clearInterval(replayIntervalId); replayIntervalId = null; }
    if (getPlaybackMode() === 'replay') setPlaybackMode('none');
    setBoardPlaybackGlow(false);
    const btn = document.getElementById('replayBtn') as HTMLButtonElement | null;
    if (btn) { btn.classList.remove('active'); btn.textContent = '录像回放'; }
  };

  const startReplay = (): void => {
    const data = loadReplay(state.levelIndex);
    if (!data) { setMessage('暂无回放记录', 'info'); return; }
    if (!data.steps?.length) { setMessage('回放为空：请重新通关生成录像', 'warn'); return; }

    // 如果正在演示，先停止
    stopAIDemo();

    setPlaybackMode('replay');
    setBoardPlaybackGlow(true);

    const btn = document.getElementById('replayBtn') as HTMLButtonElement | null;
    if (btn) { btn.classList.add('active'); btn.textContent = '停止回放'; }

    // 回放一定从关卡初始状态开始
    loadLevel(data.levelIndex);
    replaySteps = data.steps.map(s => ({ dx: s.dx, dy: s.dy, facing: s.facing }));
    replayIndex = 0;

    replayIntervalId = setInterval(() => {
      if (getPlaybackMode() !== 'replay') { stopReplay(); return; }
      if (state.won || replayIndex >= replaySteps.length) { stopReplay(); return; }
      const s = replaySteps[replayIndex++];
      tryMove(s.dx, s.dy, s.facing);
    }, Math.max(30, Math.round(state.ai.speed)));
  };

  const stopAIDemo = (): void => {
    if (demoIntervalId) { clearInterval(demoIntervalId); demoIntervalId = null; }
    state.ai.demo = false;
    if (getPlaybackMode() === 'demo') setPlaybackMode('none');
    setBoardPlaybackGlow(false);
    const btn = document.getElementById('aiDemoBtn') as HTMLButtonElement | null;
    if (btn) { btn.classList.remove('active'); btn.textContent = 'AI演示'; }
  };

  const startAIDemo = async (): Promise<void> => {
    // 如果正在回放，先停止
    stopReplay();

    const btn = document.getElementById('aiDemoBtn') as HTMLButtonElement | null;
    const board = document.getElementById('board');

    board?.classList.add('ai-solving');
    if (btn) { btn.classList.add('active'); btn.textContent = '停止演示'; }
    setMessage('AI 计算中...', 'info');

    const result = await solveAsync(state.grid as string[][], state.player, state.goals);
    board?.classList.remove('ai-solving');

    if (!result || result.steps.length === 0) {
      stopAIDemo();
      setMessage('该局面超出搜索范围，无法演示。', 'warn');
      return;
    }

    setPlaybackMode('demo');
    state.ai.demo = true;
    setBoardPlaybackGlow(true);
    setMessage(`AI演示开始，共 ${result.steps.length} 步`, 'info');

    let i = 0;
    demoIntervalId = setInterval(() => {
      if (getPlaybackMode() !== 'demo' || !state.ai.demo) { stopAIDemo(); return; }
      if (state.won || i >= result.steps.length) { stopAIDemo(); return; }
      const s = result.steps[i++];
      tryMove(s.dx, s.dy, s.facing);
    }, Math.max(30, Math.round(state.ai.speed)));
  };

  // ─── 解法弹窗 ─────────────────────────────────────────────────────────────
  let solutionModal: HTMLDivElement | null = null;
  let solutionModalKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  const closeSolutionModal = (): void => {
    solutionModal?.remove();
    solutionModal = null;
    if (solutionModalKeyHandler) {
      document.removeEventListener('keydown', solutionModalKeyHandler);
      solutionModalKeyHandler = null;
    }
  };

  const showSolutionModal = (steps: Array<{ dx: number; dy: number; facing: string }>): void => {
    closeSolutionModal();
    const dirs: Record<string, string> = { up: '↑', down: '↓', left: '←', right: '→' };
    const arrows = steps.map(s => dirs[s.facing] ?? s.facing).join(' ');

    const overlay = document.createElement('div');
    overlay.id = 'solutionModal';
    overlay.className = 'modal';
    overlay.innerHTML = `
      <div class="modal-card" style="max-width:760px;text-align:left">
        <p class="eyebrow">SOLUTION</p>
        <h2>解法（${steps.length}步）</h2>
        <p class="subtitle" style="margin-top:6px">复制后可粘贴到笔记里保存。</p>
        <div style="margin-top:12px;padding:12px;border:2px solid #000;background:var(--panel-2);border-radius:8px;font-family:monospace;line-height:1.8;word-break:break-word">${arrows}</div>
        <div class="controls center" style="margin-top:14px">
          <button id="solutionCopyBtn" type="button">📋 复制</button>
          <button id="solutionCloseBtn" type="button">关闭</button>
        </div>
      </div>
    `;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSolutionModal(); });
    document.body.appendChild(overlay);
    solutionModal = overlay;

    overlay.querySelector<HTMLButtonElement>('#solutionCloseBtn')?.addEventListener('click', closeSolutionModal);
    overlay.querySelector<HTMLButtonElement>('#solutionCopyBtn')?.addEventListener('click', async () => {
      const copied = await copyText(arrows);
      setMessage(copied ? '解法已复制' : '复制失败', copied ? 'win' : 'error');
    });

    solutionModalKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSolutionModal();
    };
    document.addEventListener('keydown', solutionModalKeyHandler);
  };

  // ─── 按钮事件绑定 ────────────────────────────────────────────────────────
  document.getElementById('undoBtn')?.addEventListener('click', () => handleUndo());
  document.getElementById('restartBtn')?.addEventListener('click', () => restartLevel());
  document.getElementById('hintBtn')?.addEventListener('click', () => handleHint());
  document.getElementById('prevBtn')?.addEventListener('click',
    () => loadLevel(Math.max(state.levelIndex - 1, 0)));
  document.getElementById('nextBtn')?.addEventListener('click',
    () => loadLevel(Math.min(state.levelIndex + 1, LEVELS.length - 1)));
  document.getElementById('generateBtn')?.addEventListener('click', () => handleGenerate());
  document.getElementById('randomChalBtn')?.addEventListener('click', () => handleGenerate());
  document.getElementById('undoLimitBtn')?.addEventListener('click', () => {
    const cur = getUndoLimit();
    const idx = UNDO_LIMIT_CYCLE.indexOf(cur);
    const next = UNDO_LIMIT_CYCLE[(idx + 1) % UNDO_LIMIT_CYCLE.length];
    setUndoLimit(next);
    localStorage.setItem(UNDO_LIMIT_STORAGE_KEY, String(next));
    updateUndoLimitBtn(next);
    setMessage(next < 0 ? '不限撤销次数' : `每关只允许撤销 ${next} 次`, 'info');
  });

  document.getElementById('pauseBtn')?.addEventListener('click', () => handleTogglePause());

  document.getElementById('pushOnlyBtn')?.addEventListener('click', () => {
    const on = togglePushOnlyMode();
    syncPushOnlyBtn();
    setMessage(on ? '纯推模式：每步必须推箱子！' : '普通模式', 'info');
  });

  document.getElementById('aiDemoBtn')?.addEventListener('click', () => {
    if (getPlaybackMode() === 'demo') stopAIDemo();
    else void startAIDemo();
  });

  document.getElementById('editorBtn')?.addEventListener('click', () => {
    editorModal.open(getLevelConfig(state.levelIndex));
  });

  // ─── 分享按钮 ────────────────────────────────────────────────────────────
  document.getElementById('shareBtn')?.addEventListener('click', () => {
    showShareModal(LEVELS[state.levelIndex], state.levelIndex);
  });

  document.getElementById('shareResultBtn')?.addEventListener('click', async () => {
    const level = LEVELS[state.levelIndex];
    const rec = state.records?.[state.levelIndex];
    const shareUrl = encodeLevelToUrl(level);
    const text = `我在「像素推箱子」第${state.levelIndex + 1}关「${level.name}」用了${rec?.bestMoves ?? state.moves}步！${shareUrl}`;
    const copied = await copyText(text);
    setMessage(copied ? '成绩已复制！' : '复制失败', copied ? 'win' : 'error');
  });

  // ─── 分享卡片按钮 ────────────────────────────────────────────────────────
  document.getElementById('shareCardBtn')?.addEventListener('click', () => {
    const cfg = getLevelConfig(state.levelIndex);
    const rec = state.records?.[state.levelIndex];
    const card = generateShareCard({
      levelName: cfg.name,
      levelIndex: state.levelIndex,
      moves: state.moves,
      timeMs: state.timer.elapsedMs,
      rank: rec?.bestRank ?? '',
      par: cfg.parMoves,
      map: cfg.map,
    });
    downloadShareCard({ levelName: cfg.name, levelIndex: state.levelIndex, moves: state.moves, timeMs: state.timer.elapsedMs, rank: rec?.bestRank ?? '', par: cfg.parMoves, map: cfg.map });
    void card;
  });

  // ─── 回放查看器按钮（statsModal 中的时间线按钮）────────────────────────
  document.getElementById('timelineBtn')?.addEventListener('click', () => {
    const replayData = loadReplay(state.levelIndex);
    if (!replayData) { setMessage('暂无回放记录', 'info'); return; }
    _timelineUI.create(document.body, replayData, (step) => { console.log('seek', step); });
  });

  // ─── 热力图按钮 ──────────────────────────────────────────────────────────
  document.getElementById('heatmapBtn')?.addEventListener('click', () => {
    createStatsPanel(document.body, state.records, state.heatmap, state.stats, 1);
  });

  // ─── 统计面板按钮 ─────────────────────────────────────────────────────────
  document.getElementById('statsBtn')?.addEventListener('click', () => {
    createStatsPanel(document.body, state.records, state.heatmap, state.stats, 0);
  });

  document.getElementById('helpBtn')?.addEventListener('click', () => showKeyboardHelp());

  document.getElementById('replayBtn')?.addEventListener('click', () => {
    if (getPlaybackMode() === 'replay') stopReplay();
    else startReplay();
  });

  document.getElementById('solutionBtn')?.addEventListener('click', async () => {
    if (state.won) { setMessage('已经通关！', 'info'); return; }
    const board = document.getElementById('board');
    board?.classList.add('ai-solving');
    setMessage('AI 计算中...', 'info');
    const result = await solveAsync(state.grid as string[][], state.player, state.goals);
    board?.classList.remove('ai-solving');
    if (!result) { setMessage('无解或超时', 'error'); return; }
    showSolutionModal(result.steps);
  });

  document.getElementById('compareBtn')?.addEventListener('click', () => {
    if (!state.won) { setMessage('先通关当前关卡再比较', 'info'); return; }
    const cfg = getLevelConfig(state.levelIndex);
    const opt = cfg.parMoves;
    const my = state.moves;
    const pct = opt > 0 ? Math.round((my / opt) * 100) : 0;
    const ok = opt > 0 && my <= opt;
    setMessage(
      `你：${my}步 | 目标：${opt}步 | 效率：${pct}%${ok ? ' 🏆 达成目标！' : ''}`,
      ok ? 'win' : 'info'
    );
  });

  document.getElementById('langBtn')?.addEventListener('click', () => {
    const next = getLocale() === 'zh-CN' ? 'en-US' : 'zh-CN';
    setLocale(next);
    applyLocaleToStatic();
    setMessage(next === 'en-US' ? 'English mode' : '已切换中文', 'info');
  });

  const syncLowFxBtn = (): void => {
    const btn = document.getElementById('lowFxBtn') as HTMLButtonElement | null;
    if (!btn) return;
    btn.classList.toggle('active', document.body.classList.contains('low-fx'));
  };
  syncLowFxBtn();
  document.getElementById('lowFxBtn')?.addEventListener('click', () => {
    const on = !document.body.classList.contains('low-fx');
    document.body.classList.toggle('low-fx', on);
    localStorage.setItem(LOW_FX_KEY, on ? '1' : '0');
    // 清理已存在的粒子/彩屑层
    document.getElementById('particle-canvas')?.remove();
    document.getElementById('confetti-canvas')?.remove();
    syncLowFxBtn();
    setMessage(on ? '轻量模式开启（特效减少）' : '全特效模式开启', 'info');
  });

  document.getElementById('sfxPreviewBtn')?.addEventListener('click', () => {
    audioSystem.unlock();
    audioSystem.playSfx('push');
  });

  document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // ─── 速通模式按钮 ────────────────────────────────────────────────────────
  document.getElementById('timeAttackBtn')?.addEventListener('click', () => {
    if (speedrunTimer.isActive()) {
      const result = speedrunTimer.finish(Object.values(state.records).filter(r => r && r.bestMoves > 0).length);
      const srHUD = document.getElementById('srHUD');
      if (srHUD) {
        srHUD.innerHTML = `<div style="padding:6px 12px;color:#ffd166;font-weight:bold">速通完成！总计: ${(result.totalTimeMs/1000).toFixed(2)}s / ${result.totalMoves}步</div>` + srHUD.innerHTML;
        srHUD.classList.remove('hidden');
        autoScaleBoard();
      }
      setMessage(`速通完成！${(result.totalTimeMs/1000).toFixed(2)}s`, 'win');
    } else {
      speedrunTimer.start();
      const srHUD = document.getElementById('srHUD');
      if (srHUD) {
        srHUD.innerHTML = '<div style="padding:4px 12px;color:#8be9fd;font-weight:bold">速通模式进行中...</div>';
        srHUD.classList.remove('hidden');
        autoScaleBoard();
      }
      setMessage('速通模式已开始！完成关卡记录分段', 'info');
      loadLevel(0);
    }
  });

  // ─── 关卡选择按钮 ────────────────────────────────────────────────────────
  document.getElementById('levelSelectBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('levelSelect');
    if (!modal) return;
    renderLevelSelectGrid();
    modal.classList.remove('hidden');
  });
  document.getElementById('levelSelectCloseBtn')?.addEventListener('click', () => {
    document.getElementById('levelSelect')?.classList.add('hidden');
  });

  document.getElementById('dailyStepBtn')?.addEventListener('click', () => {
    const dc = getDailyChallenge();
    loadLevel(dc.levelIndex);
    setMessage(`今日挑战：第${dc.levelIndex + 1}关 ${dc.level.name}`, 'info');
  });

  document.querySelectorAll<HTMLButtonElement>('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = Number(btn.dataset.speed);
      if (!Number.isFinite(speed)) return;
      state.ai.speed = speed;
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setMessage(`演示速度：${speed}ms`, 'info');
    });
  });

  document.getElementById('screenshotBtn')?.addEventListener('click', () => {
    const canvas = captureBoard();
    if (!canvas) { setMessage('截图失败', 'error'); return; }
    showScreenshotPreview(canvas);
  });

  document.getElementById('exportSaveBtn')?.addEventListener('click', () => {
    exportRecords(state.records, 'json');
  });
  document.getElementById('exportReportBtn')?.addEventListener('click', () => {
    exportRecords(state.records, 'markdown');
  });
  document.getElementById('importSaveBtn')?.addEventListener('click', () => {
    (document.getElementById('importSaveInput') as HTMLInputElement | null)?.click();
  });
  document.getElementById('importSaveInput')?.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const records = importRecordsFromJSON(text);
      if (!records) { setMessage('导入失败', 'error'); return; }
      state.records = records;
      saveRecords(records);
      render();
      renderProgress();
      setMessage('导入成功', 'win');
    };
    reader.readAsText(file);
  });

  document.getElementById('changeNameBtn')?.addEventListener('click', () => {
    const current = loadPlayerName();
    const name = window.prompt('输入玩家昵称', current);
    if (!name) return;
    savePlayerName(name.trim() || current);
    const display = document.getElementById('playerNameDisplay');
    if (display) display.textContent = loadPlayerName();
  });

  // ─── URL 关卡解析 ────────────────────────────────────────────────────────
  const customLevel = checkUrlLevelParam();
  if (customLevel) {
    LEVELS.push(customLevel);
    startupLevelIndex = LEVELS.length - 1;
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

  // ─── 关卡选择渲染 ────────────────────────────────────────────────────────
  let currentDiffFilter: string = 'all';
  let currentClearFilter: string = 'all';
  let levelLockMode: boolean = localStorage.getItem(STORAGE_KEY_LOCK) === '1';

  const syncLockModeBtn = (): void => {
    const btn = document.getElementById('lockModeBtn') as HTMLButtonElement | null;
    if (!btn) return;
    btn.textContent = levelLockMode ? '🔒 解锁模式' : '🔓 自由模式';
    btn.title = levelLockMode ? '按顺序解锁关卡：需先通关上一关' : '自由选择任意关卡';
  };
  syncLockModeBtn();

  document.getElementById('lockModeBtn')?.addEventListener('click', () => {
    levelLockMode = !levelLockMode;
    localStorage.setItem(STORAGE_KEY_LOCK, levelLockMode ? '1' : '0');
    syncLockModeBtn();
    setMessage(levelLockMode ? '已开启解锁模式（需通关上一关）' : '已开启自由模式', 'info');
    if (!document.getElementById('levelSelect')?.classList.contains('hidden')) {
      renderLevelSelectGrid();
    }
  });

  // 预计算难度（避免每次 renderLevelSelectGrid 重复计算）
  const _diffCache = LEVELS.map(lv => predictDifficulty(lv));

  function renderLevelSelectGrid(): void {
    const grid = document.getElementById('levelSelectGrid');
    if (!grid) return;
    grid.innerHTML = '';
    let lastWorldId = '';
    LEVELS.forEach((lv, idx) => {
      const diff = _diffCache[idx];
      const rec = state.records?.[idx];
      const cleared = rec?.bestMoves && rec.bestMoves > 0;
      const locked = levelLockMode && idx > 0 && !(state.records?.[idx - 1]?.bestMoves > 0);
      // 清通筛选
      if (currentClearFilter === 'cleared' && !cleared) return;
      if (currentClearFilter === 'uncleared' && cleared) return;
      if (currentClearFilter === 'favorites' && !getFavorites().includes(idx)) return;
      // 难度筛选
      const diffLabel = diff?.label ?? '';
      if (currentDiffFilter !== 'all' && diffLabel !== currentDiffFilter) return;
      // 章节标题
      const world = getWorldForLevel(idx);
      if (world && world.id !== lastWorldId && currentClearFilter === 'all' && currentDiffFilter === 'all') {
        lastWorldId = world.id;
        const worldUnlocked = isWorldUnlocked(world, Object.values(state.records).filter((r: any) => r?.bestMoves > 0).length);
        const header = document.createElement('div');
        header.className = 'world-header';
        header.style.cssText = `grid-column:1/-1;display:flex;align-items:center;gap:8px;padding:8px 4px 4px;border-bottom:2px solid ${world.color}44;margin-top:8px`;
        header.innerHTML = `<span style="font-size:1.2em">${world.emoji}</span><strong style="color:${world.color}">${world.name}</strong><span style="color:var(--muted);font-size:11px">${world.description}</span>${!worldUnlocked ? '<span style="color:var(--danger);font-size:11px">🔒 未解锁</span>' : ''}`;
        grid.appendChild(header);
      }
      const cell = document.createElement('button');
      cell.className =
        'level-card' +
        (cleared ? ' is-cleared' : '') +
        (locked ? ' is-locked' : '') +
        (idx === state.levelIndex ? ' is-current' : '');
      cell.setAttribute('role', 'listitem');
      cell.innerHTML = `
        <div class="level-card-head">
          <div class="level-card-title">
            <div class="level-index">L${idx + 1}</div>
            <strong class="level-name">${escapeHtml(lv.name)}</strong>
          </div>
          <div class="level-stars">${rec?.bestRank ?? ''}</div>
        </div>
        <div class="level-meta">
          <span>${locked ? '🔒 未解锁' : (cleared ? `${rec!.bestMoves}步` : '未通关')}</span>
          ${diffLabel ? `<span class="badge">${diffLabel}</span>` : ''}
        </div>
        <canvas class="level-preview-canvas" width="64" height="56" style="display:block;margin:4px auto 0;image-rendering:pixelated"></canvas>
      `;
      cell.addEventListener('click', () => {
        if (locked) { setMessage('先通关上一关！', 'warn'); return; }
        loadLevel(idx);
        document.getElementById('levelSelect')?.classList.add('hidden');
      });
      grid.appendChild(cell);
      // 渲染关卡预览
      const canvas = cell.querySelector<HTMLCanvasElement>('.level-preview-canvas');
      if (canvas) renderLevelPreview(canvas, lv.map);
    });
  }

  // 通关/收藏筛选（原有 setLevelFilter）
  (window as any).setLevelFilter = (filter: string) => {
    currentClearFilter = filter;
    document.querySelectorAll('.level-filter-bar .filter-btn').forEach(b => {
      (b as HTMLElement).classList.toggle('active', (b as HTMLElement).dataset.filter === filter);
    });
    renderLevelSelectGrid();
  };

  // 难度筛选按钮事件（任务2）
  document.querySelectorAll('.diff-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentDiffFilter = (btn as HTMLElement).dataset.diff ?? 'all';
      document.querySelectorAll('.diff-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLevelSelectGrid();
    });
  });

  // 搜索框
  document.getElementById('levelSearch')?.addEventListener('input', (e) => {
    const q = (e.target as HTMLInputElement).value.trim().toLowerCase();
    document.querySelectorAll<HTMLElement>('.level-card').forEach(cell => {
      const name = cell.querySelector('.level-name')?.textContent?.toLowerCase() ?? '';
      cell.style.display = name.includes(q) ? '' : 'none';
    });
  });

  // ─── 启动 ────────────────────────────────────────────────────────────────
  loadLevel(startupLevelIndex);

  // 计时显示每100ms刷新一次，不依赖玩家移动
  setInterval(() => {
    if (!state.won && !isPaused()) updateTimerDisplay();
  }, 100);
});
