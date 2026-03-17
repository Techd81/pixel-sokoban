// ─── AI 教练系统 AI Coach System ─────────────────────────────────────────────
// 分析玩家操作模式，给出个性化改进建议

import type { Records } from './types';
import { LEVELS } from './levels';
import { analyzePlayer } from './adaptive';

export interface CoachAdvice {
  type: 'tip' | 'warning' | 'encouragement' | 'challenge';
  title: string;
  message: string;
  action?: string;  // 建议操作
  priority: number; // 1-5
}

export function getCoachAdvice(records: Records, currentLevel: number, recentMoves: number[]): CoachAdvice[] {
  const profile = analyzePlayer(records);
  const advices: CoachAdvice[] = [];
  const level = LEVELS[currentLevel];
  const rec = records[currentLevel];

  // 效率建议
  if (rec?.bestMoves && level && rec.bestMoves > level.parMoves * 2) {
    advices.push({ type:'tip', title:'效率提升', message:`本关目标${level.parMoves}步，你用了${rec.bestMoves}步。试试先观察箱子路径再行动。`, priority:4 });
  }

  // 撤销过多
  const avgMoves = recentMoves.length > 0 ? recentMoves.reduce((a,b)=>a+b,0)/recentMoves.length : 0;
  if (avgMoves > 50) {
    advices.push({ type:'warning', title:'思考再行动', message:'你的平均步数较高，建议先规划好路线再移动。', priority:3 });
  }

  // 鼓励
  if (profile.completionRate > 0.7) {
    advices.push({ type:'encouragement', title:'接近传说！', message:`已通关${Math.round(profile.completionRate*100)}%，坚持冲击全通关！`, priority:2 });
  } else if (profile.completionRate < 0.1) {
    advices.push({ type:'encouragement', title:'加油！', message:'刚刚开始，多尝试不同路线，你会越来越好！', priority:1 });
  }

  // 挑战建议
  if (profile.skillLevel === 'expert') {
    advices.push({ type:'challenge', title:'挑战模式', message:'你已是专家！尝试不用提示完成所有关卡三星！', action:'开始挑战', priority:5 });
  }

  return advices.sort((a,b) => b.priority - a.priority);
}

export function renderCoachPanel(container: HTMLElement, advices: CoachAdvice[]): void {
  const typeIcon = { tip:'💡', warning:'⚠️', encouragement:'🎉', challenge:'🏆' };
  const typeColor = { tip:'#8be9fd', warning:'#ffd166', encouragement:'#50fa7b', challenge:'#ff79c6' };
  container.innerHTML = advices.length === 0
    ? '<p style="color:#888;text-align:center">继续游戏，AI教练会分析你的表现</p>'
    : advices.map(a => `
      <div style="border-left:3px solid ${typeColor[a.type]};padding:8px 12px;margin:6px 0;background:#1e1a2e;border-radius:4px">
        <b style="color:${typeColor[a.type]}">${typeIcon[a.type]} ${a.title}</b>
        <p style="margin:4px 0;font-size:0.85em;color:#ccc">${a.message}</p>
        ${a.action ? `<button data-action="challenge" style="font-size:0.8em;padding:2px 8px;background:${typeColor[a.type]};color:#000;border:none;border-radius:3px;cursor:pointer">${a.action}</button>` : ''}
      </div>
    `).join('');
  // 绑定 data-action 按钮事件（替代 onclick 字符串）
  container.querySelectorAll<HTMLElement>('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'challenge') {
        document.dispatchEvent(new CustomEvent('coach-action', { detail: { action } }));
      }
    });
  });
}
