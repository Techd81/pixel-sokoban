// ─── 自适应难度推荐系统 Adaptive Difficulty ─────────────────────────────────
// 分析玩家历史表现，智能推荐下一关，调整提示频率

import type { Records } from './types';
import { LEVELS } from './levels';

export interface PlayerProfile {
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  averageEfficiency: number;  // bestMoves / parMoves 比值，越低越好
  completionRate: number;     // 0~1
  preferredBoxCount: number;  // 玩家表现最好的箱子数量
  struggleThreshold: number;  // 超过此步数比例认为困难
  hintFrequency: number;      // 建议提示频率 0~1
}

export function analyzePlayer(records: Records): PlayerProfile {
  const total = LEVELS.length;
  let cleared = 0;
  let totalEfficiency = 0;
  let effCount = 0;

  for (let i = 0; i < total; i++) {
    const r = records[i];
    if (!r || !r.bestMoves) continue;
    cleared++;
    const par = LEVELS[i].parMoves;
    if (par > 0) {
      totalEfficiency += r.bestMoves / par;
      effCount++;
    }
  }

  const completionRate = cleared / total;
  const avgEff = effCount > 0 ? totalEfficiency / effCount : 2;

  let skillLevel: PlayerProfile['skillLevel'];
  if (completionRate < 0.2 || avgEff > 2) skillLevel = 'beginner';
  else if (completionRate < 0.5 || avgEff > 1.5) skillLevel = 'intermediate';
  else if (completionRate < 0.8 || avgEff > 1.2) skillLevel = 'advanced';
  else skillLevel = 'expert';

  // 分析偏好箱子数量
  const boxPerf: Record<number, number[]> = {};
  for (let i = 0; i < total; i++) {
    const r = records[i];
    if (!r?.bestMoves) continue;
    const boxes = LEVELS[i].map.reduce((n, row) =>
      n + [...row].filter(c => c === '$' || c === '*').length, 0);
    if (!boxPerf[boxes]) boxPerf[boxes] = [];
    if (LEVELS[i].parMoves > 0) boxPerf[boxes].push(r.bestMoves / LEVELS[i].parMoves);
  }

  let bestBox = 2;
  let bestBoxEff = Infinity;
  for (const [b, effs] of Object.entries(boxPerf)) {
    const avg = effs.reduce((a, v) => a + v, 0) / effs.length;
    if (avg < bestBoxEff) { bestBoxEff = avg; bestBox = Number(b); }
  }

  return {
    skillLevel,
    averageEfficiency: Math.round(avgEff * 100) / 100,
    completionRate: Math.round(completionRate * 100) / 100,
    preferredBoxCount: bestBox,
    struggleThreshold: skillLevel === 'beginner' ? 2.5 : skillLevel === 'intermediate' ? 2.0 : 1.5,
    hintFrequency: skillLevel === 'beginner' ? 0.8 : skillLevel === 'intermediate' ? 0.4 : 0.1,
  };
}

export function getNextRecommended(records: Records, currentIndex: number): number {
  const profile = analyzePlayer(records);
  const uncleared = LEVELS
    .map((_, i) => i)
    .filter(i => !records[i]?.bestMoves && i !== currentIndex);

  if (uncleared.length === 0) return (currentIndex + 1) % LEVELS.length;

  // 根据技能等级选择合适难度
  const targetPar = (() => {
    switch (profile.skillLevel) {
      case 'beginner': return 15;
      case 'intermediate': return 30;
      case 'advanced': return 50;
      case 'expert': return 999;
    }
  })();

  // 找最接近目标难度的未通关
  return uncleared.sort((a, b) =>
    Math.abs(LEVELS[a].parMoves - targetPar) - Math.abs(LEVELS[b].parMoves - targetPar)
  )[0];
}

export function getAdaptiveHintDelay(records: Records, currentMoves: number, parMoves: number): number {
  if (parMoves <= 0) return -1; // 无par则不提示
  const profile = analyzePlayer(records);
  const ratio = currentMoves / parMoves;
  if (ratio < profile.struggleThreshold) return -1; // 不提示
  // 提示延迟：越初级越早提示（毫秒）
  return profile.skillLevel === 'beginner' ? 3000
    : profile.skillLevel === 'intermediate' ? 8000
    : 15000;
}

export function formatProfile(profile: PlayerProfile): string {
  const labels = { beginner: '新手', intermediate: '进阶', advanced: '达人', expert: '大师' };
  return `${labels[profile.skillLevel]} · 通关率${Math.round(profile.completionRate * 100)}% · 效率${profile.averageEfficiency.toFixed(2)}x`;
}
