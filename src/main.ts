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
import { generateLevel, generateLevelAsync } from './generator';
import { encodeLevelToUrl, decodeLevelFromUrl, checkUrlLevelParam, showShareModal } from './share';
import { SolverVisualizer } from './visualizer';
import { saveReplay, loadReplay, TimelineUI } from './timeline';
import { analyzePlayer, getNextRecommended } from './adaptive';
import { checkAchievements, showAchievementUnlock, injectAchievementStyles } from './achievements';
import { MacroRecorder } from './macro';
import { addLeaderboardEntry } from './leaderboard';
import { getComboLabel, getComboColor } from './combo';
import { initSkin, renderSkinSelector, SKINS } from './skins';
import { createMinimapOverlay, renderMinimap } from './minimap';
import { initHaptics, haptic } from './haptic';
import { addJournalEntry } from './journal';
import { PerformanceMonitor } from './perf';
import { saveGame, loadGame, getSaveSlots } from './saveload';
import { renderStatsHeatmap } from './heatmap';
import { generateShareCard, downloadShareCard } from './sharecard';
import { sendWinDanmaku } from './danmaku';
import { createStatsPanel, destroyStatsPanel } from './stats_panel';
import { speedrunTimer } from './speedrun';
import { predictDifficulty } from './difficulty';
import { WORLDS, getWorldForLevel, isWorldUnlocked } from './worlds';
import { getSmartHint } from './hint_engine';
import { GestureRecognizer } from './gestures';
import { notify, notifyWin, notifyAchievement } from './notify';
import { initAccessibility } from './accessibility';
import { TutorialManager, isTutorialDone } from './tutorial';
import { searchLevels } from './search';
import { getFavorites, toggleFavorite, isFavorite } from './favorites';
import { getCoachAdvice, renderCoachPanel } from './ai_coach';
import { initThemeButtons } from './themes';
import { showKeyboardHelp } from './shortcuts';
import { captureBoard, showScreenshotPreview } from './screenshot';
import { exportRecords, importRecordsFromJSON } from './export';
import { saveRecords, loadRecords, loadPlayerName, savePlayerName, STORAGE_KEY_LOCK } from './storage';
import { getDailyChallenge, completeDailyChallenge, getDailyStreak } from './daily';
import { initI18n, getLocale, setLocale, t } from './i18n';
import { initEditorModal } from './editor_modal';
import { initPWA, triggerInstall } from './pwa';
import { getNote, setNote } from './notes';
import { copyText, escapeHtml } from './web_utils';


const macroRecorder = new MacroRecorder(); // 备用：宏录制（当前无UI入口，保留实例备扩展）
const _timelineUI = new TimelineUI(); // 备用

