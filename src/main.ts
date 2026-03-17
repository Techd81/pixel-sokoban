import { LEVELS } from './levels';
import { state, loadLevel, tryMove, undo, restartLevel, gameEvents, getLevelConfig } from './game';
import { initDomRefs, render, renderProgress, setMessage } from './ui';
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
import { getFavorites } from './favorites';
import { getCoachAdvice, renderCoachPanel } from './ai_coach';
import { initThemeButtons } from './themes';
import { showKeyboardHelp } from './shortcuts';
import { captureBoard, showScreenshotPreview } from './screenshot';
import { exportRecords, importRecordsFromJSON } from './export';
import { saveRecords, loadPlayerName, savePlayerName } from './storage';
import { getDailyChallenge } from './daily';


const macroRecorder = new MacroRecorder();
const raceMode = new RaceMode();
const _timelineUI = new TimelineUI(); // 备用

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
  initThemeButtons();

  const playerNameEl = document.getElementById('playerNameDisplay');
  if (playerNameEl) playerNameEl.textContent = loadPlayerName();

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
    sendWinDanmaku(state.records?.[state.levelIndex]?.bestRank ?? '');
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
    // 保存回放
    saveReplay({
      levelIndex: state.levelIndex,
      levelName: getLevelConfig(state.levelIndex).name,
      steps: state.recording.map((r, i) => ({ ...r, isPush: false, timestamp: i * 300 })),
      totalMoves: state.moves,
      totalTimeMs: state.timer.elapsedMs,
      recordedAt: Date.now(),
    });
    // 渲染热力图（若容器存在）
    const heatmapCanvas = document.getElementById('heatmapCanvas') as HTMLCanvasElement | null;
    if (heatmapCanvas) {
      renderStatsHeatmap(heatmapCanvas, state.records);
    }
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

  // ─── 方向键按钮（浮动 + 面板）───────────────────────────────────────────
  const bindDirButtons = (selector: string) => {
    document.querySelectorAll<HTMLButtonElement>(selector).forEach(btn => {
      btn.addEventListener('click', () => {
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
  document.getElementById('randomChalBtn')?.addEventListener('click', () => handleGenerate());

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
    let canvas = document.getElementById('heatmapCanvas') as HTMLCanvasElement | null;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'heatmapCanvas';
      canvas.width = 400;
      canvas.height = 200;
      canvas.style.cssText = 'display:block;margin:8px auto;border-radius:6px;';
      const statsChart = document.getElementById('statsChart');
      if (statsChart) statsChart.appendChild(canvas);
    }
    renderStatsHeatmap(canvas, state.records);
  });

  // ─── 统计面板按钮 ─────────────────────────────────────────────────────────
  document.getElementById('statsBtn')?.addEventListener('click', () => {
    createStatsPanel(document.body, state.records, state.heatmap, state.stats);
  });

  document.getElementById('helpBtn')?.addEventListener('click', () => showKeyboardHelp());

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
      }
      setMessage(`速通完成！${(result.totalTimeMs/1000).toFixed(2)}s`, 'win');
    } else {
      speedrunTimer.start();
      const srHUD = document.getElementById('srHUD');
      if (srHUD) { srHUD.innerHTML = '<div style="padding:4px 12px;color:#8be9fd;font-weight:bold">速通模式进行中...</div>'; srHUD.classList.remove('hidden'); }
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

  // 未接入功能的按钮给出提示，避免“无响应”错觉
  const implementedButtons = new Set([
    'undoBtn', 'restartBtn', 'hintBtn', 'prevBtn', 'nextBtn', 'generateBtn',
    'shareBtn', 'editorShareBtn', 'shareResultBtn', 'shareCardBtn',
    'timelineBtn', 'heatmapBtn', 'statsBtn', 'timeAttackBtn',
    'levelSelectBtn', 'levelSelectCloseBtn', 'bgmBtn', 'randomChalBtn',
    'dailyStepBtn', 'helpBtn', 'fullscreenBtn', 'sfxPreviewBtn',
    'screenshotBtn', 'exportSaveBtn', 'exportReportBtn', 'importSaveBtn',
    'changeNameBtn',
  ]);
  document.querySelectorAll<HTMLButtonElement>('button[id]').forEach(btn => {
    if (implementedButtons.has(btn.id)) return;
    btn.addEventListener('click', () => setMessage('该功能暂未接入', 'info'));
  });

  // ─── 关卡选择渲染 ────────────────────────────────────────────────────────
  let currentDiffFilter: string = 'all';
  let currentClearFilter: string = 'all';

  function renderLevelSelectGrid(): void {
    const grid = document.getElementById('levelSelectGrid');
    if (!grid) return;
    grid.innerHTML = '';
    LEVELS.forEach((lv, idx) => {
      const diff = predictDifficulty(lv);
      const rec = state.records?.[idx];
      const cleared = rec?.bestMoves && rec.bestMoves > 0;
      // 清通筛选
      if (currentClearFilter === 'cleared' && !cleared) return;
      if (currentClearFilter === 'uncleared' && cleared) return;
      if (currentClearFilter === 'favorites' && !getFavorites().includes(idx)) return;
      // 难度筛选
      const diffLabel = diff?.label ?? '';
      if (currentDiffFilter !== 'all' && diffLabel !== currentDiffFilter) return;
      const cell = document.createElement('button');
      cell.className = 'level-cell' + (cleared ? ' cleared' : '') + (idx === state.levelIndex ? ' active' : '');
      cell.setAttribute('role', 'listitem');
      cell.innerHTML = `<span class="level-num">${idx + 1}</span><span class="level-name">${lv.name}</span>${diffLabel ? `<span class="level-diff" style="font-size:0.7em;color:#aaa">${diffLabel}</span>` : ''}`;
      cell.addEventListener('click', () => {
        loadLevel(idx);
        document.getElementById('levelSelect')?.classList.add('hidden');
      });
      grid.appendChild(cell);
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
    document.querySelectorAll<HTMLElement>('.level-cell').forEach(cell => {
      const name = cell.querySelector('.level-name')?.textContent?.toLowerCase() ?? '';
      cell.style.display = name.includes(q) ? '' : 'none';
    });
  });

  // ─── 启动 ────────────────────────────────────────────────────────────────
  loadLevel(0);
});
