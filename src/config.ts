// ─── 游戏配置系统 Game Config ────────────────────────────────────────────────
// 统一管理所有游戏设置，类型安全，localStorage持久化

export interface GameConfig {
  // 音频
  masterVolume: number;    // 0~1
  sfxVolume: number;
  bgmVolume: number;
  bgmEnabled: boolean;
  bgmTrack: number;        // 0~3
  // 视觉
  theme: string;
  skin: string;
  showDeadlocks: boolean;
  showHintArrow: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  particlesEnabled: boolean;
  // 游戏性
  undoLimit: number;       // -1 = 无限
  showTimer: boolean;
  showPushCount: boolean;
  autoNextLevel: boolean;
  confirmRestart: boolean;
  // 无障碍
  colorBlindMode: string;
  highContrast: boolean;
  hapticEnabled: boolean;
  // 语言
  locale: string;
  // 功能
  ghostEnabled: boolean;
  hintEnabled: boolean;
  dailyChallengeNotify: boolean;
}

const DEFAULTS: GameConfig = {
  masterVolume: 0.8,
  sfxVolume: 0.8,
  bgmVolume: 0.5,
  bgmEnabled: true,
  bgmTrack: 0,
  theme: 'dark',
  skin: 'default',
  showDeadlocks: true,
  showHintArrow: true,
  animationSpeed: 'normal',
  particlesEnabled: true,
  undoLimit: -1,
  showTimer: true,
  showPushCount: true,
  autoNextLevel: true,
  confirmRestart: false,
  colorBlindMode: 'none',
  highContrast: false,
  hapticEnabled: true,
  locale: 'zh-CN',
  ghostEnabled: true,
  hintEnabled: true,
  dailyChallengeNotify: true,
};

const CONFIG_KEY = 'sokoban_config';

let _config: GameConfig = { ...DEFAULTS };

export function loadConfig(): GameConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) _config = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { _config = { ...DEFAULTS }; }
  return _config;
}

export function saveConfig(): void {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(_config)); } catch { }
}

export function getConfig(): GameConfig { return _config; }

// 配置变更回调（由main.ts注册）
let _onConfigChange: ((key: string, value: unknown) => void) | null = null;
export function onConfigChange(fn: (key: string, value: unknown) => void): void { _onConfigChange = fn; }

export function setConfig<K extends keyof GameConfig>(key: K, value: GameConfig[K]): void {
  _config[key] = value;
  saveConfig();
  _onConfigChange?.(key as string, value);
}

export function resetConfig(): void {
  _config = { ...DEFAULTS };
  saveConfig();
}

export function renderConfigPanel(container: HTMLElement): void {
  container.innerHTML = `
    <div class="config-panel" style="font-size:0.9em;display:grid;gap:10px">
      <div class="config-section">
        <h4 style="color:#8be9fd;margin:0 0 6px">🔊 音频</h4>
        <label>主音量 <input type="range" min="0" max="1" step="0.05" value="${_config.masterVolume}" data-cfg="masterVolume"></label>
        <label>音效 <input type="range" min="0" max="1" step="0.05" value="${_config.sfxVolume}" data-cfg="sfxVolume"></label>
        <label>BGM <input type="range" min="0" max="1" step="0.05" value="${_config.bgmVolume}" data-cfg="bgmVolume"></label>
      </div>
      <div class="config-section">
        <h4 style="color:#ff79c6;margin:0 0 6px">🎮 游戏性</h4>
        <label><input type="checkbox" ${_config.showTimer ? 'checked' : ''} data-cfg="showTimer"> 显示计时器</label>
        <label><input type="checkbox" ${_config.particlesEnabled ? 'checked' : ''} data-cfg="particlesEnabled"> 粒子特效</label>
        <label><input type="checkbox" ${_config.showDeadlocks ? 'checked' : ''} data-cfg="showDeadlocks"> 显示死锁高亮</label>
        <label><input type="checkbox" ${_config.showPushCount ? 'checked' : ''} data-cfg="showPushCount"> 显示推箱数</label>
        <label><input type="checkbox" ${_config.ghostEnabled ? 'checked' : ''} data-cfg="ghostEnabled"> 幽灵回放</label>
        <label><input type="checkbox" ${_config.hapticEnabled ? 'checked' : ''} data-cfg="hapticEnabled"> 触觉反馈</label>
        <label><input type="checkbox" ${_config.hintEnabled ? 'checked' : ''} data-cfg="hintEnabled"> AI提示</label>
        <label><input type="checkbox" ${_config.autoNextLevel ? 'checked' : ''} data-cfg="autoNextLevel"> 自动下一关</label>
        <label><input type="checkbox" ${_config.confirmRestart ? 'checked' : ''} data-cfg="confirmRestart"> 重开需确认</label>
      </div>
      <div class="config-section">
        <h4 style="color:#50fa7b;margin:0 0 6px">🎬 动画</h4>
        <label>速度 <select data-cfg="animationSpeed" style="background:#261d34;color:#f6f1ff;border:1px solid #56406f">
          <option value="slow" ${_config.animationSpeed==='slow'?'selected':''}>慢</option>
          <option value="normal" ${_config.animationSpeed==='normal'?'selected':''}>正常</option>
          <option value="fast" ${_config.animationSpeed==='fast'?'selected':''}>快</option>
        </select></label>
      </div>
      <button id="resetConfigBtn" style="background:#ff5555;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer">重置默认</button>
    </div>
  `;
  container.querySelectorAll<HTMLInputElement>('[data-cfg]').forEach(el => {
    const handler = () => {
      const key = el.dataset.cfg as keyof GameConfig;
      const val = el.type === 'checkbox' ? el.checked :
        el.type === 'range' ? parseFloat(el.value) : el.value;
      setConfig(key, val as GameConfig[typeof key]);
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  });
  container.querySelector('#resetConfigBtn')?.addEventListener('click', () => {
    resetConfig();
    renderConfigPanel(container);
  });
}
