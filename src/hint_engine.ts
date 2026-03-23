// ─── 智能提示引擎 Smart Hint Engine ──────────────────────────────────────────
import type { Pos } from './types';
import { aiBfsSolve, type SolverResult } from './solver';

export interface HintResult {
  type: 'move' | 'push' | 'stuck' | 'nearWin';
  arrow: string;          // '↑'|'↓'|'←'|'→'
  targetBox: Pos | null;
  targetGoal: Pos | null;
  confidence: number;     // 0~1
  message: string;
  stepsToWin: number;
}

const DIR_ARROW: Record<string, string> = { '0,-1':'↑', '0,1':'↓', '-1,0':'←', '1,0':'→' };

export function buildHintResult(
  grid: string[][],
  player: Pos,
  goals: Pos[],
  result: SolverResult | null
): HintResult {
  if (!result || result.steps.length === 0) {
    return { type:'stuck', arrow:'?', targetBox:null, targetGoal:null, confidence:0, message:'此局无解，请撤销或重开', stepsToWin:0 };
  }

  const first = result.steps[0];
  const key = `${first.dx},${first.dy}`;
  const arrow = DIR_ARROW[key] || '→';
  const stepsToWin = result.steps.length;
  const nx = player.x + first.dx;
  const ny = player.y + first.dy;
  let targetBox: Pos | null = null;
  let targetGoal: Pos | null = null;
  const cell = (grid[ny] || [])[nx];
  if (cell === '$' || cell === '*') {
    targetBox = { x: nx, y: ny };
    targetGoal = goals.length > 0 ? goals[0] : null;
  }
  const type = stepsToWin <= 3 ? 'nearWin' : targetBox ? 'push' : 'move';
  const msg = type === 'nearWin' ? `再${stepsToWin}步可通关！` :
              type === 'push' ? `推动箱子${arrow}` :
              `向${arrow}移动`;
  return { type, arrow, targetBox, targetGoal, confidence: 1, message: msg, stepsToWin };
}

export function getSmartHint(
  grid: string[][], player: Pos, goals: Pos[]
): HintResult {
  return buildHintResult(grid, player, goals, aiBfsSolve(grid, player, goals));
}