const solverViz = new SolverVisualizer();
let _isSolving = false; // 防止solveAsync并发重复调用
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
  initAccessibility();
  initHaptics();
  // 性能监控（按 ` 键切换 FPS 显示）
  const perfMon = new PerformanceMonitor();
  perfMon.start();
  // 皮肤初始化（用已通关数）
  initSkin(Object.values(loadRecords()).filter((r: any) => r?.bestMoves > 0).length);
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
    cancelAutoNext();
    winModal?.classList.add('hidden');
  };

  let autoNextTimer: ReturnType<typeof setTimeout> | null = null;

  const cancelAutoNext = (): void => {
    if (autoNextTimer !== null) { clearTimeout(autoNextTimer); autoNextTimer = null; }
    const btn = document.getElementById('modalNextBtn') as HTMLButtonElement | null;
    if (btn && !btn.disabled) btn.textContent = '继续下一关';
  };

  const openWinModal = (rank: string | null, challengeCleared: boolean): void => {
    if (!winModal) return;
    cancelAutoNext();
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
      const prevBest = record?.bestMoves;
      if (prevBest && prevBest < state.moves) {
        winBestEl.textContent = `${prevBest} 步（本次 ${state.moves} 步）`;
      } else if (prevBest && prevBest === state.moves) {
        winBestEl.textContent = `${prevBest} 步 ✓ 平最佳`;
      } else {
        winBestEl.textContent = `${state.moves} 步 🏆 新最佳！`;
      }
    }
    if (winNoteInput) winNoteInput.value = getNote(state.levelIndex);
    if (modalNextBtn) {
      const isLastLevel = state.levelIndex >= LEVELS.length - 1;
      modalNextBtn.disabled = isLastLevel;
      modalNextBtn.textContent = isLastLevel ? '已是最后一关' : '继续下一关';
    }
    syncWinStars(getLevelRating(state.levelIndex));
    winModal.classList.remove('hidden');
    // 自动进入下一关（5秒倒计时）
    const isLast = state.levelIndex >= LEVELS.length - 1;
    if (!isLast) {
      let countdown = 5;
      const tick = (): void => {
        if (modalNextBtn && !modalNextBtn.disabled) modalNextBtn.textContent = `继续下一关（${countdown}s）`;
        if (countdown <= 0) {
          closeWinModal();
          loadLevel(Math.min(state.levelIndex + 1, LEVELS.length - 1));
          return;
        }
        countdown--;
        autoNextTimer = setTimeout(tick, 1000);
      };
      autoNextTimer = setTimeout(tick, 1000);
    }
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
  // minimap 覆盖层（懒创建）
  let minimapOverlay: HTMLCanvasElement | null = null;

  gameEvents.addEventListener('update', () => {
    render();
    // 更新总步数统计
    state.stats.totalMoves = state.moves;
    if (state.combo.count > state.stats.maxCombo) state.stats.maxCombo = state.combo.count;
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
    // 更新 minimap
    const boardEl = document.getElementById('board');
    if (boardEl) {
      if (!minimapOverlay) minimapOverlay = createMinimapOverlay(boardEl);
      renderMinimap(minimapOverlay, state.grid as string[][], state.player, state.goals);
    }
  });

  gameEvents.addEventListener('levelLoaded', () => {
    closeWinModal();
    render();
    renderProgress();
    autoScaleBoard();
    // 清除上一关的幽灵
    document.getElementById('ghost-overlay')?.remove();
    ghostRecorder.start(state.levelIndex);
    if (ghostPlayer.load(state.levelIndex)) {
      ghostPlayer.start((frame, _progress) => {
        // 显示幽灵位置（半透明覆盖层）
        let ghostEl = document.getElementById('ghost-overlay') as HTMLElement | null;
        if (!ghostEl) {
          ghostEl = document.createElement('div');
          ghostEl.id = 'ghost-overlay';
          ghostEl.style.cssText = 'position:absolute;pointer-events:none;z-index:10;font-size:var(--tile-size,40px);line-height:1;opacity:0.45;transition:left .2s,top .2s';
          document.getElementById('board')?.appendChild(ghostEl);
        }
        ghostEl.textContent = '👻';
        const tileSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tile-size')) || 40;
        ghostEl.style.left = `${frame.playerPos.x * tileSize}px`;
        ghostEl.style.top = `${frame.playerPos.y * tileSize}px`;
      }, 250);
    }
  });

  // ─── Combo HUD ────────────────────────────────────────────────────────────
  let comboHudEl: HTMLElement | null = null;
  let comboHudTimer: ReturnType<typeof setTimeout> | null = null;
  function ensureComboHud(): HTMLElement {
    if (!comboHudEl) {
      comboHudEl = document.createElement('div');
      comboHudEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:9990;font-size:2em;font-weight:900;font-family:monospace;text-shadow:0 0 12px currentColor;display:none;transition:opacity .3s';
      document.body.appendChild(comboHudEl);
    }
    return comboHudEl;
  }

  gameEvents.addEventListener('pushed', (e: Event) => {
    const detail = (e as CustomEvent).detail as { to: { x: number; y: number } } | undefined;
    haptic(state.combo.count > 2 ? 'combo' : 'push');
    if (detail?.to) {
      const { sx, sy } = getTileScreenPos(detail.to.x, detail.to.y);
      if (state.combo.count > 2) {
        emitCombo(sx, sy, state.combo.count);
        const label = getComboLabel(state.combo.count);
        if (label) {
          const hud = ensureComboHud();
          hud.textContent = `${state.combo.count}× ${label}`;
          hud.style.color = getComboColor(state.combo.count);
          hud.style.display = 'block';
          hud.style.opacity = '1';
          if (comboHudTimer) clearTimeout(comboHudTimer);
          comboHudTimer = setTimeout(() => { if (comboHudEl) { comboHudEl.style.opacity='0'; setTimeout(()=>{ if(comboHudEl) comboHudEl.style.display='none'; },300); } }, 1200);
        }
      } else {
        emitPushSpark(sx, sy);
      }
    }
  });

  gameEvents.addEventListener('won', (e: Event) => {
    const detail = (e as CustomEvent).detail as { playback?: boolean; mode?: string } | undefined;
    const playback = detail?.playback ?? (getPlaybackMode() !== 'none');

    emitWinBurst();
    haptic('win');
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

    // 每日挑战完成记录
    const dc = getDailyChallenge();
    if (dc.levelIndex === state.levelIndex && !dc.completed) {
      completeDailyChallenge(state.moves, state.timer.elapsedMs);
      notify('每日挑战完成！', 'success');
    }

    // 排行榜记录
    const lvConfig = getLevelConfig(state.levelIndex);
    addLeaderboardEntry({
      nickname: loadPlayerName(),
      levelIndex: state.levelIndex,
      moves: state.moves,
      timeMs: state.timer.elapsedMs,
      rank: state.records?.[state.levelIndex]?.bestRank ?? '',
      par: lvConfig.parMoves ?? state.moves,
    });

    // 成长日记记录
    const prevBest = state.records?.[state.levelIndex]?.bestMoves ?? 0;
    addJournalEntry({
      levelIndex: state.levelIndex,
      levelName: lvConfig.name,
      moves: state.moves,
      timeMs: state.timer.elapsedMs,
      rank: state.records?.[state.levelIndex]?.bestRank ?? '',
      isNewRecord: prevBest === 0 || state.moves < prevBest,
    });

    // 检查成就
    const cleared = Object.values(state.records).filter((r: any) => r?.bestMoves > 0).length;
    const stars3 = Object.values(state.records).filter((r: any) => r?.bestRank === '★★★').length;
    // 幽灵对比：本次是否超越幽灵记录
    const ghostRec = loadGhostRecord(state.levelIndex);
    const beatGhost = ghostRec && ghostRec.totalMoves > 0 && state.moves < ghostRec.totalMoves ? 1 : 0;
    const achStats = {
      cleared,
      stars3,
      ta_cleared: state.stats.taPlayed ? 1 : 0,
      no_hint_clears: state.stats.hintCount === 0 ? cleared : 0,
      max_combo: state.stats.maxCombo,
      beat_ghost: beatGhost,
      shared: Number(localStorage.getItem('sokoban_shared_count') ?? 0),
    };
    const newAchievements = checkAchievements(achStats);
    newAchievements.forEach(a => { showAchievementUnlock(a); notifyAchievement(a.name, a.desc ?? ''); });

    // 自适应推荐（复用analyzePlayer结果，避免双重计算）
    const playerProfile = analyzePlayer(state.records);
    const next = getNextRecommended(state.records, state.levelIndex);
    if (next >= 0 && next !== state.levelIndex) {
      const skillLabels: Record<string, string> = { beginner: '新手', intermediate: '进阶', advanced: '高手', expert: '专家' };
      const skill = skillLabels[playerProfile.skillLevel] ?? '';
      setTimeout(() => setMessage(`推荐[${skill}]下一关：L${next + 1} ${LEVELS[next].name}`, 'info'), 2000);
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
    // 更新最高通关关卡记录
    if (state.levelIndex > state.stats.maxLevel) state.stats.maxLevel = state.levelIndex;
    // 皮肤解锁检查
    const newCleared = Object.values(state.records).filter((r: any) => r?.bestMoves > 0).length;
    initSkin(newCleared);
    const record = state.records?.[state.levelIndex];
    notifyWin(getLevelConfig(state.levelIndex).name, state.moves, record?.bestRank ?? '');
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
        handleHint(); break;
      case 'g': case 'G':
        if (!canInteractive) break;
        handleGenerate(); break;
      case 'f': case 'F':
        if (!canInteractive) break;
        {
          const faved = toggleFavorite(state.levelIndex);
          setMessage(faved ? '⭐ 已收藏' : '取消收藏', 'info');
          haptic('move');
        }
        break;
      case '`':
        perfMon.toggleDisplay(); break;
      default:
        // Ctrl+1~6: 跳转到对应世界章节起点
        if (ev.ctrlKey && ev.key >= '1' && ev.key <= '6') {
          ev.preventDefault();
          const worldIdx = Number(ev.key) - 1;
          if (worldIdx < WORLDS.length) {
            const startLevel = WORLDS[worldIdx].levelRange[0];
            loadLevel(startLevel);
            setMessage(`跳转到「${WORLDS[worldIdx].name}」第${startLevel + 1}关`, 'info');
          }
        }
        break;
    }
  });
  const gesture = new GestureRecognizer(document.body, { swipeThreshold: 20, longPressMs: 600 });
  gesture
    .on('swipe-right', () => { audioSystem.unlock(); if (getPlaybackMode() !== 'none' || isPaused() || editorModal.isOpen()) return; tryMove(1, 0, 'right'); })
    .on('swipe-left',  () => { audioSystem.unlock(); if (getPlaybackMode() !== 'none' || isPaused() || editorModal.isOpen()) return; tryMove(-1, 0, 'left'); })
    .on('swipe-down',  () => { audioSystem.unlock(); if (getPlaybackMode() !== 'none' || isPaused() || editorModal.isOpen()) return; tryMove(0, 1, 'down'); })
    .on('swipe-up',    () => { audioSystem.unlock(); if (getPlaybackMode() !== 'none' || isPaused() || editorModal.isOpen()) return; tryMove(0, -1, 'up'); })
    .on('double-tap',  () => { audioSystem.unlock(); if (getPlaybackMode() !== 'none' || editorModal.isOpen()) return; undo(); })
    .on('long-press',  () => { audioSystem.unlock(); if (getPlaybackMode() !== 'none' || editorModal.isOpen()) return; restartLevel(); notify('已重开本关', 'info'); });

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
  function handleHint(): void {
    setMessage('AI 计算中...', 'info');
    state.stats.hintCount = (state.stats.hintCount ?? 0) + 1;
    const hint = getSmartHint(state.grid as string[][], state.player, state.goals);
    if (!hint) { setMessage('无解或超时', 'error'); return; }
    if (hint.type === 'stuck') { setMessage(hint.message, 'error'); return; }
    const msg = hint.type === 'nearWin'
      ? `${hint.arrow} ${hint.message}（置信度 ${Math.round(hint.confidence * 100)}%）`
      : `提示：向 ${hint.arrow} ${hint.type === 'push' ? '推箱子' : '移动'}${hint.stepsToWin > 0 ? `（剩 ${hint.stepsToWin} 步）` : ''}`;
    setMessage(msg, 'info');
    state.ai.hintArrow = hint.arrow;
  }

  // ─── 程序化关卡生成 ──────────────────────────────────────────────────────
  function handleGenerate(): void {
    if (_isSolving) { setMessage('AI 正在运算中，请稍候', 'info'); return; }
    setMessage('生成随机关卡...', 'info');
    _isSolving = true;
    void generateLevelAsync({ cols: 8, rows: 7, boxCount: 2, seed: Date.now() }).then(level => {
      _isSolving = false;
      if (!level) { setMessage('生成失败，请重试', 'error'); return; }
      // 临时加入关卡列表并跳转
      (LEVELS as typeof LEVELS & { _temp?: boolean }).push(
        Object.assign(level, { _temp: true }) as typeof LEVELS[0]
      );
      loadLevel(LEVELS.length - 1);
      setMessage(`随机关卡已生成 (${level.map[0].length}×${level.map.length})`, 'win');
    });
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
      haptic('fail');
      return;
    }
    haptic('undo');
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
    state.stats.replayPlayed = true;

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
    if (_isSolving) return; // 防止并发
    // 如果正在回放，先停止
    stopReplay();
    state.stats.taPlayed = true;

    const btn = document.getElementById('aiDemoBtn') as HTMLButtonElement | null;
    const board = document.getElementById('board');

    _isSolving = true;
    board?.classList.add('ai-solving');
    if (btn) { btn.classList.add('active'); btn.textContent = '停止演示'; }
    setMessage('AI 计算中...', 'info');

    const result = await solveAsync(state.grid as string[][], state.player, state.goals);
    _isSolving = false;
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
      setMessage(`AI演示 ${i}/${result.steps.length} 步`, 'info');
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
  document.getElementById('randomChalBtn')?.addEventListener('click', () => {
    // 优先随机跳转未完成的关卡，若全通关则随机跳任意关
    const uncleared = LEVELS.map((_, i) => i).filter(i => !(state.records?.[i]?.bestMoves > 0));
    const pool = uncleared.length > 0 ? uncleared : LEVELS.map((_, i) => i);
    const idx = pool[Math.floor(Math.random() * pool.length)];
    loadLevel(idx);
    state.stats.randomPlayed = true;
    setMessage(`🎲 随机挑战：第${idx + 1}关「${LEVELS[idx].name}」`, 'info');
  });
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
    const cnt = Number(localStorage.getItem('sokoban_shared_count') ?? 0) + 1;
    localStorage.setItem('sokoban_shared_count', String(cnt));
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
    // seek 回调：跳到指定步骤（重新加载并重放到该步）
    _timelineUI.create(document.body, replayData, (step) => {
      restartLevel();
      for (let i = 0; i < step && i < replayData.steps.length; i++) {
        const s = replayData.steps[i];
        tryMove(s.dx, s.dy, s.facing);
      }
    });
  });

  // ─── 热力图按钮 ──────────────────────────────────────────────────────────
  document.getElementById('heatmapBtn')?.addEventListener('click', () => {
    createStatsPanel(document.body, state.records, state.heatmap, state.stats, 1);
  });

  // ─── 统计面板按钮 ─────────────────────────────────────────────────────────
  document.getElementById('statsBtn')?.addEventListener('click', () => {
    createStatsPanel(document.body, state.records, state.heatmap, state.stats, 0);
  });

  // statsModal 静态面板按钮绑定
  document.getElementById('statsCloseBtn')?.addEventListener('click', () => {
    document.getElementById('statsModal')?.classList.add('hidden');
  });
  document.getElementById('statsResetBtn')?.addEventListener('click', () => {
    if (!confirm('确定要清除所有记录吗？此操作不可撤销！')) return;
    localStorage.removeItem('pixelSokobanRecords');
    state.records = {};
    markProgressDirty();
    renderProgress();
    setMessage('记录已清除', 'info');
    document.getElementById('statsModal')?.classList.add('hidden');
  });
  document.getElementById('adaptiveBtn')?.addEventListener('click', () => {
    void analyzePlayer(state.records);
    const next = getNextRecommended(state.records, state.levelIndex);
    if (next >= 0) setMessage(`建议挑战：L${next + 1} ${LEVELS[next].name}`, 'info');
    else setMessage('继续加油，已有不错的进度！', 'info');
  });
  document.getElementById('recommendBtn')?.addEventListener('click', () => {
    const next = getNextRecommended(state.records, state.levelIndex);
    if (next >= 0) { loadLevel(next); document.getElementById('statsModal')?.classList.add('hidden'); }
    else setMessage('所有关卡已通关！', 'win');
  });
  document.getElementById('printBtn')?.addEventListener('click', () => {
    window.print();
  });
  document.getElementById('progressRingBtn')?.addEventListener('click', () => {
    createStatsPanel(document.body, state.records, state.heatmap, state.stats, 0);
    document.getElementById('statsModal')?.classList.add('hidden');
  });
  document.getElementById('recentBtn')?.addEventListener('click', () => {
    createStatsPanel(document.body, state.records, state.heatmap, state.stats, 0);
    document.getElementById('statsModal')?.classList.add('hidden');
  });
  document.getElementById('speedRankBtn')?.addEventListener('click', () => {
    createStatsPanel(document.body, state.records, state.heatmap, state.stats, 1);
    document.getElementById('statsModal')?.classList.add('hidden');
  });
  document.getElementById('globalRecBtn')?.addEventListener('click', () => {
    createStatsPanel(document.body, state.records, state.heatmap, state.stats, 2);
    document.getElementById('statsModal')?.classList.add('hidden');
  });
  document.getElementById('diffAnalBtn')?.addEventListener('click', () => {
    createStatsPanel(document.body, state.records, state.heatmap, state.stats, 3);
    document.getElementById('statsModal')?.classList.add('hidden');
  });
  document.getElementById('effRankBtn')?.addEventListener('click', () => {
    createStatsPanel(document.body, state.records, state.heatmap, state.stats, 4);
    document.getElementById('statsModal')?.classList.add('hidden');
  });
  document.getElementById('achievWallBtn')?.addEventListener('click', () => {
    createStatsPanel(document.body, state.records, state.heatmap, state.stats, 5);
    document.getElementById('statsModal')?.classList.add('hidden');
  });
  document.getElementById('nextAchievBtn')?.addEventListener('click', () => {
    createStatsPanel(document.body, state.records, state.heatmap, state.stats, 5);
    document.getElementById('statsModal')?.classList.add('hidden');
  });
  document.getElementById('batchTestBtn')?.addEventListener('click', () => {
    setMessage('批量测试：正在验证所有关卡...', 'info');
    let bugs = 0;
    LEVELS.forEach((lv, i) => {
      const flat = lv.map.join('');
      const p = (flat.match(/@/g)||[]).length;
      const b = (flat.match(/\$/g)||[]).length + (flat.match(/\*/g)||[]).length;
      const g = (flat.match(/\./g)||[]).length + (flat.match(/\*/g)||[]).length + (flat.match(/\+/g)||[]).length;
      if (p !== 1 || b !== g || b === 0) bugs++;
    });
    setMessage(bugs === 0 ? `✓ 全部${LEVELS.length}关验证通过` : `发现${bugs}个关卡数据异常`, bugs === 0 ? 'win' : 'error');
  });

  document.getElementById('helpBtn')?.addEventListener('click', () => showKeyboardHelp());
  document.getElementById('helpCloseBtn')?.addEventListener('click', () => {
    document.getElementById('helpModal')?.classList.add('hidden');
  });

  document.getElementById('settingsBtn')?.addEventListener('click', () => {
    const existing = document.getElementById('inlineSettingsModal');
    if (existing) { existing.remove(); return; }
    const sm = document.createElement('div');
    sm.id = 'inlineSettingsModal';
    sm.className = 'modal';
    sm.addEventListener('click', (e) => { if (e.target === sm) sm.remove(); });
    sm.innerHTML = `<div class="modal-card" style="max-width:360px"><p class="eyebrow">SETTINGS</p><h2>设置</h2><div style="display:flex;flex-direction:column;gap:12px;margin:12px 0"><label style="display:flex;justify-content:space-between;align-items:center"><span>触觉反馈（移动端）</span><input type="checkbox" id="stHaptic"></label></div><div class="controls center"><button id="stClose">关闭</button></div></div>`;
    document.body.appendChild(sm);
    const hapticEl = document.getElementById('stHaptic') as HTMLInputElement | null;
    if (hapticEl) {
      hapticEl.checked = localStorage.getItem('sokoban_haptic') !== '0';
      hapticEl.addEventListener('change', () => localStorage.setItem('sokoban_haptic', hapticEl.checked ? '1' : '0'));
    }
    document.getElementById('stClose')?.addEventListener('click', () => sm.remove());
  });

  document.getElementById('replayBtn')?.addEventListener('click', () => {
    if (getPlaybackMode() === 'replay') stopReplay();
    else startReplay();
  });

  document.getElementById('solutionBtn')?.addEventListener('click', async () => {
    if (state.won) { setMessage('已经通关！', 'info'); return; }
    if (_isSolving) { setMessage('AI 正在计算中...', 'info'); return; }
    const board = document.getElementById('board');
    _isSolving = true;
    board?.classList.add('ai-solving');
    setMessage('AI 计算中...', 'info');
    const result = await solveAsync(state.grid as string[][], state.player, state.goals);
    _isSolving = false;
    board?.classList.remove('ai-solving');
    if (!result) { setMessage('无解或超时', 'error'); return; }
    // 可视化解法路径
    if (board) {
      solverViz.attach(board);
      // 将 SolveVizStep 转换
      const vizSteps = result.steps.map(s => ({ dx: s.dx, dy: s.dy, facing: s.facing, isPush: false }));
      solverViz.loadSteps(vizSteps as any);
      solverViz.startPlayback(500);
      setTimeout(() => solverViz.detach(), result.steps.length * 500 + 1000);
    }
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

  document.getElementById('skinsBtn')?.addEventListener('click', () => {
    const cleared = Object.values(state.records).filter((r: any) => r?.bestMoves > 0).length;
    let skinModal = document.getElementById('skinModal');
    if (skinModal) { skinModal.remove(); return; }
    skinModal = document.createElement('div');
    skinModal.id = 'skinModal';
    skinModal.className = 'modal';
    skinModal.style.cssText = 'display:flex;align-items:center;justify-content:center';
    const card = document.createElement('div');
    card.className = 'modal-card';
    card.style.maxWidth = '480px';
    card.innerHTML = '<p class="eyebrow">SKINS</p><h2>角色皮肤</h2>';
    renderSkinSelector(card, cleared);
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.style.marginTop = '12px';
    closeBtn.addEventListener('click', () => skinModal!.remove());
    card.appendChild(closeBtn);
    skinModal.appendChild(card);
    skinModal.addEventListener('click', (e) => { if (e.target === skinModal) skinModal!.remove(); });
    document.body.appendChild(skinModal);
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
    const streak = getDailyStreak();
    loadLevel(dc.levelIndex);
    const streakMsg = streak > 1 ? ` 🔥${streak}天连续` : '';
    const completedMsg = dc.completed ? ` ✓已完成(${dc.completedMoves}步)` : '';
    setMessage(`今日挑战：第${dc.levelIndex + 1}关 ${dc.level.name}${completedMsg}${streakMsg}`, 'info');
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

  document.getElementById('quickSaveBtn')?.addEventListener('click', () => {
    saveGame(0, state as unknown as import('./types').GameState, getLevelConfig(state.levelIndex).name);
    notify('快速存档已保存', 'success');
  });
  document.getElementById('quickLoadBtn')?.addEventListener('click', () => {
    const slot = loadGame(0);
    if (!slot) { setMessage('没有存档', 'warn'); return; }
    // 恢复存档：加载关卡并恢复网格
    loadLevel(slot.levelIndex);
    setMessage(`已读取存档：第${slot.levelIndex + 1}关 (${slot.moves}步 ${new Date(slot.savedAt).toLocaleString('zh-CN')})`, 'info');
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
      const faved = isFavorite(idx);
      cell.className =
        'level-card' +
        (cleared ? ' is-cleared' : '') +
        (locked ? ' is-locked' : '') +
        (idx === state.levelIndex ? ' is-current' : '') +
        (faved ? ' is-favorited' : '');
      cell.setAttribute('role', 'listitem');
      // 难度颜色左边框
      if (diff?.color) cell.style.borderLeftColor = diff.color;
      cell.innerHTML = `
        <div class="level-card-head">
          <div class="level-card-title">
            <div class="level-index">L${idx + 1}${faved ? ' ⭐' : ''}</div>
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
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        // 右键上下文菜单
        document.getElementById('levelCtxMenu')?.remove();
        const menu = document.createElement('div');
        menu.id = 'levelCtxMenu';
        menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;background:#261d34;border:2px solid #56406f;border-radius:6px;z-index:9995;min-width:140px;box-shadow:4px 4px 0 #000;font-family:monospace`;
        const fav = isFavorite(idx);
        menu.innerHTML = `
          <button class="ctx-item" data-action="fav">${fav ? '💛 取消收藏' : '⭐ 收藏'}</button>
          <button class="ctx-item" data-action="replay">📽 查看回放</button>
          <button class="ctx-item" data-action="hint">💡 AI提示</button>
        `;
        menu.style.cssText += ';color:#f6f1ff';
        const closeMenu = () => menu.remove();
        menu.querySelectorAll<HTMLButtonElement>('.ctx-item').forEach(btn => {
          btn.style.cssText = 'display:block;width:100%;padding:8px 14px;background:transparent;border:none;color:#f6f1ff;cursor:pointer;text-align:left;font:13px monospace';
          btn.addEventListener('mouseenter', () => btn.style.background = '#312544');
          btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
          btn.addEventListener('click', () => {
            closeMenu();
            if (btn.dataset.action === 'fav') { const f = toggleFavorite(idx); notify(f ? '⭐ 已收藏' : '取消收藏', 'info'); renderLevelSelectGrid(); }
            else if (btn.dataset.action === 'replay') { loadLevel(idx); document.getElementById('levelSelect')?.classList.add('hidden'); setTimeout(() => document.getElementById('timelineBtn')?.click(), 200); }
            else if (btn.dataset.action === 'hint') { loadLevel(idx); document.getElementById('levelSelect')?.classList.add('hidden'); setTimeout(() => handleHint(), 300); }
          });
        });
        document.body.appendChild(menu);
        setTimeout(() => document.addEventListener('click', closeMenu, { once: true }), 0);
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
    const q = (e.target as HTMLInputElement).value.trim();
    if (!q) {
      // 清空搜索时重新渲染完整列表
      document.querySelectorAll<HTMLElement>('.level-card').forEach(cell => { cell.style.display = ''; });
      document.querySelectorAll<HTMLElement>('.world-header').forEach(h => { h.style.display = ''; });
      return;
    }
    // 使用 searchLevels 获取匹配结果集合
    const results = searchLevels({ query: q }, state.records);
    const matchedIndices = new Set(results.map(r => r.index));
    document.querySelectorAll<HTMLElement>('.level-card').forEach((cell, idx) => {
      // 卡片顺序与 LEVELS 顺序一致
      const levelIndex = Number(cell.querySelector('.level-index')?.textContent?.replace('L','')) - 1;
      cell.style.display = matchedIndices.has(levelIndex) ? '' : 'none';
    });
    // 隐藏所有 world-header（搜索时不显示章节标题）
    document.querySelectorAll<HTMLElement>('.world-header').forEach(h => { h.style.display = 'none'; });
  });

  // ─── 启动 ────────────────────────────────────────────────────────────────
  loadLevel(startupLevelIndex);
  state.stats.sessions = (state.stats.sessions ?? 0) + 1;

  // 新手教程（仅首次进入）
  if (!isTutorialDone()) {
    setTimeout(() => new TutorialManager().start(), 800);
  }

  // 计时显示每100ms刷新一次，不依赖玩家移动
  setInterval(() => {
    if (!state.won && !isPaused()) updateTimerDisplay();
  }, 100);
});
