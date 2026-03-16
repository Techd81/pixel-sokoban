// ─── 互动教程系统 Interactive Tutorial ──────────────────────────────────────
// 引导新玩家学习游戏操作，高亮提示+步骤说明

export interface TutorialStep {
  id: string;
  title: string;
  desc: string;
  highlight?: string;   // CSS selector to highlight
  action?: string;      // expected action: 'move_up'|'move_down'|'push_box'|'undo'|'any'
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '欢迎来到像素推箱子！',
    desc: '把所有木箱推进发光的目标点，就能通关。',
    position: 'center',
    action: 'any',
  },
  {
    id: 'controls',
    title: '移动操作',
    desc: '用 ↑↓←→ 或 WASD 键移动角色。也支持触屏滑动！',
    highlight: '#board',
    position: 'bottom',
    action: 'any',
  },
  {
    id: 'push_box',
    title: '推箱子',
    desc: '走向箱子就会推动它。箱子推到目标点会发光！',
    highlight: '#board',
    position: 'bottom',
    action: 'push_box',
  },
  {
    id: 'undo',
    title: '撤销操作',
    desc: '按 Z 键撤销上一步。走错了不要紧！',
    highlight: '#undoBtn',
    position: 'top',
    action: 'undo',
  },
  {
    id: 'restart',
    title: '重新开始',
    desc: '按 R 键重置关卡，重新挑战。',
    highlight: '#restartBtn',
    position: 'top',
    action: 'any',
  },
  {
    id: 'complete',
    title: '教程完成！',
    desc: '你已学会基本操作，开始挑战70个关卡吧！',
    position: 'center',
    action: 'any',
  },
];

const TUTORIAL_KEY = 'sokoban_tutorial_done';

export function isTutorialDone(): boolean {
  return localStorage.getItem(TUTORIAL_KEY) === '1';
}

export function markTutorialDone(): void {
  localStorage.setItem(TUTORIAL_KEY, '1');
}

export function resetTutorial(): void {
  localStorage.removeItem(TUTORIAL_KEY);
}

export class TutorialManager {
  private currentStep = 0;
  private overlay: HTMLElement | null = null;
  private tooltip: HTMLElement | null = null;
  private active = false;
  private onComplete: (() => void) | null = null;

  start(onComplete?: () => void): void {
    if (this.active) return;
    this.active = true;
    this.currentStep = 0;
    this.onComplete = onComplete ?? null;
    this.createOverlay();
    this.showStep(0);
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9000',
      'pointer-events:none',
    ].join(';');
    document.body.appendChild(this.overlay);
  }

  private showStep(index: number): void {
    const step = TUTORIAL_STEPS[index];
    if (!step) { this.finish(); return; }
    this.tooltip?.remove();
    const tip = document.createElement('div');
    tip.style.cssText = [
      'position:fixed', 'z-index:9001', 'max-width:280px',
      'background:#282a36', 'border:2px solid #8be9fd',
      'border-radius:12px', 'padding:16px',
      'color:#f8f8f2', 'font-family:monospace',
      'box-shadow:0 4px 24px rgba(0,0,0,0.6)',
      'pointer-events:auto',
    ].join(';');
    tip.innerHTML = `
      <div style="font-size:1.1em;font-weight:bold;margin-bottom:8px;color:#8be9fd">${step.title}</div>
      <div style="font-size:0.9em;line-height:1.5;margin-bottom:12px">${step.desc}</div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="color:#888;font-size:0.8em">${index + 1}/${TUTORIAL_STEPS.length}</span>
        <button id="tutNext" style="background:#8be9fd;color:#17121f;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-weight:bold">继续</button>
      </div>
    `;
    this.positionTooltip(tip, step);
    document.body.appendChild(tip);
    this.tooltip = tip;
    tip.querySelector('#tutNext')?.addEventListener('click', () => this.next());
    if (step.highlight) {
      const el = document.querySelector(step.highlight) as HTMLElement | null;
      if (el) { el.style.outline = '3px solid #ffd166'; el.style.outlineOffset = '3px'; }
    }
  }

  private positionTooltip(tip: HTMLElement, step: TutorialStep): void {
    const pos = step.position;
    if (pos === 'center') {
      tip.style.top = '50%'; tip.style.left = '50%';
      tip.style.transform = 'translate(-50%,-50%)';
    } else if (pos === 'bottom') {
      tip.style.bottom = '120px'; tip.style.left = '50%';
      tip.style.transform = 'translateX(-50%)';
    } else if (pos === 'top') {
      tip.style.top = '80px'; tip.style.left = '50%';
      tip.style.transform = 'translateX(-50%)';
    }
  }

  next(): void {
    // 清除高亮
    const prev = TUTORIAL_STEPS[this.currentStep];
    if (prev?.highlight) {
      const el = document.querySelector(prev.highlight) as HTMLElement | null;
      if (el) { el.style.outline = ''; el.style.outlineOffset = ''; }
    }
    this.currentStep++;
    this.showStep(this.currentStep);
  }

  private finish(): void {
    this.active = false;
    this.tooltip?.remove();
    this.overlay?.remove();
    markTutorialDone();
    this.onComplete?.();
  }

  skip(): void { this.finish(); }
}

export const tutorialManager = new TutorialManager();
