// ─── 音效包系统 Sound Pack System ────────────────────────────────────────────
// 支持多套音效风格切换

export type SoundPackId = 'classic' | 'retro' | 'futuristic' | 'nature';

export interface SoundPack {
  id: SoundPackId;
  name: string;
  emoji: string;
  description: string;
  // 音调配置（相对频率倍率）
  stepPitch: number;
  pushPitch: number;
  winPitch: number;
  failPitch: number;
  undoPitch: number;
  waveform: OscillatorType;
  attackMs: number;
  decayMs: number;
}

export const SOUND_PACKS: Record<SoundPackId, SoundPack> = {
  classic: {
    id: 'classic', name: '经典', emoji: '🎹', description: '标准推箱子音效',
    stepPitch: 1.0, pushPitch: 1.2, winPitch: 1.5, failPitch: 0.8, undoPitch: 0.9,
    waveform: 'sine', attackMs: 10, decayMs: 100,
  },
  retro: {
    id: 'retro', name: '复古', emoji: '👾', description: '8-bit 像素音效',
    stepPitch: 1.1, pushPitch: 1.3, winPitch: 2.0, failPitch: 0.5, undoPitch: 0.7,
    waveform: 'square', attackMs: 5, decayMs: 80,
  },
  futuristic: {
    id: 'futuristic', name: '未来', emoji: '🚀', description: '科幻电子音效',
    stepPitch: 0.9, pushPitch: 1.4, winPitch: 1.8, failPitch: 0.6, undoPitch: 1.0,
    waveform: 'sawtooth', attackMs: 20, decayMs: 150,
  },
  nature: {
    id: 'nature', name: '自然', emoji: '🌿', description: '清新自然音效',
    stepPitch: 1.2, pushPitch: 1.1, winPitch: 1.3, failPitch: 0.9, undoPitch: 1.0,
    waveform: 'triangle', attackMs: 30, decayMs: 200,
  },
};

const PACK_KEY = 'sokoban_sound_pack';
let currentPack: SoundPackId = 'classic';

export function initSoundPack(): void {
  currentPack = (localStorage.getItem(PACK_KEY) as SoundPackId) || 'classic';
}

export function getSoundPack(): SoundPack { return SOUND_PACKS[currentPack]; }
export function setSoundPack(id: SoundPackId): void {
  currentPack = id;
  localStorage.setItem(PACK_KEY, id);
}

export function renderSoundPackSelector(container: HTMLElement): void {
  container.innerHTML = Object.values(SOUND_PACKS).map(p => `
    <button class="sound-pack-btn${currentPack===p.id?' active':''}" data-pack="${p.id}"
      style="padding:8px 12px;margin:4px;border-radius:8px;cursor:pointer;background:${currentPack===p.id?'#8be9fd':'#282a36'};color:${currentPack===p.id?'#17121f':'#f8f8f2'};border:1px solid #6272a4">
      ${p.emoji} ${p.name}
    </button>
  `).join('');
  container.querySelectorAll('[data-pack]').forEach(btn => {
    btn.addEventListener('click', () => {
      setSoundPack((btn as HTMLElement).dataset.pack as SoundPackId);
      renderSoundPackSelector(container);
    });
  });
}
