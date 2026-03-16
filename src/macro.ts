// ─── 键盘宏录制系统 Macro Recorder ──────────────────────────────────────────
// 录制一段操作序列，可一键重放（适合练习固定手法）

export interface Macro {
  id: string;
  name: string;
  moves: Array<{ dx: number; dy: number; facing: string }>;
  createdAt: number;
  levelIndex: number;
}

const MACRO_STORAGE_KEY = 'sokoban_macros';

function loadMacros(): Macro[] {
  try {
    return JSON.parse(localStorage.getItem(MACRO_STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveMacros(macros: Macro[]): void {
  try { localStorage.setItem(MACRO_STORAGE_KEY, JSON.stringify(macros)); } catch { }
}

export class MacroRecorder {
  private recording = false;
  private moves: Macro['moves'] = [];
  private levelIndex = -1;

  get isRecording() { return this.recording; }

  start(levelIndex: number): void {
    this.recording = true;
    this.moves = [];
    this.levelIndex = levelIndex;
  }

  record(dx: number, dy: number, facing: string): void {
    if (!this.recording) return;
    this.moves.push({ dx, dy, facing });
  }

  stop(name?: string): Macro | null {
    if (!this.recording || this.moves.length === 0) { this.recording = false; return null; }
    this.recording = false;
    const macro: Macro = {
      id: Date.now().toString(36),
      name: name ?? `宏${new Date().toLocaleTimeString()}`,
      moves: [...this.moves],
      createdAt: Date.now(),
      levelIndex: this.levelIndex,
    };
    const macros = loadMacros();
    macros.unshift(macro);
    if (macros.length > 20) macros.splice(20);
    saveMacros(macros);
    return macro;
  }

  cancel(): void { this.recording = false; this.moves = []; }
}

export class MacroPlayer {
  private playIntervalId: ReturnType<typeof setInterval> | null = null;

  play(
    macro: Macro,
    onStep: (dx: number, dy: number, facing: string) => void,
    onDone?: () => void,
    intervalMs = 150
  ): void {
    let i = 0;
    this.stop();
    this.playIntervalId = setInterval(() => {
      if (i >= macro.moves.length) {
        this.stop();
        onDone?.();
        return;
      }
      const { dx, dy, facing } = macro.moves[i++];
      onStep(dx, dy, facing);
    }, intervalMs);
  }

  stop(): void {
    if (this.playIntervalId) { clearInterval(this.playIntervalId); this.playIntervalId = null; }
  }

  isPlaying(): boolean { return this.playIntervalId !== null; }
}

export function getMacrosForLevel(levelIndex: number): Macro[] {
  return loadMacros().filter(m => m.levelIndex === levelIndex);
}

export function deleteMacro(id: string): void {
  saveMacros(loadMacros().filter(m => m.id !== id));
}

export function getAllMacros(): Macro[] {
  return loadMacros();
}
