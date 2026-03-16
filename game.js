// 像素推箱子 game.js — 完整重建版
const TILE = { WALL: '#', FLOOR: ' ', GOAL: '.', BOX: '$', PLAYER: '@', BOX_ON_GOAL: '*', PLAYER_ON_GOAL: '+' };
const STORAGE_KEY = 'pixelSokobanRecords';

const LEVELS = [
  { name: '入门仓库', parMoves: 2, starMoves: { three: 2, two: 3, one: 5 }, map: ['########','#  .   #','#  $   #','#  @   #','#      #','########'] },
  { name: '双箱练习', parMoves: 8, starMoves: { three: 8, two: 11, one: 15 }, map: ['#########','#   .   #','#       #','# .$$ @ #','#       #','#########'] },
  { name: '回字走廊', parMoves: 14, starMoves: { three: 14, two: 18, one: 24 }, map: ['##########','#   .    #','# ###$## #','# #  $ . #','# # ##   #','#   @    #','##########'] },
  { name: '错位入库', parMoves: 11, starMoves: { three: 11, two: 15, one: 21 }, map: ['#########','#   .   #','#   $   #','#   @   #','#  . .  #','#########'] },
  { name: '短廊会车', parMoves: 9, starMoves: { three: 9, two: 12, one: 17 }, map: ['########','#  .   #','# $    #','#   $  #','#  .@  #','########'] },
  { name: '先后顺序', parMoves: 17, starMoves: { three: 17, two: 22, one: 30 }, map: ['#########','# . .   #','# $ $   #','#   @   #','#########'] },
  { name: '回廊调箱', parMoves: 22, starMoves: { three: 22, two: 29, one: 38 }, map: ['##########','#  .  .  #','#        #','# $$  @  #','#        #','##########'] },
  { name: '三箱分流', parMoves: 24, starMoves: { three: 24, two: 31, one: 41 }, map: ['#########','# . . . #','#       #','# $ $ $ #','#   @   #','#########'] },
  { name: '窄道终盘', parMoves: 27, starMoves: { three: 27, two: 35, one: 46 }, map: ['#######','# .   #','# $   #','# $   #','# . . #','#  @  #','#######'] },
  { name: 'L形仓库', parMoves: 20, starMoves: { three: 20, two: 26, one: 35 }, map: ['######   ','#    #   ','# .$ ####','##$#    #',' # . $  #',' #  .@  #',' ########'] },
  { name: '交叉火线', parMoves: 17, starMoves: { three: 17, two: 22, one: 30 }, map: ['#######','#  .  #','# $.$ #','#  @  #','#######'] },
  { name: '迷宫五号', parMoves: 21, starMoves: { three: 21, two: 27, one: 36 }, map: ['#########','#   .   #','#  $#$  #','#   @   #','#  . .  #','#########'] },
  { name: '四角归位', parMoves: 25, starMoves: { three: 25, two: 33, one: 43 }, map: ['#########','# .   . #','#       #','#   @   #','#       #','# .   . #','#########'] },
  { name: '锁链推进', parMoves: 26, starMoves: { three: 26, two: 34, one: 44 }, map: ['######   ','#    #   ','# .$ ####','##$#    #',' # . $  #',' #  .@  #',' ########'] },
  { name: '回旋镖', parMoves: 26, starMoves: { three: 26, two: 34, one: 44 }, map: ['  ###### ','###    # ','# $ .  # ','# #$## ##','# . $   #','##.  $  #',' #  .@  #',' ########'] },
  { name: '蛇形走廊', parMoves: 31, starMoves: { three: 31, two: 40, one: 52 }, map: ['########  ','#  . . #  ','#      ## ','## $#$  # ',' # @#   # ',' # $# $ # ',' #  #.  # ',' ####.### '] },
  { name: '双螺旋', parMoves: 34, starMoves: { three: 34, two: 44, one: 56 }, map: ['#########','#   #   #','# $   # #','#  ##.$ #','# $.#   #','#     # #','## .# @ #',' ########'] },
  { name: '中心对称', parMoves: 58, starMoves: { three: 58, two: 73, one: 92 }, map: ['#########','#  .@.  #','# $###$ #','#   #   #','# $###$ #','#  . .  #','#########'] },
  { name: '迷城', parMoves: 63, starMoves: { three: 63, two: 80, one: 100 }, map: ['##########','#  .  .  #','# $####$ #','#   ##   #','# $####$ #','#  . @.  #','##########'] },
  { name: '大终局', parMoves: 63, starMoves: { three: 63, two: 80, one: 100 }, map: ['##########','#  . @.  #','# $####$ #','#   ##   #','# $####$ #','#  .  .  #','##########'] },
  { name: '斜线突破', parMoves: 4, starMoves: { three: 4, two: 6, one: 9 }, map: ['########','#  ..  #','#  $$  #','#   @  #','########'] },
  { name: '隔墙推箱', parMoves: 19, starMoves: { three: 19, two: 25, one: 33 }, map: ['########','#   .  #','# $    #','#  #   #','# $  @ #','#  .   #','########'] },
  { name: '旋转门', parMoves: 28, starMoves: { three: 28, two: 36, one: 48 }, map: [' ########','##  .   #','# $   # #','#   #$  #','# #   . #','#  $# @ #','#  .    #',' ########'] },
  { name: '双通道', parMoves: 17, starMoves: { three: 17, two: 22, one: 30 }, map: ['########','#. . . #','#      #','# $$$  #','#   @  #','########'] },
  { name: '十字路口', parMoves: 11, starMoves: { three: 11, two: 15, one: 20 }, map: ['#######','#  .  #','# $.$ #','#  @  #','#######'] },
  { name: '长廊换位', parMoves: 7, starMoves: { three: 7, two: 10, one: 14 }, map: ['##########','#  .  .  #','#  $  $  #','#  @     #','##########'] },
  { name: '三角阵列', parMoves: 5, starMoves: { three: 5, two: 7, one: 10 }, map: ['#######','#  .  #','# .$. #','#  @  #','#######'] },
  { name: '环形走廊', parMoves: 8, starMoves: { three: 8, two: 11, one: 15 }, map: ['########','# .. . #','# $$ $ #','#   @  #','########'] },
  { name: '王者殿堂', parMoves: 12, starMoves: { three: 12, two: 16, one: 22 }, map: ['#########','#  . .  #','# $   $ #','#   @   #','#########'] },
  { name: '终极挑战', parMoves: 17, starMoves: { three: 17, two: 22, one: 30 }, map: ['##########','#  .  .  #','# $    $ #','#   @    #','##########'] },

  { name: '角落联动', parMoves: 9, starMoves: { three: 9, two: 12, one: 17 },
    map: ['#######','#.  . #','# $$ @#','#     #','#######'] },
  { name: '错落入库', parMoves: 7, starMoves: { three: 7, two: 10, one: 14 },
    map: ['########','#    . #','# $    #','#   $  #','# . .@ #','########'] },
  { name: '阶梯移位', parMoves: 12, starMoves: { three: 12, two: 16, one: 22 },
    map: ['########','#. . . #','# $$$  #','#  @   #','########'] },
  { name: '错位归仓', parMoves: 11, starMoves: { three: 11, two: 15, one: 21 },
    map: ['#######','#.  . #','# $$ @#','#     #','#######'] },
  { name: '双向推进', parMoves: 11, starMoves: { three: 11, two: 15, one: 21 },
    map: ['########','#   .  #','# $    #','#   $  #','#  . @ #','########'] },
  { name: '斜角仓储', parMoves: 13, starMoves: { three: 13, two: 17, one: 24 },
    map: ['########','#  .   #','# $ #  #','#   $  #','# . @ #','########'] },
  { name: '分叉推箱', parMoves: 16, starMoves: { three: 16, two: 21, one: 28 },
    map: ['#########','#  . .  #','# $   $ #','#   @   #','#########'] },
  { name: '四角汇聚', parMoves: 16, starMoves: { three: 16, two: 21, one: 28 },
    map: ['##########','#. .    .#','# $$  $  #','#    @   #','##########'] },
  { name: '环形推进', parMoves: 7, starMoves: { three: 7, two: 10, one: 14 },
    map: ['########','# .  . #','# $  $ #','#  @@  #','########'] },
  { name: '中轴对称', parMoves: 11, starMoves: { three: 11, two: 15, one: 21 },
    map: ['#########','#   .   #','#  $.$  #','#   @   #','#########'] },
  { name: '平推入库', parMoves: 6, starMoves: { three: 6, two: 9, one: 13 },
    map: ['##########','# .  .   #','# $  $   #','#    @   #','##########'] },
  { name: '角落推入', parMoves: 3, starMoves: { three: 3, two: 5, one: 8 },
    map: [' #######','## .   #','#  $   #','# . $@ #','#      #','########'] },
  { name: '双管齐下', parMoves: 7, starMoves: { three: 7, two: 10, one: 14 },
    map: ['#########','#  . .  #','#  $$   #','#    @  #','#########'] },
  { name: '侧翼迂回', parMoves: 6, starMoves: { three: 6, two: 9, one: 13 },
    map: ['########','# .    #','# $  . #','#    $ #','#   @  #','########'] },
  { name: '梯形归位', parMoves: 14, starMoves: { three: 14, two: 18, one: 25 },
    map: ['#########','#  .    #','# $ . $ #','#   @   #','#########'] },
  { name: '并排推进', parMoves: 7, starMoves: { three: 7, two: 10, one: 14 },
    map: ['########','# .  . #','# $  $ #','#  @   #','########'] },
  { name: '宽廊协作', parMoves: 6, starMoves: { three: 6, two: 9, one: 13 },
    map: ['#########','# .  .  #','# $  $  #','#    @  #','#########'] },

  { name: '交错入仓', parMoves: 8, starMoves: { three: 8, two: 11, one: 16 },
    map: ['#######','#. .  #','# $$ @#','#     #','#######'] },
  { name: '对称推进', parMoves: 7, starMoves: { three: 7, two: 10, one: 14 },
    map: ['########','# .  . #','# $  $ #','#  @@  #','########'] },
  { name: '侧压归仓', parMoves: 10, starMoves: { three: 10, two: 14, one: 19 },
    map: ['########','# .  . #','# $$ @ #','#      #','########'] },
  { name: '中央汇流', parMoves: 6, starMoves: { three: 6, two: 9, one: 13 },
    map: ['#########','#  . .  #','#  $ $  #','#   @   #','#########'] },
  { name: '平行推入', parMoves: 5, starMoves: { three: 5, two: 8, one: 12 },
    map: ['########','# ..   #','# $$   #','#   @  #','########'] },

  { name: '双翼展开', parMoves: 12, starMoves: { three: 12, two: 16, one: 22 },
    map: ['########','#.    .#','# $  $ #','#   @  #','########'] },
  { name: '三横排', parMoves: 11, starMoves: { three: 11, two: 15, one: 21 },
    map: ['#########','# . . . #','# $ $ $ #','#   @   #','#########'] },
  { name: '三叉路口', parMoves: 18, starMoves: { three: 18, two: 24, one: 32 },
    map: ['#########','#   .   #','# $   $ #','#   .   #','#   @   #','#########'] },
  { name: '横排冲锋', parMoves: 10, starMoves: { three: 10, two: 14, one: 19 },
    map: ['########','# . . .#','# $ $ $#','#    @ #','########'] },
  { name: '中轴并列', parMoves: 4, starMoves: { three: 4, two: 6, one: 9 },
    map: ['########','#  ..  #','#  $$  #','#   @  #','########'] },

  { name: '斜推入库', parMoves: 15, starMoves: { three: 15, two: 20, one: 27 },
    map: ['########','#  .   #','# $    #','# .$ @ #','########'] },
  { name: '快捷推入', parMoves: 5, starMoves: { three: 5, two: 7, one: 11 },
    map: ['########','# ..   #','# $$   #','#   @  #','########'] },
  { name: '双格归位', parMoves: 17, starMoves: { three: 17, two: 22, one: 30 },
    map: ['########','#  .   #','# $  $ #','#  . @ #','########'] },

  { name: '三连推', parMoves: 11, starMoves: { three: 11, two: 15, one: 21 },
    map: ['########','#. . . #','# $$$  #','#  @   #','########'] },
  { name: '双人推进', parMoves: 12, starMoves: { three: 12, two: 16, one: 22 },
    map: ['########','#  .   #','# .$   #','#  $   #','#  @   #','########'] },
  { name: '双叠归仓', parMoves: 10, starMoves: { three: 10, two: 14, one: 19 },
    map: ['########','#  .   #','# .$$ @#','########'] },
  { name: '并排入库', parMoves: 15, starMoves: { three: 15, two: 20, one: 27 },
    map: ['########','# .  . #','# $  $ #','#  @   #','########'] },
  { name: '角落归位', parMoves: 6, starMoves: { three: 6, two: 9, one: 13 },
    map: ['########','#. .   #','# $$   #','#   @  #','########'] },
  { name: '双路推进', parMoves: 7, starMoves: { three: 7, two: 10, one: 14 },
    map: ['########','# .  . #','# $  $ #','#  @@  #','########'] },
  { name: '纵深对推', parMoves: 6, starMoves: { three: 6, two: 9, one: 13 },
    map: ['########','#  .  .#','#  $  $#','#  @   #','########'] },
  { name: '中路突破', parMoves: 12, starMoves: { three: 12, two: 16, one: 22 },
    map: ['########','#  .   #','# $. $ #','#   @  #','########'] },
  { name: '小双推', parMoves: 5, starMoves: { three: 5, two: 7, one: 11 },
    map: ['########','# . .  #','# $ $  #','#   @  #','########'] },
  { name: '开口归仓', parMoves: 8, starMoves: { three: 8, two: 11, one: 16 },
    map: ['#######','#. .  #','# $$ @#','#      #','#######'] },
];

// ─── 状态 ────────────────────────────────────────────────────────────────────
const state = {
  levelIndex: 0,
  grid: [],
  player: { x: 0, y: 0 },
  goals: [],
  moves: 0,
  pushes: 0,
  history: [],
  won: false,
  records: null,
  facing: 'down',
  stepFrame: 0,
  uiScreen: 'game',
  effects: { goalFlash: null, cratePulse: null, shake: false, prevPlayer: null, prevBoxes: null, deadlocks: null },
  timer: { running: false, startMs: 0, elapsedMs: 0 },
  playerMoved: false,
  recording: [],
  ai: { solving: false, demo: false, demoSteps: [], demoIndex: 0, demoIntervalId: null, hintArrow: null, hintBox: null, speed: 350 },
  combo: { count: 0, lastPushMs: 0 },
  levelSelectFocus: 0,
  stats: { maxCombo:0, hintCount:0, themesUsed:new Set(), maxLevel:0, taPlayed:false, replayPlayed:false, randomPlayed:false },
};
state.records = loadRecords();

const boardEl = document.getElementById("board");
const levelLabelEl = document.getElementById("levelLabel");
const moveCountEl = document.getElementById("moveCount");
const pushCountEl = document.getElementById("pushCount");
const parMovesEl = document.getElementById("parMoves");
const bestMovesEl = document.getElementById("bestMoves");
const bestRankEl = document.getElementById("bestRank");
const timeDisplayEl = document.getElementById("timeDisplay");
const progressTextEl = document.getElementById("progressText");
const progressFillEl = document.getElementById("progressFill");
const messageEl = document.getElementById("message");
const winModalEl = document.getElementById("winModal");
const winTextEl = document.getElementById("winText");
const winRankEl = document.getElementById("winRank");
const winChallengeEl = document.getElementById("winChallenge");
const winBestEl = document.getElementById("winBest");
const levelSelectEl = document.getElementById("levelSelect");
const levelSelectGridEl = document.getElementById("levelSelectGrid");
const levelSelectCloseBtn = document.getElementById("levelSelectCloseBtn");

// ─── localStorage ────────────────────────────────────────────────────────────
function loadRecords() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (parsed.levels) return parsed.levels;
      return parsed;
    }
    return {};
  } catch { return {}; }
}
function saveRecords() {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, levels: state.records })); } catch {}
}
function getLevelConfig(index = state.levelIndex) { return LEVELS[index]; }
function getRecord(index = state.levelIndex) { return state.records[index] ?? null; }
function getRank(moves, starMoves) {
  if (moves <= starMoves.three) return "★★★";
  if (moves <= starMoves.two) return "★★";
  if (moves <= starMoves.one) return "★";
  return "通关";
}
function formatBest(record) {
  if (!record) return "--";
  return `${record.bestMoves} 步`;
}
function formatMs(ms) {
  if (!ms) return "--";
  const s = Math.floor(ms/1000), m = Math.floor(s/60);
  return m>0 ? `${m}分${(s%60).toString().padStart(2,"0")}秒` : `${s}秒`;
}
function updateRecord(result) {
  const existing = getRecord();
  const shouldReplace = !existing || result.moves < existing.bestMoves ||
    (result.moves === existing.bestMoves && result.pushes < existing.bestPushes);
  const bestMoves = shouldReplace ? result.moves : existing.bestMoves;
  const bestPushes = shouldReplace ? result.pushes : existing.bestPushes;
  const bestRank = shouldReplace ? result.rank : existing.bestRank;
  const timeMs = result.timeMs || null;
  const shouldReplaceTime = timeMs !== null && (!existing || !existing.bestTimeMs || timeMs < existing.bestTimeMs);
  const bestTimeMs = shouldReplaceTime ? timeMs : existing?.bestTimeMs;
  const prevCompletedAt=existing?.completedAt;
  const newCompletedAt=shouldReplace?Date.now():(prevCompletedAt||Date.now());
  state.records[state.levelIndex] = { bestMoves, bestPushes, bestRank, bestTimeMs, challengeCleared: result.challengeCleared || existing?.challengeCleared, cleared: true, completedAt:newCompletedAt };
  saveRecords();
  return { record: state.records[state.levelIndex], isNewBest: shouldReplace };
}

// ─── 音频系统 ─────────────────────────────────────────────────────────────────
const audio = {
  ctx: null, masterGain: null, sfxGain: null, bgmGain: null,
  unlocked: false, started: false, noteIndex: 0, loopId: null, bgmTrack: 0,
  patterns: [
    [{bass:130.81,lead:261.63},{bass:146.83,lead:293.66},{bass:164.81,lead:329.63},{bass:146.83,lead:293.66},{bass:174.61,lead:349.23},{bass:164.81,lead:329.63},{bass:146.83,lead:293.66},{bass:130.81,lead:261.63}],
    [{bass:110,lead:220},{bass:123.47,lead:246.94},{bass:130.81,lead:261.63},{bass:146.83,lead:293.66},{bass:130.81,lead:261.63},{bass:123.47,lead:246.94},{bass:110,lead:220},{bass:98,lead:196}],
    [{bass:196,lead:392},{bass:220,lead:440},{bass:246.94,lead:493.88},{bass:261.63,lead:523.25},{bass:246.94,lead:493.88},{bass:220,lead:440},{bass:196,lead:392},{bass:174.61,lead:349.23}],
    // Track 3: Cyber (pentatonic minor, higher register)
    [{bass:220,lead:440},{bass:261.63,lead:523.25},{bass:293.66,lead:587.33},{bass:261.63,lead:523.25},{bass:220,lead:440},{bass:196,lead:392},{bass:174.61,lead:349.23},{bass:196,lead:392}],
  ],
  get pattern() { return this.patterns[this.bgmTrack] || this.patterns[0]; },
  ensureContext() {
    if (!window.AudioContext && !window.webkitAudioContext) return false;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.22;
      this.sfxGain.gain.value = 1;
      this.bgmGain.gain.value = 0.22;
      this.sfxGain.connect(this.masterGain);
      this.bgmGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    return true;
  },

  unlock() {
    if (!this.ensureContext()) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    if (!this.unlocked) { this.unlocked = true; this.startBgm(); }
  },
  setVolume(vol) {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0,Math.min(1,vol));
    localStorage.setItem("pixelSokobanVolume",String(vol));
  },
  playTone({frequency,type="square",duration=0.08,volume=0.22,slideTo}) {
    if (!this.unlocked||!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency,now);
    if (slideTo) osc.frequency.linearRampToValueAtTime(slideTo,now+duration);
    gain.gain.setValueAtTime(0.0001,now);
    gain.gain.exponentialRampToValueAtTime(volume,now+0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001,now+duration);
    osc.connect(gain); gain.connect(this.sfxGain);
    osc.start(now); osc.stop(now+duration+0.02);
  },
  playSequence(seq) {
    if (!this.unlocked||!this.ctx) return;
    let offset = 0;
    seq.forEach(note => {
      const now = this.ctx.currentTime+offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = note.type||"square";
      osc.frequency.setValueAtTime(note.frequency,now);
      gain.gain.setValueAtTime(0.0001,now);
      gain.gain.exponentialRampToValueAtTime(note.volume||0.15,now+0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001,now+note.duration);
      osc.connect(gain); gain.connect(this.sfxGain);
      osc.start(now); osc.stop(now+note.duration+0.02);
      offset += note.duration;
    });
  },
  playSfx(type, arg) {
    if (!this.unlocked) return;
    const mb = 380 + Math.min(state.moves,20)*4;
    const actions = {
      move: () => { const f=state.stepFrame===0?mb:mb*1.06; this.playTone({frequency:f,type:"triangle",duration:0.07,volume:0.38,slideTo:f+35}); },
      fail: () => { this.playTone({frequency:180,type:"sawtooth",duration:0.11,volume:0.14,slideTo:110}); this.playTone({frequency:90,type:"square",duration:0.06,volume:0.08}); },
      push: () => { this.playTone({frequency:120,type:"square",duration:0.05,volume:0.12}); this.playSequence([{frequency:220,duration:0.06,volume:0.15,type:"square"},{frequency:300,duration:0.07,volume:0.13,type:"triangle"}]); },
      clear: () => this.playSequence([{frequency:261.63,duration:0.1,volume:0.16,type:"triangle"},{frequency:329.63,duration:0.1,volume:0.16,type:"triangle"},{frequency:392,duration:0.1,volume:0.17,type:"square"},{frequency:523.25,duration:0.12,volume:0.18,type:"square"},{frequency:659.26,duration:0.12,volume:0.17,type:"triangle"},{frequency:783.99,duration:0.14,volume:0.16,type:"triangle"},{frequency:1046.5,duration:0.2,volume:0.18,type:"square"}]),
      boxOnGoal: () => { this.playSequence([{frequency:523.25,duration:0.05,volume:0.18,type:"square"},{frequency:659.26,duration:0.09,volume:0.2,type:"square"},{frequency:783.99,duration:0.14,volume:0.18,type:"triangle"},{frequency:1046.5,duration:0.1,volume:0.14,type:"triangle"}]); this.playTone({frequency:130,type:"triangle",duration:0.2,volume:0.06}); },
      undo: () => this.playTone({frequency:220,type:"triangle",duration:0.12,volume:0.15,slideTo:180}),
      ui: () => this.playTone({frequency:440,type:"sine",duration:0.08,volume:0.12}),
      ripple: () => this.playTone({frequency:880,type:"sine",duration:0.15,volume:0.08,slideTo:1200}),
      screenshot: () => { this.playTone({frequency:2000,type:"square",duration:0.03,volume:0.1}); this.playTone({frequency:800,type:"triangle",duration:0.06,volume:0.06}); },
      comboEnd: () => this.playTone({frequency:330,type:'sawtooth',duration:0.15,volume:0.1,slideTo:180}),
      deadlock: () => { this.playTone({frequency:120,type:'sawtooth',duration:0.12,volume:0.12}); this.playTone({frequency:80,type:'square',duration:0.1,volume:0.08}); },
      achievement: () => this.playSequence([{frequency:523.25,duration:0.06,volume:0.15,type:'triangle'},{frequency:659.26,duration:0.06,volume:0.17,type:'triangle'},{frequency:783.99,duration:0.08,volume:0.19,type:'square'},{frequency:1046.5,duration:0.1,volume:0.21,type:'square'},{frequency:1568,duration:0.2,volume:0.17,type:'triangle'}]),
      win3star: () => this.playSequence([{frequency:523.25,duration:0.08,volume:0.18,type:"triangle"},{frequency:659.26,duration:0.08,volume:0.2,type:"triangle"},{frequency:783.99,duration:0.08,volume:0.22,type:"square"},{frequency:1046.5,duration:0.12,volume:0.24,type:"square"},{frequency:1318.5,duration:0.15,volume:0.22,type:"triangle"},{frequency:2093,duration:0.3,volume:0.18,type:"square"}]),
      combo: (count) => { const freqs=[440,554,659,784,988]; const f=freqs[Math.min((count||2)-2,4)]; this.playSequence([{frequency:f,duration:0.05,volume:0.18,type:"square"},{frequency:f*1.25,duration:0.07,volume:0.2,type:"square"},{frequency:f*1.5,duration:0.09,volume:0.22,type:"triangle"}]); },
    };
    if (actions[type]) actions[type](arg);
  },
  startBgm() {
    if (!this.ctx||this.started) return;
    this.started = true;
    const tick = () => {
      if (!this.unlocked||!this.ctx) return;
      triggerBeatPulse();
      const step = this.pattern[this.noteIndex%this.pattern.length];
      this.noteIndex++;
      const bassOsc=this.ctx.createOscillator(), bassGain=this.ctx.createGain();
      bassOsc.type="triangle"; bassOsc.frequency.setValueAtTime(step.bass,this.ctx.currentTime);
      bassGain.gain.setValueAtTime(0.0001,this.ctx.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.045,this.ctx.currentTime+0.02);
      bassGain.gain.exponentialRampToValueAtTime(0.0001,this.ctx.currentTime+0.42);
      bassOsc.connect(bassGain); bassGain.connect(this.bgmGain);
      bassOsc.start(); bassOsc.stop(this.ctx.currentTime+0.45);
      if (this.noteIndex%2===1) {
        const leadOsc=this.ctx.createOscillator(), leadGain=this.ctx.createGain();
        leadOsc.type="square"; leadOsc.frequency.setValueAtTime(step.lead,this.ctx.currentTime);
        leadGain.gain.setValueAtTime(0.0001,this.ctx.currentTime);
        leadGain.gain.exponentialRampToValueAtTime(0.018,this.ctx.currentTime+0.02);
        leadGain.gain.exponentialRampToValueAtTime(0.0001,this.ctx.currentTime+0.18);
        leadOsc.connect(leadGain); leadGain.connect(this.bgmGain);
        leadOsc.start(); leadOsc.stop(this.ctx.currentTime+0.2);
      }
      this.loopId = setTimeout(tick, 480);
    };
    tick();
  },
};

// ─── 计时器 ──────────────────────────────────────────────────────────────────
let timerRafId = null;
function getElapsedTimeMs() {
  if (!state.timer.running) return state.timer.elapsedMs;
  return Math.max(0, performance.now() - state.timer.startMs);
}
function startTimer() {
  if (state.timer.running) return;
  state.timer.running = true;
  state.timer.startMs = performance.now() - state.timer.elapsedMs;
  const tick = () => {
    state.timer.elapsedMs = getElapsedTimeMs();
    const ms = state.timer.elapsedMs;
    const s = Math.floor(ms/1000), m = Math.floor(s/60);
    const ds = Math.floor((ms%1000)/100);
    if (timeDisplayEl) {
      const bMs=getRecord()?.bestTimeMs;
      const elMs=getElapsedTimeMs();
      if (bMs&&elMs>0) timeDisplayEl.style.color=elMs<bMs?"var(--player)":elMs<bMs*1.1?"var(--goal)":"";
      else timeDisplayEl.style.color="";
      timeDisplayEl.textContent = `${m.toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}.${ds}`;
    }
    if (state.timer.running) timerRafId = requestAnimationFrame(tick);
  };
  timerRafId = requestAnimationFrame(tick);
}
function stopTimer() {
  if (state.timer.running) {
    state.timer.elapsedMs = getElapsedTimeMs();
    state.timer.running = false;
  }
  if (timerRafId) { cancelAnimationFrame(timerRafId); timerRafId = null; }
}
function resetTimer() {
  stopTimer();
  state.timer = { running: false, startMs: 0, elapsedMs: 0 };
  if (timeDisplayEl) timeDisplayEl.textContent = "00:00.0";
}

// ─── UI 工具 ─────────────────────────────────────────────────────────────────
function setMessage(text, type="info") {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}
let autoNextTimer = null;
// ─── Confetti ─────────────────────────────────────────────────────────────────
let confettiCanvas=null, confettiRafId=null, confettiTimeoutId=null, confettiParticles=[], confettiStopAt=0;
function startConfetti(rank, challenge) {
  stopConfetti();
  const canvas = document.createElement("canvas");
  canvas.id = "confetti";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) { canvas.remove(); return; }
  confettiCanvas = canvas;
  const colors = ["#ffd166","#8be9fd","#ff79c6","#7ee081","#ffb86c","#ff6b6b","#bd93f9","#f1fa8c"];
  const particleCount = rank==="★★★" ? 180 : rank==="★★" ? 120 : 70;
  const duration = rank==="★★★" ? 4000 : challenge ? 3500 : 2600;
  const resize = () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
  resize();
  confettiParticles = Array.from({length:particleCount},()=>({
    x:Math.random()*canvas.width, y:Math.random()*canvas.height*0.4-canvas.height*0.2,
    vx:(Math.random()-0.5)*4, vy:Math.random()*3+1,
    color:colors[Math.floor(Math.random()*colors.length)],
    size:Math.random()*8+4, angle:Math.random()*360, spin:Math.random()*6-3,
  }));
  confettiStopAt = performance.now()+duration;
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9998";
  const tick = () => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    confettiParticles.forEach(p => {
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.08; p.angle+=p.spin;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle*Math.PI/180);
      ctx.fillStyle=p.color; ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size/2);
      ctx.restore();
    });
    if (performance.now()>=confettiStopAt) { stopConfetti(); return; }
    confettiRafId = requestAnimationFrame(tick);
  };
  confettiRafId = requestAnimationFrame(tick);
  confettiTimeoutId = setTimeout(stopConfetti, duration);
}
function stopConfetti() {
  if (confettiTimeoutId) { clearTimeout(confettiTimeoutId); confettiTimeoutId=null; }
  if (confettiRafId) { cancelAnimationFrame(confettiRafId); confettiRafId=null; }
  if (confettiCanvas) { confettiCanvas.remove(); confettiCanvas=null; }
  confettiParticles=[];
}

// ─── 进度渲染 ─────────────────────────────────────────────────────────────────
// ─── autoScaleBoard ──────────────────────────────────────────────────────────
function autoScaleBoard() {
  const cols = Math.max(...state.grid.map(r=>r.length));
  const rows = state.grid.length;
  const shell = document.querySelector(".game-shell");
  if (!shell) return;
  const tileSize = Math.max(24,Math.min(48,Math.floor((shell.clientWidth-48)/cols),Math.floor(window.innerHeight*0.55/rows)));
  boardEl.style.setProperty("--tile-size",tileSize+"px");
}

// ─── 关卡加载 & 渲染 ─────────────────────────────────────────────────────────
function isGoal(x,y) { return state.goals.some(g=>g.x===x&&g.y===y); }
function getCell(x,y) {
  if (y<0||y>=state.grid.length||x<0||x>=state.grid[y].length) return TILE.WALL;
  return state.grid[y][x];
}
function cloneGrid(grid) { return grid.map(row=>[...row]); }
function restoreFloorOrGoal(x,y) { state.grid[y][x] = isGoal(x,y) ? TILE.GOAL : TILE.FLOOR; }
function placeBox(x,y) { state.grid[y][x] = isGoal(x,y) ? TILE.BOX_ON_GOAL : TILE.BOX; }
function placePlayer(x,y) { state.grid[y][x] = isGoal(x,y) ? TILE.PLAYER_ON_GOAL : TILE.PLAYER; state.player={x,y}; }

function loadLevel(index) {
  const level = LEVELS[index];
  if (!level) return;
  state.levelIndex = index;
  state.grid = level.map.map(row=>[...row]);
  state.goals = [];
  state.moves = 0; state.pushes = 0;
  state.history = []; state.won = false;
  state.facing = "down"; state.stepFrame = 0;
  state.effects = { goalFlash:null, cratePulse:null, shake:false, prevPlayer:null, prevBoxes:null, deadlocks:null };
  state.playerMoved = false;
  state.combo.count = 0; state.combo.lastPushMs = 0;
  state.recording = []; undoUsed=0;
  resetHeatmap();
  resetTimer();
  for (let y=0;y<state.grid.length;y++) {
    for (let x=0;x<state.grid[y].length;x++) {
      const cell = state.grid[y][x];
      if (cell===TILE.PLAYER||cell===TILE.PLAYER_ON_GOAL) state.player={x,y};
      if (cell===TILE.GOAL||cell===TILE.BOX_ON_GOAL||cell===TILE.PLAYER_ON_GOAL) state.goals.push({x,y});
    }
  }
  boardEl.classList.remove("is-won");
  hideModal();
  // Board reveal animation
  boardEl.classList.add("board-reveal");
  setTimeout(()=>boardEl.classList.remove("board-reveal"),500);
  setMessage(`第 ${index+1} 关：${level.name}`, "info");
  setTimeout(()=>showTutorialHint("start"),800);
  // Show level name toast
  notify(`L${index+1} ${level.name}`,'🎮');
  if (index > state.stats.maxLevel) state.stats.maxLevel = index;
  render();
}

function render() {
  const rows=state.grid.length;
  const cols=Math.max(...state.grid.map(row=>row.length));
  const goalFlash=state.effects.goalFlash;
  const cratePulse=state.effects.cratePulse;
  boardEl.style.gridTemplateColumns=`repeat(${cols},1fr)`;
  boardEl.innerHTML="";
  boardEl.dataset.facing=state.facing;
  boardEl.dataset.step=String(state.stepFrame);
  if (state.effects.shake) { boardEl.classList.add("shake"); setTimeout(()=>boardEl.classList.remove("shake"),300); state.effects.shake=false; }

  for (let y=0;y<rows;y++) {
    for (let x=0;x<cols;x++) {
      const cell=getCell(x,y);
      const tile=document.createElement("div");
      tile.className="tile";
      if (cell===TILE.WALL) tile.classList.add("wall");
      if (isGoal(x,y)) tile.classList.add("goal");
      if (cell===TILE.BOX||cell===TILE.BOX_ON_GOAL) {
        tile.classList.add("crate");
        if (cell===TILE.BOX&&state.effects.deadlocks&&state.effects.deadlocks.some(d=>d.x===x&&d.y===y)) tile.classList.add("deadlock");
      }
      if (cell===TILE.PLAYER||cell===TILE.PLAYER_ON_GOAL) {
        tile.classList.add("player");
        tile.dataset.facing=state.facing; tile.dataset.step=String(state.stepFrame);
        if (state.playerMoved) tile.classList.add("moving");
        if(state.ai.hintBox&&x===state.ai.hintBox.x&&y===state.ai.hintBox.y)tile.classList.add('hint-box');
        if (state.ai.hintArrow&&x===state.player.x&&y===state.player.y) {
          const arrowMap={up:"⬆",down:"⬇",left:"⬅",right:"➡"};
          const arrow=document.createElement("div");
          arrow.className="hint-arrow"; arrow.textContent=arrowMap[state.ai.hintArrow]||"?";
          tile.style.position="relative"; tile.appendChild(arrow);
        }
      }
      if (goalFlash&&goalFlash.x===x&&goalFlash.y===y&&isGoal(x,y)) tile.classList.add("flash");
      if (cratePulse&&cratePulse.x===x&&cratePulse.y===y&&(cell===TILE.BOX||cell===TILE.BOX_ON_GOAL)) tile.classList.add("pulse");
      boardEl.appendChild(tile);
    }
  }
  state.effects.goalFlash=null; state.effects.cratePulse=null; state.playerMoved=false;
  renderProgress();
  const record=getRecord();
  const level=getLevelConfig();
  if (levelLabelEl) levelLabelEl.textContent=`${state.levelIndex+1} / ${LEVELS.length}`;
  if (moveCountEl) {
    moveCountEl.textContent=String(state.moves);
    const rec=getRecord();
    const level=getLevelConfig();
    if (rec&&state.moves>0) {
      if (state.moves<=rec.bestMoves) moveCountEl.style.color="var(--player)";
      else if (state.moves<=level.parMoves) moveCountEl.style.color="var(--goal)";
      else moveCountEl.style.color="";
    } else moveCountEl.style.color="";
  }
  if (pushCountEl) pushCountEl.textContent=String(state.pushes);
  if (parMovesEl) parMovesEl.textContent=level?.parMoves||"--";
  if (bestMovesEl) bestMovesEl.textContent=formatBest(record);
  if (bestRankEl) bestRankEl.textContent=record?.bestRank||"--";
  if (state.ai.demo) boardEl.classList.add("ai-demo"); else boardEl.classList.remove("ai-demo");
  const aiBtn=document.getElementById("aiDemoBtn");
  const hintBtn=document.getElementById("hintBtn");
  if (aiBtn) aiBtn.classList.toggle("active",state.ai.demo);
  if (hintBtn) hintBtn.classList.toggle("active",!!state.ai.hintArrow);
  autoScaleBoard();
  applyFlipAnimation();
}

// ─── 移动逻辑 ─────────────────────────────────────────────────────────────────
function isSimpleDeadlock(grid,bx,by) {
  if (isGoal(bx,by)) return false;
  const isWallOrBox=(x,y)=>{
    if(x<0||y<0||y>=grid.length||x>=(grid[y]?.length||0))return true;
    const c=grid[y][x]; return c==="#";
  };
  // Corner deadlock: blocked in both H and V axis
  const hBlock=isWallOrBox(bx-1,by)||isWallOrBox(bx+1,by);
  const vBlock=isWallOrBox(bx,by-1)||isWallOrBox(bx,by+1);
  if(hBlock&&vBlock)return true;
  // Edge deadlock: along a wall row/col with no accessible goals
  // Left/right wall + no goal in same row reachable
  if(isWallOrBox(bx-1,by)||isWallOrBox(bx+1,by)){
    // Check if any goal exists in same row between walls
    const wallL=grid[by].lastIndexOf("#",bx-1);
    const wallR=grid[by].indexOf("#",bx+1);
    const rowGoals=state.goals.filter(g=>g.y===by&&(wallL<0||g.x>wallL)&&(wallR<0||g.x<wallR));
    if(rowGoals.length===0)return true;
  }
  // Top/bottom wall + no goal in same col reachable
  if(isWallOrBox(bx,by-1)||isWallOrBox(bx,by+1)){
    const colGoals=state.goals.filter(g=>g.x===bx);
    if(colGoals.length===0)return true;
  }
  return false;
}
function getDeadlockedBoxes() {
  const dead=[];
  for (let y=0;y<state.grid.length;y++)
    for (let x=0;x<(state.grid[y]?.length||0);x++)
      if (state.grid[y][x]===TILE.BOX&&isSimpleDeadlock(state.grid,x,y)) dead.push({x,y});
  return dead;
}

function updateCombo(isPush) {
  const now=Date.now(), WINDOW=2000;
  if (!isPush) { if (state.combo.count>0&&now-state.combo.lastPushMs>WINDOW) if(state.combo.count>=2)audio.playSfx('comboEnd'); state.combo.count=0; return; }
  state.combo.count = (now-state.combo.lastPushMs<=WINDOW) ? state.combo.count+1 : 1;
  state.combo.lastPushMs=now;
  if (state.combo.count>state.stats.maxCombo) state.stats.maxCombo=state.combo.count;
  if (state.combo.count>=2) {
    const labels=["","","COMBO!","NICE!","GREAT!","AWESOME!","PERFECT!"];
    showComboFx(labels[Math.min(state.combo.count,labels.length-1)]||`${state.combo.count}x COMBO!`,state.combo.count);
  }
}
function showComboFx(label,count) {
  let el=document.getElementById("comboFx");
  if (!el) { el=document.createElement("div"); el.id="comboFx"; document.querySelector(".game-shell")?.appendChild(el); }
  el.textContent=label;
  el.className="combo-fx combo-"+Math.min(count,5);
  el.style.animation="none"; void el.offsetWidth; el.style.animation="";
  audio.playSfx("combo",count);
}

function tryMove(dx,dy,facing) {
  if(gamePaused)return;
  if (!state.ai.demo) state.recording.push({dx,dy,facing});
  if (state.won||state.uiScreen!=="game") return;
  state.facing=facing;
  const nextX=state.player.x+dx, nextY=state.player.y+dy;
  const nextCell=getCell(nextX,nextY);
  // Push-only mode
  if(pushOnlyMode&&nextCell!==TILE.BOX&&nextCell!==TILE.BOX_ON_GOAL&&nextCell!==TILE.WALL){haptic("fail");setMessage("纯推笱模式：必须推笱子","warn");return;}
  if (nextCell===TILE.WALL) {
    audio.playSfx("fail");haptic("fail"); setMessage("前面是墙，换个方向。","warn");
    state.effects.shake=true; render(); return;
  }
  const isBox=nextCell===TILE.BOX||nextCell===TILE.BOX_ON_GOAL;
  if (isBox) {
    const bx=nextX+dx, by=nextY+dy;
    const bCell=getCell(bx,by);
    if ([TILE.WALL,TILE.BOX,TILE.BOX_ON_GOAL].includes(bCell)) {
      audio.playSfx("fail");haptic("fail"); setMessage("箱子推不动，后面被堵住了。","warn");
      state.effects.shake=true; render(); return;
    }
    saveHistory();
    state.effects.prevPlayer={x:state.player.x,y:state.player.y};
    state.effects.prevBoxes=[{from:{x:nextX,y:nextY},to:{x:bx,y:by}}];
    restoreFloorOrGoal(state.player.x,state.player.y);
    placeBox(bx,by); placePlayer(nextX,nextY);
    state.moves+=1; state.pushes+=1;
    state.stepFrame=state.stepFrame===0?1:0;
    state.playerMoved=true;
    state.effects.cratePulse={x:bx,y:by};
    if (isGoal(bx,by)) { state.effects.goalFlash={x:bx,y:by}; audio.playSfx("boxOnGoal"); showGoalRipple(bx,by); setTimeout(()=>audio.playSfx("ripple"),150); }
    if (state.moves===1) startTimer();
    if (!isGoal(bx,by)){audio.playSfx("push");haptic("push");}
    updateCombo(true);
    afterMove(); return;
  }
  saveHistory();
  state.effects.prevPlayer={x:state.player.x,y:state.player.y};
  state.effects.prevBoxes=null;
  restoreFloorOrGoal(state.player.x,state.player.y);
  placePlayer(nextX,nextY);
  state.moves+=1;
  state.stepFrame=state.stepFrame===0?1:0;
  state.playerMoved=true;
  if(state.moves%3===0)showPlayerTrail(state.player.x,state.player.y);
  recordStep(state.player.x,state.player.y);
  if (state.moves===1) startTimer();
  const f=state.stepFrame===0?380+Math.min(state.moves,20)*4:(380+Math.min(state.moves,20)*4)*1.06;
  audio.playSfx("move");haptic("move");
  afterMove();
}

// ─── FLIP 动画 ─────────────────────────────────────────────────────────────────
function applyFlipAnimation() {
  if (state.ai.demo) { state.effects.prevPlayer=null; state.effects.prevBoxes=null; return; }
  if (!state.effects.prevPlayer&&!state.effects.prevBoxes) return;
  const TILE_SIZE = parseInt(getComputedStyle(boardEl).getPropertyValue("--tile-size")) || 48;
  const cols=Math.max(...state.grid.map(r=>r.length));
  if (state.effects.prevPlayer) {
    const prev=state.effects.prevPlayer;
    const playerTile=boardEl.querySelector(".tile.player");
    if (playerTile) {
      const dx=(prev.x-state.player.x)*TILE_SIZE, dy=(prev.y-state.player.y)*TILE_SIZE;
      playerTile.style.transition="none"; playerTile.style.transform=`translate(${dx}px,${dy}px)`;
      requestAnimationFrame(()=>{
          playerTile.style.transition="transform 0.12s cubic-bezier(0.25,0.46,0.45,0.94)";
          playerTile.style.transform="translate(0,0)";
        });
    }
  }
  if (state.effects.prevBoxes) {
    state.effects.prevBoxes.forEach(({from,to})=>{
      boardEl.querySelectorAll(".tile").forEach((tile,i)=>{
        const tx=i%cols, ty=Math.floor(i/cols);
        if (tx===to.x&&ty===to.y&&tile.classList.contains("crate")) {
          const dx=(from.x-to.x)*TILE_SIZE, dy=(from.y-to.y)*TILE_SIZE;
          tile.style.transition="none"; tile.style.transform=`translate(${dx}px,${dy}px)`;
          requestAnimationFrame(()=>{ tile.style.transition="transform 0.15s cubic-bezier(0.34,1.56,0.64,1)"; tile.style.transform="translate(0,0)"; });
        }
      });
    });
  }
  state.effects.prevPlayer=null; state.effects.prevBoxes=null;
}

// ─── 胜利 Modal ────────────────────────────────────────────────────────────────
autoNextTimer=null;

// ─── 进度条 & 关卡选择 ────────────────────────────────────────────────────────
function renderProgress() {
  const total=LEVELS.length;
  let cleared=0,challenged=0,stars=0;
  for (let i=0;i<total;i++) {
    const r=state.records[i];
    if (r&&r.bestMoves>0) cleared++;
    if (r&&r.challengeCleared) challenged++;
    if (r&&r.bestRank) stars+=({"★★★":3,"★★":2,"★":1}[r.bestRank]||0);
  }
  if (progressTextEl) progressTextEl.textContent=`已通关 ${cleared}/${total} · 挑战 ${challenged}/${total} · ★ ${stars}`;
  if (progressFillEl) progressFillEl.style.width=`${Math.round(cleared/total*100)}%`;
}

function renderLevelPreview(canvas,map) {
  const ctx=canvas.getContext('2d');
  const rows=map.length, cols=Math.max(...map.map(r=>r.length));
  const tw=canvas.width/cols, th=canvas.height/rows;
  const colors={'#':'#5c4b73',' ':'#3c3150','.':'#ffd166','$':'#c98f52','@':'#7ee081','*':'#efbb77','+':'#7ee081'};
  ctx.fillStyle='#17121f'; ctx.fillRect(0,0,canvas.width,canvas.height);
  for (let y=0;y<rows;y++)
    for (let x=0;x<cols;x++) {
      const cell=(map[y]||'  ')[x]||' ';
      ctx.fillStyle=colors[cell]||'#3c3150';
      ctx.fillRect(x*tw+0.5,y*th+0.5,tw-1,th-1);
    }
}

function getLevelDifficulty(level) {
  const score=level.parMoves+level.map.reduce((n,r)=>n+[...r].filter(c=>c==='$'||c==='*').length,0)*8;
  if (score<=15) return {label:'入门',color:'#88ff88'};
  if (score<=35) return {label:'简单',color:'#8be9fd'};
  if (score<=65) return {label:'中等',color:'#ffd166'};
  if (score<=100) return {label:'困难',color:'#ff79c6'};
  return {label:'极难',color:'#ff6b6b'};
}

let levelLockMode=localStorage.getItem('pixelSokobanLockMode')==='1';
function isLevelUnlocked(idx) { return !levelLockMode||idx===0||!!(state.records[idx-1]?.bestMoves>0); }
function toggleLockMode() {
  levelLockMode=!levelLockMode;
  localStorage.setItem('pixelSokobanLockMode',levelLockMode?'1':'0');
  setMessage(levelLockMode?'解锁模式':'自由模式开启','info');
  renderLevelSelect();
}
function updateLockBtn() {
  const btn=document.getElementById('lockModeBtn');
  if (btn) btn.textContent=levelLockMode?'[L] 解锁模式':'[F] 自由模式';
}

function renderLevelSelect() {
  if (!levelSelectGridEl) return;
  levelSelectGridEl.innerHTML='';
  renderLevelSelectPage();
  // Render group headers after cards are built
  requestAnimationFrame(renderGroupHeaders);
  const pageStart=levelSelectPage*LEVELS_PER_PAGE;
  const pageEnd=Math.min(pageStart+LEVELS_PER_PAGE,LEVELS.length);
  const origLen=LEVELS.length;
  for (let i=pageStart;i<pageEnd;i++) {
    const level=LEVELS[i], record=getRecord(i);
    const card=document.createElement('button');
    card.type='button'; card.className='level-card'; card.dataset.level=String(i);
    const tipLines=[`L${i+1} ${level.name}`];if(record?.bestMoves)tipLines.push(`最佳: ${record.bestMoves}步 ${record.bestRank||''}`);if(record?.bestTimeMs)tipLines.push(`时间: ${formatMs(record.bestTimeMs)}`);card.title=tipLines.join('\n');
    if (record?.cleared) card.classList.add('is-cleared');
    if(record?.bestRank==='★★★')card.dataset.rank3=1;
    else if(record?.bestRank==='★★')card.dataset.rank2=1;
    if(record?.challengeCleared)card.classList.add('is-challenged');
    const locked=!isLevelUnlocked(i);
    if (locked) { card.classList.add('is-locked'); }
    const preview=document.createElement('canvas');
    preview.width=64; preview.height=48; preview.className='level-preview';
    renderLevelPreview(preview,level.map);
    const head=document.createElement('div'); head.className='level-card-head';
    const titleDiv=document.createElement('div'); titleDiv.className='level-card-title';
    const indexEl=document.createElement('span'); indexEl.className='level-index';
    indexEl.textContent=`第 ${i+1} 关`;
    const nameEl=document.createElement('strong'); nameEl.textContent=level.name;
    titleDiv.append(indexEl,nameEl);
    const starsEl=document.createElement('div'); starsEl.className='level-stars';
    starsEl.textContent=record?.bestRank||'未通关';
    head.append(titleDiv,starsEl);
    const meta=document.createElement('div'); meta.className='level-meta';
    const bestEl=document.createElement('span');
    bestEl.textContent=record?`最佳：${record.bestMoves} 步`:'最佳：--';
    meta.appendChild(bestEl);
    if (record?.challengeCleared) {
      const badge=document.createElement('span'); badge.className='badge';
      badge.textContent='挑战达成'; meta.appendChild(badge);
    }
    const diff=getLevelDifficulty(level);
    const db=document.createElement('span'); db.className='difficulty-badge';
    db.textContent=diff.label; db.style.background=diff.color+'33'; db.style.color=diff.color;
    meta.appendChild(db);
    const lbBtn=document.createElement('button'); lbBtn.type='button'; lbBtn.className='level-lb-btn';
    lbBtn.textContent='[排行]'; lbBtn.title='查看排行榜';
    lbBtn.addEventListener('click',(ev)=>{ ev.stopPropagation(); audio.unlock(); showLeaderboard(i); });
    const note=getNote(i);
    if(note){const ni=document.createElement('span');ni.className='card-note-icon';ni.title=note.text;ni.textContent="📝";card.appendChild(ni);}
    const rObj=getRating(i);
    if(rObj){const re=document.createElement('span');re.className='card-rating';re.textContent="★".repeat(rObj.stars)+"☆".repeat(5-rObj.stars);card.appendChild(re);}
    const favBtn=document.createElement('button');favBtn.type='button';favBtn.className='level-fav-btn';
    favBtn.textContent=isFav(i)?"♥":"♡";favBtn.title='收藏';
    favBtn.addEventListener('click',(ev)=>{ev.stopPropagation();const on=toggleFav(i);favBtn.textContent=on?"♥":"♡";notify(on?"已收藏":"取消收藏",on?"♥":"♡");});
    card.append(preview,head,meta,lbBtn,favBtn);
    levelSelectGridEl.appendChild(card);
  }
}

function focusLevelCard(i) {
  const cards=levelSelectGridEl?.querySelectorAll('.level-card');
  if (!cards) return;
  cards.forEach(c=>c.classList.remove('focused'));
  const card=cards[i];
  if (card) { card.classList.add('focused'); card.scrollIntoView({block:'nearest'}); }
}

function showLevelSelect(playSound=false) {
  if (playSound) { audio.unlock(); audio.playSfx('ui'); }
  state.uiScreen='levelSelect';
  renderLevelSelect();
  levelSelectEl.classList.remove('hidden');
  state.levelSelectFocus=state.levelIndex;
  focusLevelCard(state.levelSelectFocus);
  // Restore scroll position
  const savedScroll=sessionStorage.getItem('lsScroll');
  if(savedScroll&&levelSelectGridEl)setTimeout(()=>{levelSelectGridEl.parentElement.scrollTop=+savedScroll;},50);
}
function hideLevelSelect(playSound=false) {
  if (playSound) { audio.unlock(); audio.playSfx('ui'); }
  // Save scroll
  const lsc=levelSelectEl?.querySelector('.level-select-card');
  if(lsc)sessionStorage.setItem('lsScroll',lsc.scrollTop);
  state.uiScreen='game';
  levelSelectEl.classList.add('hidden');
}

// ─── 胜利 / 撤销 / 下一关 ─────────────────────────────────────────────────────
autoNextTimer = null;
function clearAutoNext() {
  if (autoNextTimer) { clearInterval(autoNextTimer); autoNextTimer=null; }
  const btn=document.getElementById('modalNextBtn');
  if (btn) btn.textContent='继续下一关';
}
function startAutoNext(delayMs) {
  clearAutoNext();
  if (state.levelIndex>=LEVELS.length-1) return;
  let remaining=Math.ceil(delayMs/1000);
  const btn=document.getElementById('modalNextBtn');
  autoNextTimer=setInterval(()=>{
    remaining--;
    if (btn) btn.textContent=`自动进入下一关 (${remaining})`;
    if (remaining<=0) { clearAutoNext(); nextLevel(true); }
  },1000);
}

function checkWin() { return state.goals.every(({x,y})=>{ const c=getCell(x,y); return c===TILE.BOX_ON_GOAL||c===TILE.PLAYER_ON_GOAL; }); }

const WIN_MESSAGES=['太厉了！推笱子达人！','完美！仓库整理完毕！','绝了，你就是仓管之神！','干净利落，全场最佳！','算法优美！','笱子们都乖乖就位了！'];
const CHALLENGE_MESSAGES=['步数完美！挑战大师！','标准步数内完成，高手！','效率之王！'];
function showScoreFloat(rank,challenge) {
  const shell=document.querySelector('.game-shell');
  if (!shell) return;
  const el=document.createElement('div'); el.className='score-float';
  const c={'★★★':'#ffd166','★★':'#8be9fd','★':'#7ee081'}[rank]||'var(--text)';
  el.style.color=c;
  el.textContent=rank+(challenge?' 挑战达成!':'');
  el.style.animation='none'; shell.appendChild(el);
  el.style.animation='scoreFlyIn 1.6s ease-out forwards';
  setTimeout(()=>el.remove(),1700);
}

function afterMove() {
  render();
  if (checkWin()) {
    stopTimer();
    state.won=true;
    boardEl.classList.add('is-won');
    const level=getLevelConfig();
    const rank=getRank(state.moves,level.starMoves);
    const challengeCleared=state.moves<=level.parMoves;
    const result={moves:state.moves,pushes:state.pushes,rank,challengeCleared,timeMs:state.timer.elapsedMs};
    const {record,isNewBest}=updateRecord(result);
    audio.playSfx('clear');haptic("win");
    setTimeout(playCelebrationSequence,200); setTimeout(playPixelBurstAll,400);
    if (taOnLevelClear&&taOnLevelClear(state.moves,state.timer.elapsedMs)) return;
    const isLast=state.levelIndex===LEVELS.length-1;
    setMessage(isLast?'全部通关！':getWinMessage(rank,challengeCleared),'win');
    winTextEl.textContent=`你用了 ${state.moves} 步，推进 ${state.pushes} 次，完成"${level.name}"${isNewBest?'，并刷新了纪录！':'。'}`;
    winRankEl.textContent=rank;
    winChallengeEl.textContent=challengeCleared?`达成 ${level.parMoves} 步挑战`:`未达成 ${level.parMoves} 步挑战`;
    winBestEl.textContent=`${record.bestMoves} 步 / ${record.bestRank}`;
    saveReplay(state.levelIndex,[...state.recording]);
    saveToLeaderboard(state.levelIndex,state.moves,state.pushes,state.timer.elapsedMs,rank);
    checkPerfectStreak(rank); showModal(rank,challengeCleared);
    checkAchievements();
    render();
    return;
  }
  const dead=getDeadlockedBoxes();
  state.effects.deadlocks=dead.length>0?dead:null;
  if (dead.length>0) { audio.playSfx('deadlock'); setMessage(`⚠️ ${dead.length} 个笱子进入死角！按 Z 撤销。`,'warn'); }
  else setMessage(`已移动 ${state.moves} 步，继续努力。`,'info');
  checkStuck();
  checkExtraHint();
  if(state.moves%5===0)autosave();
}

function saveHistory() { state.history.push({grid:cloneGrid(state.grid),player:{...state.player},moves:state.moves,pushes:state.pushes,won:state.won,facing:state.facing,stepFrame:state.stepFrame}); }

function undo(playSound=false) {
  if(undoLimit>=0&&undoUsed>=undoLimit){
    audio.playSfx('fail');
    haptic('fail');
    setMessage(`撤销次数已达上限！(${undoUsed}/${undoLimit})`,'warn');
    return;
  }
  if(undoLimit>=0)undoUsed++;
  if (playSound) { audio.unlock(); audio.playSfx('undo'); }
  const snap=state.history.pop();
  if (!snap) { setMessage('没有可撤销的步骤。','warn'); return; }
  state.grid=cloneGrid(snap.grid); state.player=snap.player;
  state.moves=snap.moves; state.pushes=snap.pushes;
  state.won=snap.won; state.facing=snap.facing; state.stepFrame=snap.stepFrame;
  boardEl.classList.remove('is-won');
  hideModal();
  if (state.moves>0&&!state.timer.running) startTimer();
  setMessage('已撤销上一步。','info');
  render();
}

function nextLevel(playSound=false) {
  if (playSound) { audio.unlock(); audio.playSfx('ui'); }
  loadLevel((state.levelIndex+1)%LEVELS.length);
}
function restartLevel(playSound=false) {
  if (playSound) { audio.unlock(); audio.playSfx('ui'); }
  loadLevel(state.levelIndex);
}

function showModal(rank,challenge) {
  setTimeout(()=>{
    const mc=document.getElementById('moveCount');
    const pc=document.getElementById('pushCount');
    if(mc)animateCounter(mc,0,state.moves,600);
    if(pc)animateCounter(pc,0,state.pushes,600);
  },300);
  winModalEl.classList.remove('hidden');
  const noteEl=document.getElementById('winNoteInput');
  if (noteEl) { const n=getNote(state.levelIndex); noteEl.value=n?n.text:''; }
  startConfetti(rank,challenge);
  if (rank==='★★★') {
    const card=winModalEl.querySelector('.modal-card');
    if (card) { card.classList.add('rank-triple'); setTimeout(()=>card.classList.remove('rank-triple'),800); }
  }
  if (challenge) {
    const card=winModalEl.querySelector('.modal-card');
    if (card) { card.classList.add('challenge-flash'); setTimeout(()=>card.classList.remove('challenge-flash'),700); }
  }
  showScoreFloat(rank,challenge);
  startAutoNext(5000);
}
function hideModal() { winModalEl.classList.add('hidden'); stopConfetti(); clearAutoNext(); }

// ─── AI 求解器 & 演示 ─────────────────────────────────────────────────────────
function aiBfsSolve(grid, playerPos, goals) {
  const DIRS=[{dx:0,dy:-1,facing:'up'},{dx:0,dy:1,facing:'down'},{dx:-1,dy:0,facing:'left'},{dx:1,dy:0,facing:'right'}];
  const MAX=800000;
  const initBoxes=[];
  for (let y=0;y<grid.length;y++) for (let x=0;x<(grid[y]||[]).length;x++) { const c=grid[y][x]; if (c===TILE.BOX||c===TILE.BOX_ON_GOAL) initBoxes.push([x,y]); }
  const goalSet=goals.map(g=>`${g.x},${g.y}`).sort();
  const encode=(px,py,boxes)=>`${px},${py}|${boxes.map(b=>`${b[0]},${b[1]}`).sort().join(';')}`;
  const start={px:playerPos.x,py:playerPos.y,boxes:initBoxes,path:[]};
  const visited=new Set([encode(start.px,start.py,start.boxes)]);
  const queue=[start];
  while (queue.length>0) {
    if (visited.size>MAX) return null;
    const cur=queue.shift();
    const {px,py,boxes,path}=cur;
    const bk=boxes.map(b=>`${b[0]},${b[1]}`).sort();
    if (JSON.stringify(bk)===JSON.stringify(goalSet)) return {steps:path};
    const bs=new Set(boxes.map(b=>`${b[0]},${b[1]}`));
    for (const {dx,dy,facing} of DIRS) {
      const nx=px+dx,ny=py+dy;
      if (ny<0||ny>=grid.length||nx<0||nx>=(grid[ny]?.length||0)||grid[ny][nx]==="#") continue;
      const bKey=`${nx},${ny}`;
      const nb=boxes.map(b=>[...b]);
      if (bs.has(bKey)) {
        const bnx=nx+dx,bny=ny+dy;
        if (bny<0||bny>=grid.length||bnx<0||bnx>=(grid[bny]?.length||0)||grid[bny][bnx]==="#"||bs.has(`${bnx},${bny}`)) continue;
        const bi=nb.findIndex(b=>b[0]===nx&&b[1]===ny);
        if (bi>=0) nb[bi]=[bnx,bny];
      }
      const ns=encode(nx,ny,nb);
      if (!visited.has(ns)) { visited.add(ns); queue.push({px:nx,py:ny,boxes:nb,path:[...path,{dx,dy,facing}]}); }
    }
  }
  return null;
}

function aiStopDemo() {
  if (state.ai.demoIntervalId) { clearInterval(state.ai.demoIntervalId); state.ai.demoIntervalId=null; }
  state.ai.demo=false; state.ai.solving=false; state.ai.hintArrow=null; state.ai.hintBox=null;
  boardEl.classList.remove('ai-demo');
  const btn=document.getElementById('aiDemoBtn');
  if (btn) btn.textContent='AI演示';
  setMessage('演示已停止。','info');
  render();
}

function showHint() {
  if (state.won||state.ai.demo) return;
  state.stats.hintCount++;
  state.ai.solving=true; render();
  setMessage('求解中…','info');
  setTimeout(()=>{
    const result=aiBfsSolve(state.grid,state.player,state.goals);
    state.ai.solving=false;
    if (!result||result.steps.length===0) { setMessage('该局面无法求解或已完成。','warn'); render(); return; }
    const step=result.steps[0];
    state.ai.hintArrow=step.facing;
    // Highlight the box to push if this is a push move
    const nx2=state.player.x+[0,0,-1,1][['up','down','left','right'].indexOf(step.facing)];
    const ny2=state.player.y+[-1,1,0,0][['up','down','left','right'].indexOf(step.facing)];
    const nc2=getCell(nx2,ny2);
    if(nc2===TILE.BOX||nc2===TILE.BOX_ON_GOAL)state.ai.hintBox={x:nx2,y:ny2};
    else state.ai.hintBox=null;
    setMessage(`提示：向${{'up':'上','down':'下','left':'左','right':'右'}[step.facing]}移动`,'info');
    render();
    setTimeout(()=>{ state.ai.hintArrow=null; state.ai.hintBox=null; render(); },2500);
  },30);
}

function startAiDemo() {
  if (state.ai.demo) { aiStopDemo(); return; }
  state.ai.solving=true; render();
  setMessage('求解中…','info');
  setTimeout(()=>{
    const result=aiBfsSolve(state.grid,state.player,state.goals);
    state.ai.solving=false;
    if (!result) { setMessage('该局面超出搜索范围，无法演示。','warn'); render(); return; }
    state.ai.demo=true; state.ai.demoSteps=result.steps; state.ai.demoIndex=0;
    restartLevel();
    const btn=document.getElementById('aiDemoBtn');
    if (btn) btn.textContent='停止演示';
    setMessage(`AI演示开始，共 ${result.steps.length} 步`,'info');
    state.ai.demoIntervalId=setInterval(()=>{
      if (!state.ai.demo) { clearInterval(state.ai.demoIntervalId); return; }
      if (state.ai.demoIndex>=state.ai.demoSteps.length) { aiStopDemo(); return; }
      const step=state.ai.demoSteps[state.ai.demoIndex];
      tryMove(step.dx,step.dy,step.facing);
      state.ai.demoIndex++;
      if (state.won) setTimeout(aiStopDemo,800);
    },state.ai.speed||350);
  },30);
}


let lowFxMode=localStorage.getItem('pixelSokobanLowFx')==="1";
function toggleLowFx(){
  lowFxMode=!lowFxMode;
  localStorage.setItem('pixelSokobanLowFx',lowFxMode?"1":"0");
  document.body.classList.toggle('low-fx',lowFxMode);
  notify(lowFxMode?"轻量模式开启（特效减少）":"全特效模式开启",lowFxMode?"🔎":"🖨");
}
// Apply on load
if(lowFxMode)document.body.classList.add('low-fx');

const LEVEL_GROUPS=[
  {name:"入门",range:[0,9],color:"#88ff88"},
  {name:"初级",range:[10,19],color:"#8be9fd"},
  {name:"中级",range:[20,34],color:"#ffd166"},
  {name:"高级",range:[35,49],color:"#ff79c6"},
  {name:"极难",range:[50,69],color:"#ff6b6b"},
];
function renderGroupHeaders(){
  // Remove existing headers
  levelSelectGridEl?.querySelectorAll('.level-group-header').forEach(h=>h.remove());
  const cards=[...levelSelectGridEl?.querySelectorAll('.level-card')||[]];
  LEVEL_GROUPS.forEach(g=>{
    const [s,e]=g.range;
    const inGroup=cards.filter(cd=>+cd.dataset.level>=s&&+cd.dataset.level<=e&&cd.style.display!=="none");
    if(!inGroup.length)return;
    const cleared=inGroup.filter(cd=>cd.classList.contains('is-cleared')).length;
    const header=document.createElement('div');
    header.className='level-group-header';
    header.style.cssText=`color:${g.color};grid-column:1/-1;`;
    header.textContent=`${g.name} ${cleared}/${inGroup.length}`;
    inGroup[0]?.before(header);
  });
}
// ─── 主题系统 ─────────────────────────────────────────────────────────────────
const THEMES = {
  dark: {},
  light: {'--bg':'#f0eaf8','--panel':'#e0d8f0','--panel-2':'#d0c8e8','--panel-3':'#e8e0f4','--line':'#9080b0','--text':'#1a1228','--muted':'#4a3868','--wall':'#7a6a90','--wall-deep':'#5a4a70','--floor':'#c8c0dc','--floor-deep':'#b0a8cc'},
  rainbow: {'--bg':'#0d0d1a','--panel':'#1a0d2e','--panel-2':'#2e0d4a','--panel-3':'#120d1e','--line':'#ff00ff','--accent':'#00ffff','--accent-2':'#ff00aa','--goal':'#ffff00','--player':'#00ff88','--crate':'#ff8800','--wall':'#440088','--floor':'#050510'},
  cyber: {'--bg':'#0a0a14','--panel':'#0f0f23','--panel-2':'#141430','--panel-3':'#0a0a1e','--line':'#00ff88','--text':'#00ff88','--muted':'#00aa55','--accent':'#ff00ff','--goal':'#ff00ff','--player':'#00ffff','--crate':'#ff6600','--wall':'#001133','--floor':'#050510'},
  forest: {'--bg':'#0d1a0d','--panel':'#1a2e1a','--panel-2':'#243524','--line':'#4a8a4a','--text':'#c8f0c8','--muted':'#88b888','--accent':'#88ff88','--goal':'#ffcc00','--player':'#88ff44','--crate':'#8B4513','--wall':'#2d4a1e','--floor':'#1a2e14'},
  ocean: {'--bg':'#020d1a','--panel':'#051a2e','--panel-2':'#082440','--line':'#1a6688','--text':'#c0e8ff','--muted':'#7ab8d8','--accent':'#00aaff','--goal':'#ffd700','--player':'#00ffcc','--crate':'#c87820','--wall':'#0a2a40','--floor':'#040e1a'},
  arctic: {'--bg':'#e8f4f8','--panel':'#d0e8f0','--panel-2':'#b8dce8','--panel-3':'#c8e4ef','--line':'#6aabcd','--text':'#0a1a2a','--muted':'#2a5a7a','--accent':'#0077aa','--accent-2':'#00bbff','--goal':'#ff8800','--player':'#0055aa','--crate':'#cc6600','--wall':'#224466','--floor':'#d8edf4'},
  desert: {'--bg':'#1a1205','--panel':'#2e2210','--panel-2':'#3d2e18','--line':'#8a6a30','--text':'#f5e0b0','--muted':'#c8a870','--accent':'#ffcc44','--goal':'#ff8800','--player':'#88ee44','--crate':'#cc7722','--wall':'#4a3010','--floor':'#201808'},
};
function applyTheme(name) {
  const theme=THEMES[name]||THEMES.dark;
  const root=document.documentElement;
  const allKeys=new Set([...Object.values(THEMES).flatMap(t=>Object.keys(t))]);
  allKeys.forEach(k=>root.style.removeProperty(k));
  Object.entries(theme).forEach(([k,v])=>root.style.setProperty(k,v));
  localStorage.setItem('pixelSokobanTheme',name);
  state.stats.themesUsed.add(name);
  document.querySelectorAll('.theme-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.theme===name));
}
document.querySelectorAll('.theme-btn').forEach(btn=>btn.addEventListener('click',()=>{ audio.unlock(); applyTheme(btn.dataset.theme); }));

// ─── URL 分享 ─────────────────────────────────────────────────────────────────
function levelToHash(map) {
  try { return btoa(encodeURIComponent(map.join('\n'))).replace(/\+/g,'_').replace(/\//g,'-').replace(/=/g,''); } catch { return null; }
}
function hashToLevel(hash) {
  try { const b64=hash.replace(/_/g,'+').replace(/-/g,'/'); return decodeURIComponent(atob(b64+"===".slice(0,(4-b64.length%4)%4))).split('\n'); } catch { return null; }
}
function shareLevelUrl() {
  const hash=levelToHash(LEVELS[state.levelIndex].map);
  if (!hash) return;
  const url=`${location.href.split('#')[0]}#level=${hash}`;
  if (navigator.clipboard) navigator.clipboard.writeText(url).then(()=>setMessage('关卡链接已复制！','win')).catch(()=>prompt('复制此链接:',url));
  else prompt('复制此链接:',url);
}
function checkUrlLevel() {
  const hash=location.hash;
  if (!hash.startsWith('#level=')) return;
  const map=hashToLevel(hash.slice(7));
  if (!map||map.length<3) return;
  LEVELS.unshift({name:'分享关卡',parMoves:999,starMoves:{three:999,two:9999,one:99999},map});
  state.levelIndex=0;
  location.hash='';
}

// ─── 排行榜 & 玩家名 ─────────────────────────────────────────────────────────
const LB_KEY='pixelSokobanLeaderboard', PLAYER_KEY='pixelSokobanPlayer';
function getPlayerName() { return localStorage.getItem(PLAYER_KEY)||'玩家1'; }
function setPlayerName(name) { const s=(name||'玩家').slice(0,12).trim()||'玩家'; localStorage.setItem(PLAYER_KEY,s); return s; }
function loadLeaderboard() { try { return JSON.parse(localStorage.getItem(LB_KEY)||'{}'); } catch { return {}; } }
function saveToLeaderboard(levelIndex,moves,pushes,timeMs,rank) {
  const lb=loadLeaderboard(), player=getPlayerName(), key=String(levelIndex);
  if (!lb[key]) lb[key]=[];
  const ex=lb[key].findIndex(e=>e.player===player);
  const entry={player,moves,pushes,timeMs,rank,date:new Date().toLocaleDateString()};
  if (ex>=0) { if (moves<lb[key][ex].moves) lb[key][ex]=entry; }
  else lb[key].push(entry);
  lb[key].sort((a,b)=>a.moves-b.moves); lb[key]=lb[key].slice(0,10);
  localStorage.setItem(LB_KEY,JSON.stringify(lb));
}
function showLeaderboard(levelIndex) {
  const lb=loadLeaderboard(), entries=lb[String(levelIndex)]||[];
  const lvl=LEVELS[levelIndex];
  let html=`<div class="lb-overlay-card"><h2>${lvl?.name||''}排行榜</h2>`;
  if (!entries.length) html+='<p style="color:var(--muted)">还没有记录</p>';
  else {
    html+='<table class="lb-table"><thead><tr><th>#</th><th>玩家</th><th>步数</th><th>时间</th><th>评级</th></tr></thead><tbody>';
    const player=getPlayerName();
    entries.forEach((e,i)=>{ const mine=e.player===player; html+=`<tr class="${mine?'lb-mine':''}"><td>${i+1}</td><td>${e.player}</td><td>${e.moves}</td><td>${e.timeMs?formatMs(e.timeMs):'--'}</td><td>${e.rank||'-'}</td></tr>`; });
    html+='</tbody></table>';
  }
  html+='<div class="controls center" style="margin-top:14px"><button id="lbCloseBtn">关闭</button></div></div>';
  const overlay=document.createElement('div');
  overlay.className='modal'; overlay.style.zIndex='9999'; overlay.innerHTML=html;
  overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  overlay.querySelector('#lbCloseBtn')?.addEventListener('click',()=>overlay.remove());
}

// ─── 笔记系统 ─────────────────────────────────────────────────────────────────
const NOTES_KEY='pixelSokobanNotes';
function loadNotes() { try { return JSON.parse(localStorage.getItem(NOTES_KEY)||'{}')||{}; } catch { return {}; } }
function saveNote(levelIndex,text) {
  const notes=loadNotes();
  if (text.trim()) notes[String(levelIndex)]={text:text.trim().slice(0,200),date:new Date().toLocaleDateString()};
  else delete notes[String(levelIndex)];
  localStorage.setItem(NOTES_KEY,JSON.stringify(notes));
}
function getNote(levelIndex) { return loadNotes()[String(levelIndex)]||null; }

// ─── 成就系统 ─────────────────────────────────────
const ACHIEVEMENTS = [
  {id:"first",name:"初出茅庐",desc:"通关第1关",check:s=>s.cleared>=1},
  {id:"half",name:"半程英雄",desc:"通关15关",check:s=>s.cleared>=15},
  {id:"all",name:"仓库之神",desc:"通关全部30关",check:s=>s.cleared>=30},
  {id:"challenge5",name:"挑战者",desc:"挑战达成5关",check:s=>s.challenged>=5},
  {id:"challenge_all",name:"完美主义",desc:"全部挑战达成",check:s=>s.challenged>=30},
  {id:"stars30",name:"三星收集者",desc:"获得30颗星",check:s=>s.totalStars>=30},
  {id:"stars_max",name:"满星达人",desc:"全部三星通关",check:s=>s.totalStars>=90},
  {id:"undo0",name:"一气呵成",desc:"无撤销通关任意一关",check:s=>s.noUndoCleared>=1},
  {id:"editor",name:"关卡设计师",desc:"试玩自制关卡",check:s=>s.editorPlayed},
  {id:"speedrun",name:"速通达人",desc:"完成速通挑战",check:s=>s.taPlayed},
  {id:"combo3",name:"连击王",desc:"达成3连击",check:s=>s.maxCombo>=3},
  {id:"random_play",name:"探险家",desc:"试玩随机生成关卡",check:s=>s.randomPlayed},
];
const ACHIEV_KEY="pixelSokobanAchievements";
function loadAchievements(){try{return new Set(JSON.parse(localStorage.getItem(ACHIEV_KEY)||"[]"))}catch{return new Set()}}
function saveAchievements(s){localStorage.setItem(ACHIEV_KEY,JSON.stringify([...s]))}
function checkAchievements(){
  const s2=calcStats();const unlocked=loadAchievements();const prev=new Set(unlocked);
  const ext={...s2,challenged:Object.values(state.records).filter(r=>r?.challengeCleared).length,noUndoCleared:state.history.length===0&&state.won?1:0,editorPlayed:!!localStorage.getItem("pixelSokobanEditorPlayed"),taPlayed:state.stats.taPlayed,replayPlayed:state.stats.replayPlayed,maxCombo:state.stats.maxCombo,randomPlayed:state.stats.randomPlayed};
  ACHIEVEMENTS.forEach(a=>{if(!unlocked.has(a.id)&&a.check(ext)){unlocked.add(a.id);showAchievementToast(a);}});
  if(unlocked.size!==prev.size) saveAchievements(unlocked);
}
function showAchievementToast(a){audio.playSfx('achievement');flashScreen("rgba(255,209,102,0.3)",500);notify(a.name+": "+a.desc,"🏅");} function _showAchievementToast_orig(a){
  let el=document.getElementById("achievToast");
  if(!el){el=document.createElement("div");el.id="achievToast";el.className="achiev-toast";document.body.appendChild(el);}
  el.innerHTML="<span>Medal " + a.name + "</span><small>" + a.desc + "</small>";
  el.classList.add("show");clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove("show"),3000);
}

// ─── 速通挑战 ─────────────────────────
const timeAttack={active:false,totalMs:3*60*1000,startMs:0,cleared:0,totalMoves:0,score:0,rafId:null};
function taScore(m,par,t){return 100+Math.max(0,par-m)*5+((Math.max(0,10000-t)/100)|0);}
function startTimeAttack(){
  if(timeAttack.active)return;
  Object.assign(timeAttack,{active:true,startMs:performance.now(),cleared:0,totalMoves:0,score:0});
  state.stats.taPlayed=true;
  loadLevel(0); setMessage("速通挑战开始！3分钟内通关尽量多","win");
  audio.playSfx("clear"); taTick();
}
function taTick(){if(!timeAttack.active)return;
  const r=Math.max(0,timeAttack.totalMs-(performance.now()-timeAttack.startMs));
  updateTaHud(r); if(r<=0){endTimeAttack();return;}
  timeAttack.rafId=requestAnimationFrame(taTick);}
function updateTaHud(r){
  const el=document.getElementById("taHud"); if(!el)return;
  if(!timeAttack.active){el.classList.add("hidden");return;}
  el.classList.remove("hidden");
  const ms=r!==undefined?r:Math.max(0,timeAttack.totalMs-(performance.now()-timeAttack.startMs));
  const s=Math.ceil(ms/1000),m=Math.floor(s/60),sec=s%60;
  el.innerHTML=`<span class="ta-time">${m}:${sec.toString().padStart(2,"0")}</span><span class="ta-score">得分:${timeAttack.score}</span><span class="ta-cleared">通关:${timeAttack.cleared}</span>`;
  if(ms<30000)el.classList.add("urgent"); else el.classList.remove("urgent");
}
function endTimeAttack(){
  if(timeAttack.rafId){cancelAnimationFrame(timeAttack.rafId);timeAttack.rafId=null;}
  timeAttack.active=false;
  updateTaHud(0);
  const btn=document.getElementById("timeAttackBtn");
  if(btn)btn.textContent="⏱ 速通";
  const TA_KEY="pixelSokobanTA";
  let records=[];
  try{records=JSON.parse(localStorage.getItem(TA_KEY)||"[]");}catch{}
  const myEntry={player:getPlayerName(),cleared:timeAttack.cleared,score:timeAttack.score,moves:timeAttack.totalMoves,date:new Date().toLocaleDateString()};
  records.push(myEntry); records.sort((a,b)=>b.score-a.score); records=records.slice(0,20);
  localStorage.setItem(TA_KEY,JSON.stringify(records));
  showTaResult(records,myEntry);
}
function taOnLevelClear(moves,timeMs){
  if(!timeAttack.active)return false;
  const level=getLevelConfig();
  const s=taScore(moves,level.parMoves,timeMs);
  timeAttack.cleared++; timeAttack.totalMoves+=moves; timeAttack.score+=s;
  const nextIdx=(state.levelIndex+1)%LEVELS.length;
  if(nextIdx===0||timeAttack.cleared>=LEVELS.length){endTimeAttack();return true;}
  setTimeout(()=>{if(timeAttack.active)loadLevel(nextIdx);},500);
  return true;
}
function showTaResult(records,myEntry){
  let html="<div class='lb-overlay-card'>";
  html+="<p class='eyebrow'>TIME ATTACK</p><h2>速通挑战结束！</h2>";
  html+="<div class='stats-kpi-grid'><div class='stats-kpi'><span>通关数</span><strong>"+myEntry.cleared+"</strong></div>";
  html+="<div class='stats-kpi'><span>得分</span><strong>"+myEntry.score+"</strong></div>";
  html+="<div class='stats-kpi'><span>总步数</span><strong>"+myEntry.moves+"</strong></div></div>";
  html+="<div class='controls center' style='margin-top:14px'><button id='taClose'>关闭</button><button id='taRetry'>再挑战</button></div></div>";
  const overlay=document.createElement("div");
  overlay.className="modal"; overlay.style.zIndex="9999";
  overlay.innerHTML=html;
  overlay.querySelector("#taClose")?.addEventListener("click",()=>overlay.remove());
  overlay.querySelector("#taRetry")?.addEventListener("click",()=>{overlay.remove();startTimeAttack();});
  overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// ─── 录像回放 ─────────────────────────
const replay={active:false,steps:[],index:0,levelIndex:0,intervalId:null,speed:350};
function startReplay(steps,levelIndex){
  if(replay.active)stopReplay();
  Object.assign(replay,{steps:[...steps],index:0,levelIndex,active:true});
  state.stats.replayPlayed=true;
  loadLevel(levelIndex);
  boardEl.classList.add("ai-demo");
  setMessage("回放中，共 "+steps.length+" 步","info");
  replay.intervalId=setInterval(()=>{
    if(!replay.active){clearInterval(replay.intervalId);return;}
    if(replay.index>=replay.steps.length){stopReplay();return;}
    const step=replay.steps[replay.index];
    tryMove(step.dx,step.dy,step.facing); replay.index++;
    updateReplayProgress();
    if(state.won)setTimeout(stopReplay,800);
  },replay.speed);
}
function stopReplay(){
  if(replay.intervalId)clearInterval(replay.intervalId);
  replay.active=false; replay.intervalId=null;
  boardEl.classList.remove("ai-demo");
  setMessage("回放结束","info");
  const rp=document.getElementById("replayProgress");if(rp)rp.remove();
}
const REPLAY_KEY="pixelSokobanReplays";
function loadAllReplays(){try{return JSON.parse(localStorage.getItem(REPLAY_KEY)||"{}")}catch{return {}}}
function saveReplay(levelIndex,steps){
  const r=loadAllReplays();
  r[String(levelIndex)]={levelIndex,steps:steps.slice(0,2000),date:new Date().toLocaleDateString()};
  const keys=Object.keys(r);
  if(keys.length>30){keys.sort((a,b)=>Number(a)-Number(b));delete r[keys[0]];}
  localStorage.setItem(REPLAY_KEY,JSON.stringify(r));
}
function showReplayPicker(){
  const saved=loadAllReplays(),keys=Object.keys(saved);
  if(!keys.length){setMessage("还没有保存的录像","warn");return;}
  let html="<div class='lb-overlay-card'><h2>选择录像</h2><div class='replay-list'>";
  keys.forEach(k=>{
    const r2=saved[k],lvl=LEVELS[r2.levelIndex];
    if(!lvl)return;
    html+="<div class='replay-item'>";
    html+="<span class='replay-name'>第"+(r2.levelIndex+1)+"关 "+lvl.name+"</span>";
    html+="<span class='replay-info'>"+(r2.steps?.length||0)+"步</span>";
    html+="<button class='replay-play-btn' data-idx='"+ r2.levelIndex+"' data-steps='"+ JSON.stringify(r2.steps)+"'>▶</button>";
    html+="</div>";
  });
  html+="</div><div class='controls center' style='margin-top:12px'><button id='replayPickerClose'>关闭</button></div></div>";
  const overlay=document.createElement("div");
  overlay.className="modal"; overlay.style.zIndex="9999";
  overlay.innerHTML=html;
  overlay.querySelector("#replayPickerClose")?.addEventListener("click",()=>overlay.remove());
  overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.remove();});
  overlay.querySelectorAll(".replay-play-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      overlay.remove();
      try{const steps=JSON.parse(btn.dataset.steps);startReplay(steps,Number(btn.dataset.idx));}catch{}
    });
  });
  document.body.appendChild(overlay);
}

// ─── 关卡编辑器 ─────────────────────────────────────────────────────────────
const editor={grid:[],rows:7,cols:8,activeTile:"#",painting:false};
const editorHistory={stack:[],index:-1};
function editorInitGrid(rows,cols,keepOld){
  const old=editor.grid; editor.rows=rows; editor.cols=cols; editor.grid=[];
  for(let y=0;y<rows;y++){editor.grid[y]=[];
    for(let x=0;x<cols;x++){
      if(keepOld&&old[y]&&old[y][x]!==undefined) editor.grid[y][x]=old[y][x];
      else editor.grid[y][x]=(x===0||x===cols-1||y===0||y===rows-1)?"#":" ";
  }}
}
function updateEditorUndoInfo(){
  const btn=document.getElementById('editorUndoBtn');
  if(btn)btn.title=`撤销 (${editorHistory.index}/${editorHistory.stack.length-1})`;
}
function editorSaveState(){
  const snap=JSON.stringify(editor.grid);
  editorHistory.stack=editorHistory.stack.slice(0,editorHistory.index+1);
  editorHistory.stack.push(snap);
  if(editorHistory.stack.length>50)editorHistory.stack.shift();
  editorHistory.index=editorHistory.stack.length-1;
}
function editorUndo(){if(editorHistory.index<=0)return;editorHistory.index--;editor.grid=JSON.parse(editorHistory.stack[editorHistory.index]);editorRender();}
function editorRedo(){if(editorHistory.index>=editorHistory.stack.length-1)return;editorHistory.index++;editor.grid=JSON.parse(editorHistory.stack[editorHistory.index]);editorRender();}
function editorRender(){
  updateEditorUndoInfo();
  const board=document.getElementById("editorBoard"); if(!board)return;
  // Live Canvas preview
  let pc=document.getElementById('editorLivePreview');
  if(!pc){pc=document.createElement('canvas');pc.id='editorLivePreview';pc.className='editor-live-preview';pc.width=200;pc.height=100;board.parentElement?.insertBefore(pc,board);}
  renderLevelPreview(pc,editor.grid.map(r=>r.join('')));
  board.style.gridTemplateColumns=`repeat(${editor.cols},36px)`;
  board.innerHTML="";
  for(let y=0;y<editor.rows;y++) for(let x=0;x<editor.cols;x++){
    const cell=editor.grid[y][x];
    const div=document.createElement("div");
    div.className="editor-cell"; div.dataset.x=x; div.dataset.y=y;
    const cls={"#":"ec-wall",".":"ec-goal","$":"ec-box","@":"ec-player","*":"ec-box ec-goal","+":"ec-player ec-goal"}[cell];
    if(cls)cls.split(" ").forEach(c=>div.classList.add(c));
    board.appendChild(div);
  }
  editorValidate();
}

editor.fillMode=false;
document.getElementById('editorFillBtn')?.addEventListener('click',()=>{
  editor.fillMode=!editor.fillMode;
  document.getElementById('editorFillBtn')?.classList.toggle('active',editor.fillMode);
  notify(editor.fillMode?"洪汛模式开启":"洪汛已关闭","🖌");
});
function editorPaint(x,y){
  if(editor.fillMode){editorFloodFill(x,y,editor.activeTile==="E"?" ":editor.activeTile);return;}
  if(x<0||y<0||y>=editor.rows||x>=editor.cols)return;
  const t=editor.activeTile;
  if(t==="E") editor.grid[y][x]=(x===0||x===editor.cols-1||y===0||y===editor.rows-1)?"#":" ";
  else if(t==="@"){for(let ey=0;ey<editor.rows;ey++)for(let ex=0;ex<editor.cols;ex++)if(editor.grid[ey][ex]==="@")editor.grid[ey][ex]=" ";editor.grid[y][x]="@";}
  else editor.grid[y][x]=t;
  editorSaveState(); editorRender();
}
function editorValidate(){
  const flat=editor.grid.flat();
  const boxes=flat.filter(c=>c==="$"||c==="*").length;
  const goals=flat.filter(c=>c==="."||c==="*"||c==="+").length;
  const players=flat.filter(c=>c==="@"||c==="+").length;
  const el=document.getElementById("editorStatus"); if(!el)return;
  if(!players){el.textContent="❌ 缺少玩家";el.className="editor-status err";return;}
  if(boxes===0){el.textContent="❌ 至少需要一个筱子";el.className="editor-status err";return;}
  if(boxes!==goals){el.textContent=`❌ 筱子(${boxes})≠目标(${goals})`;el.className="editor-status err";return;}
  el.textContent="✅ 关卡合法！"; el.className="editor-status ok";
}
function editorIsValid(){
  const flat=editor.grid.flat();
  return flat.filter(c=>c==="$"||c==="*").length===flat.filter(c=>c==="."||c==="*"||c==="+").length&&flat.some(c=>c==="@"||c==="+");
}
function editorGetMapRows(){
  return editor.grid.map(row=>row.join(""));
}


function calcStats(){
  const total=LEVELS.length;
  let cleared=0,challenged=0,totalStars=0,totalMoves=0,totalTime=0;
  const perLevel=[];
  for(let i=0;i<total;i++){
    const r=state.records[i],lvl=LEVELS[i];
    if(r&&r.bestMoves>0){cleared++;totalMoves+=r.bestMoves;if(r.bestTimeMs)totalTime+=r.bestTimeMs;}
    if(r&&r.challengeCleared)challenged++;
    const stars=r?({3:3,2:2,1:1}[({"★★★":3,"★★":2,"★":1})[r.bestRank]]||0):0;
    totalStars+=({"★★★":3,"★★":2,"★":1}[r?.bestRank]||0);
    perLevel.push({i,name:lvl.name,done:r&&r.bestMoves>0,r,par:lvl.parMoves});
  }
  return{total,cleared,challenged,totalStars,totalMoves,totalTime,perLevel};
}
function renderStats(){
  const s=calcStats();
  const summaryEl=document.getElementById("statsSummary");
  if(!summaryEl)return;
  const pct=Math.round(s.cleared/s.total*100);
  const lvl=getPlayerLevel();
  const lvlHtml="<div class='player-level-card'>"+lvl.icon+" "+getPlayerName()+" | "+lvl.name+" | "+lvl.score+"分</div>";
  summaryEl.innerHTML=lvlHtml+""+
    "<div class='stats-player-row'><span>玩家：</span>"+
    "<strong id='playerNameDisplay'>"+ getPlayerName()+"</strong>"+
    "<button id='changeNameBtn' type='button'>改名</button></div>"+
    "<div class='stats-kpi-grid'>"+
    "<div class='stats-kpi'><span>通关</span><strong>"+s.cleared+"/"+s.total+"</strong></div>"+
    "<div class='stats-kpi'><span>挑战</span><strong>"+s.challenged+"</strong></div>"+
    "<div class='stats-kpi'><span>总星</span><strong>"+s.totalStars+"</strong></div>"+
    "<div class='stats-kpi'><span>总步</span><strong>"+(s.totalMoves||"--")+"</strong></div>"+
    "<div class='stats-kpi'><span>时长</span><strong>"+(formatMs(s.totalTime)||"--")+"</strong></div>"+
    "</div>";
  // chart
  const chartEl=document.getElementById("statsChart");
  if(chartEl){
    let h="";
    s.perLevel.forEach(lv=>{
      const r=lv.r;const w=r&&lv.par>0?Math.min(100,Math.round(r.bestMoves/lv.par*100)):0;
      const col=r?.bestRank==="★★★"?"#ffd166":r?.bestRank==="★★"?"#8be9fd":r?.bestRank==="★"?"#7ee081":"#56406f";
      h+="<div class='stats-bar-row'><span class='stats-bar-name'>"+(lv.i+1)+". "+lv.name+"</span>"+
        "<div class='stats-bar-track'><div class='stats-bar-fill' style='width:"+w+"%;background:"+col+";'></div></div>"+
        "<span style='min-width:48px;text-align:right;font-size:0.78rem;color:var(--muted)'>"+((r&&r.bestMoves)?r.bestMoves+"步":"--")+"</span>"+
        "</div>";
    });
    chartEl.innerHTML=h+renderTimeTrend()+renderActivityCalendar()+renderStepsBarChart()+renderLevelStats();
  }
}
function showStats(){
  renderStats();
  document.getElementById("statsModal").classList.remove("hidden");
  audio.unlock(); audio.playSfx("ui");
  const el=document.getElementById("playerNameDisplay");
  if(el)el.textContent=getPlayerName();
}
function hideStats(){document.getElementById("statsModal")?.classList.add("hidden");}
function showEditor(){
  const modal=document.getElementById("editorModal");
  if(!modal)return;
  editorInitGrid(editor.rows,editor.cols,true);
  editorSaveState();
  editorRender();
  modal.classList.remove("hidden");
  audio.playSfx("ui");
}
function hideEditor(){document.getElementById("editorModal")?.classList.add("hidden");}

// ─── Button Events ─────────────────────────────────────────────
document.getElementById('restartBtn')?.addEventListener('click',()=>restartLevel(true));
document.getElementById('undoLimitBtn')?.addEventListener('click',()=>{
  audio.unlock();
  const cycles=[-1,5,3,1,0];
  const cur=cycles.indexOf(undoLimit);
  setUndoLimit(cycles[(cur+1)%cycles.length]);
});
document.getElementById('undoBtn')?.addEventListener('click',()=>undo(true));
document.getElementById('nextBtn')?.addEventListener('click',()=>nextLevel(true));
document.getElementById('pathVizBtn')?.addEventListener('click',()=>{audio.unlock();hideModal();showPathVisualization();});
document.getElementById('shareCardBtn')?.addEventListener('click',()=>{
  audio.unlock();
  const level=getLevelConfig();
  const rank=winRankEl?.textContent||'';
  const canvas=generateShareCard(rank,state.moves,level.name,state.timer.elapsedMs);
  const a=document.createElement('a');
  a.download='sokoban_'+(state.levelIndex+1)+'.png';
  a.href=canvas.toDataURL();a.click();
  notify('成绩卡已保存','📷');
});
document.getElementById('shareResultBtn')?.addEventListener('click',()=>{
  audio.unlock();
  const rank=winRankEl?.textContent||'';
  const moves=state.moves;
  const level=getLevelConfig();
  const txt=`像素推笱子 | L${state.levelIndex+1} ${level.name} | ${moves}步 ${rank} | 山户`;
  if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>notify('成绩已复制！','📋'));
});
document.getElementById('modalRestartBtn')?.addEventListener('click',()=>restartLevel(true));
document.getElementById('modalNextBtn')?.addEventListener('click',()=>{clearAutoNext();nextLevel(true);});
document.getElementById('hintBtn')?.addEventListener('click',()=>{audio.unlock();showHint();});
document.getElementById('aiDemoBtn')?.addEventListener('click',()=>{audio.unlock();startAiDemo();});
document.getElementById('editorBtn')?.addEventListener('click',()=>{audio.unlock();showEditor();});
document.getElementById('statsBtn')?.addEventListener('click',()=>{audio.unlock();showStats();});
document.getElementById('dailyStepBtn')?.addEventListener('click',()=>{audio.unlock();showDailyStepChallenge();});
document.getElementById('shareBtn')?.addEventListener('click',()=>{audio.unlock();shareLevelUrl();});
document.getElementById('bgmBtn')?.addEventListener('click',()=>{audio.unlock();switchBgm();});
document.getElementById('fullscreenBtn')?.addEventListener('click',()=>toggleFullscreen());
document.getElementById('lockModeBtn')?.addEventListener('click',()=>{audio.unlock();toggleLockMode();updateLockBtn();});

const SHORTCUTS=[
  ["WASD/方向键","移动"],["Z","撤销"],["R","重开"],
  ["H","提示"],["L","选关"],["E","编辑器"],["S","统计"],
  ["N/Enter","下一关"],["Esc","关闭弹窗"],["?","帮助"],
  ["触屏滑动","方向控制"],["全屏按鈕","全屏模式"],
];
function showHelp(){
  const modal=document.getElementById("helpModal");
  if(!modal)return;
  const content=document.getElementById("helpContent");
  if(content)content.innerHTML=SHORTCUTS.map(([k,v])=>
    `<div class="help-row"><kbd>${k}</kbd><span>${v}</span></div>`).join("");
  modal.classList.remove("hidden");
  audio.playSfx("ui");
}
function hideHelp(){document.getElementById("helpModal")?.classList.add("hidden");}
document.getElementById("helpCloseBtn")?.addEventListener("click",hideHelp);
let heatmapActive=false;
document.getElementById('randomChalBtn')?.addEventListener('click',()=>{audio.unlock();randomChallenge();});
document.getElementById('pushOnlyBtn')?.addEventListener('click',()=>{audio.unlock();togglePushOnly();});
document.getElementById('pauseBtn')?.addEventListener('click',()=>{audio.unlock();togglePause();});
document.getElementById('heatmapBtn')?.addEventListener('click',()=>{
  audio.unlock();
  heatmapActive=!heatmapActive;
  if(heatmapActive)showHeatmap();else clearHeatmapDisplay();
  const btn=document.getElementById('heatmapBtn');
  if(btn)btn.classList.toggle('active',heatmapActive);
});
document.getElementById('solutionBtn')?.addEventListener('click',()=>{audio.unlock();showSolutionSteps();});
document.getElementById('compareBtn')?.addEventListener('click',()=>{audio.unlock();compareSolution();});
document.getElementById('sfxPreviewBtn')?.addEventListener('click',()=>{audio.unlock();showSfxPreview();});
document.getElementById('lowFxBtn')?.addEventListener('click',()=>{audio.unlock();toggleLowFx();});
document.getElementById('langBtn')?.addEventListener('click',()=>{audio.unlock();toggleLang();});
document.getElementById('helpBtn')?.addEventListener('click',()=>{audio.unlock();showHelp();});
document.getElementById('helpCloseBtn')?.addEventListener('click',()=>hideHelp());
document.getElementById('helpModal')?.addEventListener('click',e=>{if(e.target===document.getElementById('helpModal'))hideHelp();});
document.getElementById('timeAttackBtn')?.addEventListener('click',()=>{audio.unlock();if(timeAttack.active){if(confirm('放弃?'))endTimeAttack();}else{if(confirm('开始3分钟?'))startTimeAttack();}});
document.getElementById('replayBtn')?.addEventListener('click',()=>{audio.unlock();if(replay.active)stopReplay();else showReplayPicker();});
document.getElementById('adaptiveBtn')?.addEventListener('click',()=>{audio.unlock();showAdaptiveAdvice();});
document.getElementById('nextAchievBtn')?.addEventListener('click',()=>{audio.unlock();showNextAchievement();});
document.getElementById('statsResetBtn')?.addEventListener('click',()=>{if(confirm('清除?')){localStorage.removeItem(STORAGE_KEY);state.records={};renderStats();setMessage('已清除','info');}});
document.getElementById('statsCloseBtn')?.addEventListener('click',()=>hideStats());
document.getElementById('statsModal')?.addEventListener('click',e=>{if(e.target===document.getElementById('statsModal'))hideStats();});
document.getElementById('changeNameBtn')?.addEventListener('click',()=>{const n=prompt('玩家名:',getPlayerName());if(n!==null){const s=setPlayerName(n);const el=document.getElementById('playerNameDisplay');if(el)el.textContent=s;}});
document.getElementById('progressRingBtn')?.addEventListener('click',()=>{audio.unlock();showProgressRings();});
document.getElementById('achievWallBtn')?.addEventListener('click',()=>{audio.unlock();showAchievementWall();});
document.getElementById('settingsBtn')?.addEventListener('click',()=>{audio.unlock();showSettingsPanel();});
document.getElementById('printBtn')?.addEventListener('click',()=>{audio.unlock();printLevel();});
document.getElementById('recommendBtn')?.addEventListener('click',()=>{audio.unlock();recommendNextLevel();});
document.getElementById('effRankBtn')?.addEventListener('click',()=>{audio.unlock();renderSpeedLeaderboard();});
document.getElementById('diffAnalBtn')?.addEventListener('click',()=>{audio.unlock();showDifficultyAnalysis();});
document.getElementById('recentBtn')?.addEventListener('click',()=>{audio.unlock();showRecentClears();});
document.getElementById('timelineBtn')?.addEventListener('click',()=>{audio.unlock();showCompletionTimeline();});
document.getElementById('globalRecBtn')?.addEventListener('click',()=>{audio.unlock();showGlobalRecords();});
document.getElementById('speedRankBtn')?.addEventListener('click',()=>{audio.unlock();showSpeedRank();});
document.getElementById('screenshotBtn')?.addEventListener('click',()=>{audio.unlock();captureBoard();});
document.getElementById('exportReportBtn')?.addEventListener('click',()=>{audio.unlock();exportTextReport();});
document.getElementById('exportSaveBtn')?.addEventListener('click',()=>{audio.unlock();exportSave();});
document.getElementById('importSaveBtn')?.addEventListener('click',()=>document.getElementById('importSaveInput')?.click());
document.getElementById('importSaveInput')?.addEventListener('change',(e)=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=(ev)=>{const m=importSave(ev.target.result);setMessage(m,m.includes('成功')?'win':'warn');e.target.value='';};r.readAsText(file);});
document.getElementById('winNoteSaveBtn')?.addEventListener('click',()=>{const t=document.getElementById('winNoteInput')?.value||'';saveNote(state.levelIndex,t);setMessage(t.trim()?'已保存':'已删除','info');audio.playSfx('ui');});
document.getElementById('bgmSlider')?.addEventListener('input',(e)=>{audio.ensureContext();if(audio.bgmGain)audio.bgmGain.gain.value=+e.target.value*0.22;localStorage.setItem('pixelSokobanBgmVol',e.target.value);});
document.getElementById('sfxSlider')?.addEventListener('input',(e)=>{audio.ensureContext();if(audio.sfxGain)audio.sfxGain.gain.value=+e.target.value;localStorage.setItem('pixelSokobanSfxVol',e.target.value);});
// Populate template select
const tmplSel=document.getElementById('editorTemplateSelect');
if(tmplSel){EDITOR_TEMPLATES.forEach((t,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=t.name;tmplSel.appendChild(opt);});
tmplSel.addEventListener('change',()=>{if(tmplSel.value!==''){applyEditorTemplate(+tmplSel.value);tmplSel.value='';}});}
document.getElementById('editorShareBtn')?.addEventListener('click',()=>{audio.unlock();shareEditorLevel();});
document.getElementById('batchTestBtn')?.addEventListener('click',()=>{audio.unlock();batchTestCustomLevels();});
document.getElementById('editorAiBtn')?.addEventListener('click',()=>{audio.unlock();editorAiSolve();});
document.getElementById('editorExportFileBtn')?.addEventListener('click',()=>exportEditorAsLevel());
document.getElementById('packImportBtn')?.addEventListener('click',()=>{const t=prompt('关卡包JSON:');if(!t)return;const m=importLevelPack(t);setMessage(m,m.startsWith('成功')?'win':'warn');if(m.startsWith('成功'))renderLevelSelect();});
document.querySelectorAll('.speed-btn').forEach(b=>b.addEventListener('click',()=>{audio.unlock();setDemoSpeed(Number(b.dataset.speed));}));
document.querySelectorAll('.theme-btn').forEach(b=>b.addEventListener('click',()=>{audio.unlock();applyTheme(b.dataset.theme);state.stats.themesUsed.add(b.dataset.theme);}));

// D-pad button acceleration
document.querySelectorAll('[data-dir]').forEach(btn=>{
  let iv=null,speed=200,startT=0;
  const m={up:[0,-1,'up'],down:[0,1,'down'],left:[-1,0,'left'],right:[1,0,'right']}[btn.dataset.dir];
  if(!m)return;
  const fire=()=>{audio.unlock();tryMove(m[0],m[1],m[2]);};
  const tick=()=>{
    fire();
    const elapsed=Date.now()-startT;
    speed=elapsed<500?200:elapsed<1500?120:elapsed<3000?80:50;
    iv=setTimeout(tick,speed);
  };
  btn.addEventListener('mousedown',(e)=>{e.preventDefault();startT=Date.now();fire();iv=setTimeout(tick,400);});
  btn.addEventListener('touchstart',(e)=>{e.preventDefault();startT=Date.now();fire();iv=setTimeout(tick,400);},{passive:false});
  btn.addEventListener('mouseup',()=>{clearTimeout(iv);iv=null;speed=200;});
  btn.addEventListener('touchend',()=>{clearTimeout(iv);iv=null;speed=200;});
  btn.addEventListener('mouseleave',()=>{if(iv){clearTimeout(iv);iv=null;speed=200;}});
});
document.querySelectorAll('[data-dir]').forEach(b=>{b.addEventListener('click',()=>{const m={up:[0,-1,'up'],down:[0,1,'down'],left:[-1,0,'left'],right:[1,0,'right']}[b.dataset.dir];if(m){audio.unlock();tryMove(m[0],m[1],m[2]);}});});
document.getElementById('levelSelectBtn')?.addEventListener('click',()=>showLevelSelect(true));
document.getElementById('levelSelectCloseBtn')?.addEventListener('click',()=>hideLevelSelect(true));
levelSelectGridEl?.addEventListener('click',(e)=>{const card=e.target.closest('.level-card');if(!card)return;const idx=Number(card.dataset.level);if(!Number.isFinite(idx))return;if(!isLevelUnlocked(idx)){setMessage('先通关上一关!','warn');audio.playSfx('fail');return;}audio.unlock();loadLevel(idx);hideLevelSelect();});
document.getElementById('editorCloseBtn')?.addEventListener('click',()=>hideEditor());
document.getElementById('editorModal')?.addEventListener('click',e=>{if(e.target===document.getElementById('editorModal'))hideEditor();});

// Editor grid presets
const GRID_PRESETS=[{label:"5×5",w:5,h:5},{label:"8×7",w:8,h:7},{label:"10×8",w:10,h:8},{label:"12×10",w:12,h:10}];
(function(){
  const container=document.getElementById('editorSizePresets');
  if(!container)return;
  GRID_PRESETS.forEach(p=>{
    const btn=document.createElement('button');btn.textContent=p.label;btn.type='button';
    btn.className='editor-tool';
    btn.addEventListener('click',()=>{
      document.getElementById('editorW').value=p.w;
      document.getElementById('editorH').value=p.h;
      editorInitGrid(p.h,p.w,false);editorSaveState();editorRender();
      setMessage(`预设 ${p.label}`,'info');
    });
    container.appendChild(btn);
  });
})();
document.getElementById('editorResizeBtn')?.addEventListener('click',()=>{const w=Math.max(5,Math.min(16,+document.getElementById('editorW').value));const h=Math.max(5,Math.min(14,+document.getElementById('editorH').value));editorInitGrid(h,w,true);editorRender();});
document.getElementById('editorFillWallBtn')?.addEventListener('click',()=>{for(let y=0;y<editor.rows;y++)for(let x=0;x<editor.cols;x++)if(x===0||x===editor.cols-1||y===0||y===editor.rows-1)editor.grid[y][x]='#';editorSaveState();editorRender();});
document.getElementById('editorClearBtn')?.addEventListener('click',()=>{editorInitGrid(editor.rows,editor.cols,false);editorSaveState();editorRender();});

// Editor coordinate display
(function(){
  document.getElementById('editorBoard')?.addEventListener('mouseover',(e)=>{
    const cell=e.target.closest('.editor-cell');
    const el=document.getElementById('editorCoord');
    if(cell&&el)el.textContent=`X:${cell.dataset.x} Y:${cell.dataset.y} [${(editor.grid[+cell.dataset.y]||[])[+cell.dataset.x]||''}]`;
  });
  document.getElementById('editorBoard')?.addEventListener('mouseleave',()=>{
    const el=document.getElementById('editorCoord');
    if(el)el.textContent='';
  });
})();
document.getElementById('editorRectBtn')?.addEventListener('click',()=>{
  if(editor.rectStart){editor.rectStart=null;notify('矩形模式已取消','❌');}
  else{editor.rectStart={x:0,y:0};notify('点击起点，再点终点','🟧');}
});
document.getElementById('editorLineBtn')?.addEventListener('click',()=>{
  const x=editor.lineStart?-1:0;
  if(editor.lineStart){editor.lineStart=null;notify('线条模式已取消','❌');}
  else{editor.lineStart={x:0,y:0};notify('点击起点，再点终点','📏');}
});
document.getElementById('editorFlipHBtn')?.addEventListener('click',()=>editorFlipH());
document.getElementById('editorFlipVBtn')?.addEventListener('click',()=>editorFlipV());
document.getElementById('editorRotBtn')?.addEventListener('click',()=>editorRotate90());
document.getElementById('editorSymBtn')?.addEventListener('click',()=>{
  editor.symmetric=!editor.symmetric;
  const btn=document.getElementById('editorSymBtn');
  if(btn)btn.textContent='对称 '+(editor.symmetric?'ON':'OFF');
  btn?.classList.toggle('active',editor.symmetric);
});
document.getElementById('editorUndoBtn')?.addEventListener('click',()=>editorUndo());
document.getElementById('editorRedoBtn')?.addEventListener('click',()=>editorRedo());
document.getElementById('editorRandomBtn')?.addEventListener('click',()=>{const w=+document.getElementById('editorW').value||8,h=+document.getElementById('editorH').value||7;const boxes=Math.max(1,Math.min(3,Math.floor(w*h/20)+1));const map=generateRandomLevel(w,h,boxes);if(!map){setMessage('失败','warn');return;}editor.rows=h;editor.cols=w;editor.grid=map.map(r=>[...r].concat(Array(w-r.length).fill(' ')));editorSaveState();editorRender();state.stats.randomPlayed=true;});
document.getElementById('editorTestBtn')?.addEventListener('click',()=>startEditorInlineTest());
document.getElementById('editorExportBtn')?.addEventListener('click',()=>{if(!editorIsValid()){setMessage('不合法','warn');return;}const code=JSON.stringify(editorGetMapRows());if(navigator.clipboard)navigator.clipboard.writeText(code).then(()=>setMessage('已复制!','win'));else prompt('',code);});
document.getElementById('editorClipBtn')?.addEventListener('click',()=>{audio.unlock();editorImportFromClipboard();});
document.getElementById('editorImportBtn')?.addEventListener('click',()=>document.getElementById('editorImportBox')?.classList.toggle('hidden'));
document.getElementById('editorImportCancelBtn')?.addEventListener('click',()=>document.getElementById('editorImportBox')?.classList.add('hidden'));
document.getElementById('editorImportConfirmBtn')?.addEventListener('click',()=>{const text=document.getElementById('editorImportText')?.value.trim();if(!text)return;let rows;try{const p=JSON.parse(text);if(Array.isArray(p))rows=p.map(String);else{setMessage('错误','warn');return;}}catch{rows=text.split(/\r?\n/);}rows=rows.filter(r=>r.length>0);if(rows.length<3){setMessage('小','warn');return;}editor.rows=rows.length;editor.cols=Math.max(...rows.map(r=>r.length));editor.grid=rows.map(row=>{const arr=[...row];while(arr.length<editor.cols)arr.push(' ');return arr;});editorSaveState();editorRender();document.getElementById('editorImportBox')?.classList.add('hidden');});
// Init
const _savedVol=Number(localStorage.getItem('pixelSokobanVolume')||0.22);
const _savedSpeed=Number(localStorage.getItem('pixelSokobanDemoSpeed')||350);
state.ai.speed=_savedSpeed;replay.speed=_savedSpeed;
audio.bgmTrack=Number(localStorage.getItem('pixelSokobanBgmTrack')||0);
syncCustomLevels();

function exportTextReport(){
  const s=calcStats();
  let txt="=== 像素推笱子 成绩单 ===\n";
  txt+=`玩家: ${getPlayerName()}  等级: ${getPlayerLevel().name}\n`;
  txt+=`通关: ${s.cleared}/${s.total}  挑战: ${s.challenged}  星数: ${s.totalStars}\n`;
  txt+=`总步数: ${s.totalMoves}  总时长: ${formatMs(s.totalTime)}\n`;
  txt+="\n--- 关卡明细 ---\n";
  for(let i=0;i<LEVELS.length;i++){
    const r=state.records[i],lv=LEVELS[i];
    if(r?.bestMoves){
      txt+=`L${String(i+1).padStart(2,"0")} ${lv.name.padEnd(8)} ${r.bestMoves}步 ${r.bestRank} ${r.challengeCleared?"[挑战]":""}\n`;
    }
  }
  txt+=`\n导出时间: ${new Date().toLocaleString()}\n`;
  const blob=new Blob([txt],{type:"text/plain;charset=utf-8"});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download="sokoban_report_"+Date.now()+".txt";a.click();URL.revokeObjectURL(a.href);
  notify("成绩单已导出","📄");
}
applyTheme(localStorage.getItem('pixelSokobanTheme')||'dark');
updateLockBtn();

// Show float dpad toggle on touch devices
(function(){
  if(window.matchMedia('(hover:none) and (pointer:coarse)').matches||navigator.maxTouchPoints>0){
    const t=document.getElementById('floatDpadToggle');
    if(t)t.classList.remove('hidden');
    // Auto-show on first visit for mobile
    if(!localStorage.getItem('pixelSokobanFloatDpad')){
      localStorage.setItem('pixelSokobanFloatDpad','1');
      const p=document.getElementById('floatDpad');
      if(p){p.classList.remove('hidden');document.getElementById('floatDpadToggle').textContent='×';}
    }
  }
})();
checkUrlLevel();
checkDailyChallenge();
checkAutosave();
loadLevel(state.levelIndex||0);

function switchBgm(t){audio.bgmTrack=(t!==undefined?t:audio.bgmTrack+1)%audio.patterns.length;audio.noteIndex=0;setMessage("BGM切换:"+["明快","忧郁","激昂","赛博"][audio.bgmTrack],"info");localStorage.setItem("pixelSokobanBgmTrack",audio.bgmTrack);}
function generateRandomLevel(cols,rows,boxCount){cols=cols||8;rows=rows||7;boxCount=boxCount||2;const grid=Array.from({length:rows},(_,y)=>Array.from({length:cols},(_,x)=>(x===0||x===cols-1||y===0||y===rows-1)?"#":" "));for(let i=0;i<Math.floor(cols*rows*0.08);i++){const x=1+Math.floor(Math.random()*(cols-2)),y=1+Math.floor(Math.random()*(rows-2));grid[y][x]="#";}const free=[];for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++)if(grid[y][x]==" ")free.push([x,y]);if(free.length<boxCount*2+2)return null;const sh=a=>{for(let i=a.length-1;i>0;i--){const j=0|Math.random()*(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};sh(free);for(let i=0;i<boxCount;i++)grid[free[i][1]][free[i][0]]=".";for(let i=boxCount;i<boxCount*2;i++)grid[free[i][1]][free[i][0]]="$";grid[free[boxCount*2][1]][free[boxCount*2][0]]="@";return grid.map(r=>r.join(""));}
function toggleFullscreen(){if(!document.fullscreenElement)document.documentElement.requestFullscreen().catch(()=>{});else document.exitFullscreen().catch(()=>{})}
function exportSave(){const data={version:3,exported:new Date().toISOString(),records:state.records,theme:localStorage.getItem("pixelSokobanTheme"),player:localStorage.getItem("pixelSokobanPlayer"),notes:loadNotes(),bgmTrack:audio.bgmTrack};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="sokoban_save.json";a.click();URL.revokeObjectURL(a.href);setMessage("存档已导出","win");}
function importSave(t){let d;try{d=JSON.parse(t);}catch{return"JSON错误";}if(!d||!d.records)return"无效存档";state.records=d.records;saveRecords();if(d.theme)applyTheme(d.theme);if(d.player)setPlayerName(d.player);if(d.notes)localStorage.setItem("pixelSokobanNotes",JSON.stringify(d.notes));setMessage("存档导入成功","win");render();return"成功";}

function setDemoSpeed(ms){state.ai.speed=ms;replay.speed=ms;const labels={800:"慢速",350:"正常",150:"快速",60:"极速"};setMessage("演示速度："+(labels[ms]||ms+"ms"),"info");localStorage.setItem("pixelSokobanDemoSpeed",ms);document.querySelectorAll(".speed-btn").forEach(b=>b.classList.toggle("active",Number(b.dataset.speed)===ms));}
const stuckHint={lastMoves:0,lastCheck:0};
function checkStuck(){
  if(state.won||state.ai.demo||replay.active||timeAttack.active)return;
  if(state.moves<5){stuckHint.lastMoves=0;return;}
  const level=getLevelConfig();
  const threshold=Math.max(level.parMoves*2,20);
  if(state.moves>=threshold&&state.moves!==stuckHint.lastMoves&&Date.now()-stuckHint.lastCheck>30000){
    stuckHint.lastMoves=state.moves;stuckHint.lastCheck=Date.now();
    setMessage(`已走 ${state.moves} 步，超过目标 ${level.parMoves} 步！按 H 获取提示。`,"warn");
  }
}

const CUSTOM_LEVELS_KEY="pixelSokobanCustomLevels";
function loadCustomLevels(){try{return JSON.parse(localStorage.getItem(CUSTOM_LEVELS_KEY)||"[]")||[];}catch{return[];}}
const BASE_LEVEL_COUNT=70;function syncCustomLevels(){while(LEVELS.length>BASE_LEVEL_COUNT)LEVELS.pop();loadCustomLevels().forEach(lv=>LEVELS.push(lv));}
function importLevelPack(text){let pack;try{pack=JSON.parse(text);}catch{return"JSON错误";}
  if(!Array.isArray(pack))return"格式错误";
  const valid=[];for(const item of pack){if(!item.map||!Array.isArray(item.map))continue;valid.push({name:String(item.name||"自定义").slice(0,16),parMoves:Number(item.parMoves)||20,starMoves:item.starMoves||{three:20,two:28,one:38},map:item.map.map(String),custom:true});}
  if(!valid.length)return"未找到有效关卡";
  const ex=loadCustomLevels();localStorage.setItem(CUSTOM_LEVELS_KEY,JSON.stringify([...ex,...valid].slice(-50)));syncCustomLevels();return`成功导入 ${valid.length} 个关卡`;}

const TUTORIAL_HINTS={0:[{trigger:"start",msg:"用 WASD 或方向键移动，触屏滑动也可以",delay:800},{trigger:"move1",msg:"将笱子推到黄色目标点",delay:500}],1:[{trigger:"start",msg:"两个笱子，注意推进顺序",delay:800}],2:[{trigger:"start",msg:"卡住了？按 Z 撤销，按 H 提示",delay:1200}]};
let tutorialShown=new Set(JSON.parse(localStorage.getItem("pixelSokobanTutorial")||"[]"));
function showTutorialHint(trigger){
  const hints=TUTORIAL_HINTS[state.levelIndex];if(!hints)return;
  const hint=hints.find(h=>h.trigger===trigger);if(!hint)return;
  const key=`${state.levelIndex}_${trigger}`;
  if(tutorialShown.has(key))return;
  tutorialShown.add(key);localStorage.setItem("pixelSokobanTutorial",JSON.stringify([...tutorialShown]));
  setTimeout(()=>showTutorialBubble(hint.msg),hint.delay);
}
function showTutorialBubble(msg){
  let el=document.getElementById("tutorialBubble");
  if(!el){el=document.createElement("div");el.id="tutorialBubble";el.className="tutorial-bubble";document.querySelector(".game-shell")?.appendChild(el);}
  el.textContent=msg;el.classList.add("show");
  clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove("show"),3000);
}


// ─── 星星落下特效 ────────────────────────────────────────────────────────────

let perfectStreak=0;
function checkPerfectStreak(rank){
  if(rank==="★★★"){
    perfectStreak++;
    if(perfectStreak>=3)notify(`🌟 连续 ${perfectStreak} 关三星！张力！`,"👑");
  } else { perfectStreak=0; }
}
function showStarRain(rank) {
  const count = rank=="★★★" ? 15 : rank=="★★" ? 8 : 4;
  const shell = document.querySelector(".game-shell");
  if (!shell) return;
  for (let i=0;i<count;i++) {
    setTimeout(()=>{
      const el=document.createElement("div");
      el.className="star-drop";
      el.textContent="★";
      el.style.left=Math.random()*90+5+"%";
      el.style.animationDuration=(0.6+Math.random()*0.8)+"s";
      el.style.color=rank=="★★★"?"#ffd166":rank=="★★"?"#8be9fd":"#7ee081";
      shell.appendChild(el);
      setTimeout(()=>el.remove(),1500);
    }, i*120);
  }
}


// ─── 通知队列系统 ────────────────────────────────────────────────────────────
const notifyQueue = [];
let notifyBusy = false;
function notify(msg, icon, color) {
  notifyQueue.push({msg, icon: icon||"ℹ", color: color||"var(--accent)"});
  if (!notifyBusy) processNotifyQueue();
}
function processNotifyQueue() {
  if (!notifyQueue.length) { notifyBusy=false; return; }
  notifyBusy = true;
  const {msg,icon,color} = notifyQueue.shift();
  let el = document.getElementById("notifyToast");
  if (!el) {
    el = document.createElement("div");
    el.id = "notifyToast";
    el.className = "notify-toast";
    document.body.appendChild(el);
  }
  el.style.color = color;
  el.innerHTML = `<span class="nt-icon">${icon}</span><span class="nt-msg">${msg}</span>`;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(()=>{
    el.classList.remove("show");
    setTimeout(processNotifyQueue, 400);
  }, 2500);
}

// Long press undo
(function(){let t=null;document.addEventListener('touchstart',(e)=>{if(e.touches.length!==1||e.target.closest('button')||e.target.closest('.modal:not(.hidden)'))return;t=setTimeout(()=>{audio.unlock();undo(true);t=setInterval(()=>undo(),200);},500);},{passive:true});document.addEventListener('touchend',()=>{clearTimeout(t);clearInterval(t);t=null;});document.addEventListener('touchmove',()=>{clearTimeout(t);clearInterval(t);t=null;},{passive:true});})();
// Dark mode follow
(function(){const mq=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)');if(!mq)return;mq.addEventListener('change',(e)=>{const saved=localStorage.getItem('pixelSokobanTheme');if(!saved||saved==='dark'||saved==='light'){applyTheme(e.matches?'dark':'light');}});})();

// ─── 截图功能 ─────────────────────────────────────────────────────────────
function takeScreenshot(){
  if(typeof html2canvas!=="undefined"){
    html2canvas(document.querySelector(".app")).then(canvas=>{
      const a=document.createElement("a");
      a.download="sokoban_"+Date.now()+".png";
      a.href=canvas.toDataURL();a.click();
      notify("截图已保存！","📷");
    });
  } else {
    notify("请手动截屏（截图功能需要html2canvas）","📷");
  }
}
// ─── 难度分布统计 ────────────────────────────────────────────
function getDifficultyDistribution(){
  const dist={1:0,2:0,3:0,4:0,5:0};
  LEVELS.forEach(lv=>{const d=getLevelDifficulty(lv);dist[d.stars]++;});
  return dist;
}

function showSpeedRank(){
  const entries=[];
  for(let i=0;i<LEVELS.length;i++){const r=state.records[i];if(r&&r.bestTimeMs)entries.push({i,name:LEVELS[i].name,ms:r.bestTimeMs,rank:r.bestRank});}
  entries.sort((a,b)=>a.ms-b.ms);
  if(!entries.length){setMessage("还没有计时记录","warn");return;}
  let h="<div class='lb-overlay-card'><h2>最速排行</h2><table class='lb-table'><thead><tr><th>#</th><th>关卡</th><th>时间</th><th>评级</th></tr></thead><tbody>";
  entries.slice(0,15).forEach((e,i)=>{h+=`<tr><td>${i+1}</td><td>${e.name}</td><td>${formatMs(e.ms)}</td><td>${e.rank}</td></tr>`;});
  h+="</tbody></table><div class='controls center'><button id='spClose'>关闭</button></div></div>";
  const ov=document.createElement('div');ov.className='modal';ov.style.zIndex='9999';ov.innerHTML=h;
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});document.body.appendChild(ov);
  ov.querySelector('#spClose')?.addEventListener('click',()=>ov.remove());
}

function startLevelHoverPreview(canvas, map) {
  if (!canvas._previewRunning) {
    canvas._previewRunning = true;
    let frame = 0;
    const animate = () => {
      if (!canvas._previewRunning) return;
      renderLevelPreview(canvas, map);
      frame++;
      canvas._raf = requestAnimationFrame(animate);
    };
    canvas._raf = requestAnimationFrame(animate);
  }
}
function stopLevelHoverPreview(canvas) {
  canvas._previewRunning = false;
  if (canvas._raf) cancelAnimationFrame(canvas._raf);
}

function renderTimeTrend() {
  const data=[];
  for(let i=0;i<LEVELS.length;i++){const r=state.records[i];if(r&&r.bestTimeMs)data.push({i,ms:r.bestTimeMs,name:LEVELS[i].name});}
  if(data.length<2)return "";
  const maxMs=Math.max(...data.map(d=>d.ms));
  const barH=60;
  let svg=`<svg viewBox="0 0 ${data.length*20} ${barH+20}" style="width:100%;height:80px;margin-top:8px">`;
  data.forEach((d,i)=>{
    const h=Math.max(4,Math.round(d.ms/maxMs*barH));
    const x=i*20+2,y=barH-h;
    const col=d.ms<30000?"#88ff88":d.ms<60000?"#ffd166":"#ff79c6";
    svg+=`<rect x="${x}" y="${y}" width="16" height="${h}" fill="${col}" rx="2" opacity="0.8"/>`;
  });
  svg+="</svg>";
  return `<div class="stats-trend"><h3>通关时间分布</h3>${svg}<p style="font-size:0.72rem;color:var(--muted)">绿色&lt;30秒 金色&lt;60秒 红色&gt;60秒</p></div>`;
}

const I18N={zh:{wallMsg:"前面是墙，换个方向。",boxMsg:"笱子推不动。",undoMsg:"已撤销上一步。",noUndo:"没有可撤销的步骤。"},en:{wallMsg:"Wall! Try another way.",boxMsg:"Box is blocked!",undoMsg:"Undone.",noUndo:"Nothing to undo."}};
let currentLang=localStorage.getItem("pixelSokobanLang")||"zh";
function t(key){return I18N[currentLang]?.[key]||I18N.zh[key]||key;}
function setLang(lang){currentLang=lang;localStorage.setItem("pixelSokobanLang",lang);document.documentElement.lang=lang==="en"?"en":"zh-CN";}
function toggleLang(){setLang(currentLang==="zh"?"en":"zh");notify(currentLang==="en"?"English mode":"已切换中文","🌐");renderProgress();}

// Streak bonus
let clearStreak=0;
function updateStreak(){
  clearStreak++;
  if(clearStreak>=3)notify(`连续通关 ${clearStreak} 关！奖励 +${clearStreak*50}分`,"🔥");
}
// Easter egg: konami code
const KONAMI=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
let konamiIdx=0;
document.querySelectorAll(".star-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const s=Number(btn.dataset.star);
    saveRating(state.levelIndex,s,"");
    document.querySelectorAll(".star-btn").forEach((b,i)=>{b.textContent=i<s?"★":"☆";b.classList.toggle("selected",i<s);});
    notify("关卡评分："+"★".repeat(s),"✨");
  });
});

document.addEventListener("keydown",(ev)=>{
  if(ev.key===KONAMI[konamiIdx]){konamiIdx++;
    if(konamiIdx===KONAMI.length){konamiIdx=0;
      notify("神秘模式解锁！🌈","💫");
      applyTheme("rainbow");
      startConfetti("★★★",true);
    }
  } else konamiIdx=0;
});

const RATING_KEY="pixelSokobanRatings";
function loadRatings(){try{return JSON.parse(localStorage.getItem(RATING_KEY)||"{}")||{};}catch{return {};}}
function saveRating(li,stars,comment){const r=loadRatings();r[String(li)]={stars,comment:comment.slice(0,100),date:new Date().toLocaleDateString()};localStorage.setItem(RATING_KEY,JSON.stringify(r));}
function getRating(li){return loadRatings()[String(li)]||null;}

function exportCustomLevelPack(){
  const levels=loadCustomLevels();
  if(!levels.length){setMessage("没有自定义关卡","warn");return;}
  const blob=new Blob([JSON.stringify(levels,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);
  a.download="sokoban_levels_"+Date.now()+".json";a.click();URL.revokeObjectURL(a.href);
  notify("导出 "+levels.length+" 个自定义关卡","📦");
}

function editorAiSolve(){
  if(!editorIsValid()){setMessage("关卡不合法！","warn");return;}
  const map=editorGetMapRows();
  const grid=map.map(r=>[...r]);
  let px=0,py=0;const goals=[];
  for(let y=0;y<grid.length;y++)for(let x=0;x<grid[y].length;x++){
    if("@+".includes(grid[y][x])){px=x;py=y;}
    if(".+*".includes(grid[y][x]))goals.push({x,y});
  }
  setMessage("求解中...","info");
  setTimeout(()=>{
    const r=aiBfsSolve(grid,{x:px,y:py},goals);
    if(!r||!r.steps){setMessage("无解！","warn");return;}
    setMessage(`关卡可解 ${r.steps.length}步`,"win");
    notify(`可解！${r.steps.length}步`,"🤖");
  },30);
}

function shareEditorLevel(){
  if(!editorIsValid()){setMessage("关卡不合法！","warn");return;}
  const map=editorGetMapRows();
  const hash=levelToHash(map);
  if(!hash)return;
  const url=`${location.href.split("#")[0]}#level=${hash}`;
  if(navigator.clipboard){
    navigator.clipboard.writeText(url).then(()=>notify("自制关卡链接已复制！","🔗"));
  } else { prompt("复制此链接：",url); }
}

function editorImportFromClipboard(){
  if(!navigator.clipboard){setMessage("浏览器不支持剪贴板","warn");return;}
  navigator.clipboard.readText().then(text=>{
    if(!text)return;
    let rows;
    try{const p=JSON.parse(text);rows=Array.isArray(p)?p.map(String):null;}catch{rows=null;}
    if(!rows)rows=text.split(/\r?\n/).filter(r=>r.length>0);
    if(rows.length<3){setMessage("剪贴板内容无效","warn");return;}
    editor.rows=rows.length;editor.cols=Math.max(...rows.map(r=>r.length));
    editor.grid=rows.map(r=>[...r].concat(Array(editor.cols-r.length).fill(" ")));
    editorSaveState();editorRender();
    setMessage("已从剪贴板导入关卡","win");
  }).catch(()=>setMessage("无法读取剪贴板","warn"));
}
function exportEditorAsLevel(){
  if(!editorIsValid()){setMessage("关卡不合法！","warn");return;}
  const lv={name:"自定义_"+Date.now(),parMoves:20,starMoves:{three:20,two:28,one:38},map:editorGetMapRows()};
  const blob=new Blob([JSON.stringify([lv],null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);
  a.download="level_"+Date.now()+".json";a.click();URL.revokeObjectURL(a.href);
}

function showFloatingHotkeys(){
  let el=document.getElementById("hotkeysFloat");
  if(el){el.classList.toggle("show");return;}
  el=document.createElement("div");el.id="hotkeysFloat";el.className="hotkeys-float show";
  el.innerHTML="<div class='hk-title'>快捷键 <button id='hkClose'>&times;</button></div>"+SHORTCUTS.map(([k,v])=>`<div class='hk-row'><kbd>${k}</kbd><span>${v}</span></div>`).join("");
  document.body.appendChild(el);
  el.querySelector("#hkClose")?.addEventListener("click",()=>el.classList.remove("show"));
}

// Player level system
const PLAYER_LEVELS=[
  {min:0,name:"见习生",icon:"🐣"},
  {min:10,name:"初级搭档工",icon:"👷"},
  {min:30,name:"仓管助理",icon:"🧑"},
  {min:60,name:"经验仓管",icon:"👨‍💼"},
  {min:90,name:"仓库世界冠",icon:"👑"},
  {min:120,name:"笱子传说",icon:"🏆"},
];
function getPlayerLevel(){
  const s=calcStats();
  const score=s.totalStars*2+s.cleared*3+s.challenged*5;
  let lv=PLAYER_LEVELS[0];
  PLAYER_LEVELS.forEach(l=>{if(score>=l.min)lv=l;});
  return{...lv,score};
}

// Daily challenge
function getDailyChallenge(){
  const today=new Date().toLocaleDateString();
  const hash=today.split("/").reduce((a,b)=>a*31+Number(b),0);
  return Math.abs(hash)%Math.min(LEVELS.length,30);
}
function checkDailyChallenge(){
  const today=new Date().toLocaleDateString();
  const saved=localStorage.getItem("pixelSokobanDaily");
  if(saved===today)return;
  const lvIdx=getDailyChallenge();
  const lvl=LEVELS[lvIdx];
  setTimeout(()=>notify("今日挑战："+lvl.name+" (L"+(lvIdx+1)+")","📅"),1500);
}
function completeDailyChallenge(){
  const today=new Date().toLocaleDateString();
  if(state.levelIndex===getDailyChallenge()&&state.won){
    localStorage.setItem("pixelSokobanDaily",today);
    notify("今日挑战完成！📅","🏆");
  }
}

const AUTOSAVE_KEY="pixelSokobanAutosave";
function autosave(){if(state.won||state.moves===0)return;const snap={levelIndex:state.levelIndex,moves:state.moves,pushes:state.pushes,grid:state.grid.map(r=>[...r]),player:{...state.player},goals:state.goals.map(g=>({...g})),facing:state.facing,timeMs:state.timer.elapsedMs,ts:Date.now()};try{localStorage.setItem(AUTOSAVE_KEY,JSON.stringify(snap));}catch{}}
function clearAutosave(){localStorage.removeItem(AUTOSAVE_KEY);}
function checkAutosave(){try{const raw=localStorage.getItem(AUTOSAVE_KEY);if(!raw)return;const snap=JSON.parse(raw);if(!snap||snap.moves===0)return;const lvl=LEVELS[snap.levelIndex];if(!lvl)return;if(Date.now()-snap.ts>86400000){clearAutosave();return;}setTimeout(()=>{if(confirm("上次未完成 L"+(snap.levelIndex+1)+" "+lvl.name+"（"+snap.moves+"步），是否恢复？")){state.levelIndex=snap.levelIndex;state.grid=snap.grid;state.player=snap.player;state.goals=snap.goals;state.moves=snap.moves;state.pushes=snap.pushes;state.facing=snap.facing;state.timer.elapsedMs=snap.timeMs||0;boardEl.classList.remove("is-won");hideModal();render();setMessage("已恢复上次进度","info");}},1000);}catch{}}

// Editor touch support
(function(){
  let painting=false;
  function getTouchCell(e){
    const t=e.touches[0]||e.changedTouches[0];
    const el=document.elementFromPoint(t.clientX,t.clientY)?.closest('.editor-cell');
    return el?[+el.dataset.x,+el.dataset.y]:null;
  }
  document.addEventListener('touchstart',(e)=>{
    const cell=e.target.closest('.editor-cell');
    if(!cell)return;
    painting=true;
    editorPaint(+cell.dataset.x,+cell.dataset.y);
  },{passive:true});
  document.addEventListener('touchmove',(e)=>{
    if(!painting)return;
    const xy=getTouchCell(e);
    if(xy)editorPaint(xy[0],xy[1]);
  },{passive:true});
  document.addEventListener('touchend',()=>{painting=false;});
})();

const EXTRA_HINTS={
  3:{trigger:"move5",msg:"尝试先把近处的笱子推到目标"},
  5:{trigger:"push1",msg:"先怟后到"},
  7:{trigger:"move8",msg:"需要规划推笱子的顺序"},
};
function checkExtraHint(){
  const h=EXTRA_HINTS[state.levelIndex];if(!h)return;
  const key="extra_"+state.levelIndex;
  if(tutorialShown.has(key))return;
  if((h.trigger==="move5"&&state.moves===5)||(h.trigger==="move8"&&state.moves===8)||(h.trigger==="push1"&&state.pushes===1)){
    tutorialShown.add(key);localStorage.setItem("pixelSokobanTutorial",JSON.stringify([...tutorialShown]));
    showTutorialBubble(h.msg);
  }
}

// Level search

let levelFilter="all";
function setLevelFilter(f){
  levelFilter=f;
  const favs=loadFavs();
  document.querySelectorAll(".level-card").forEach(card=>{
    const idx=Number(card.dataset.level);
    const r=state.records[idx];
    const cleared=r&&r.bestMoves>0;
    let show=true;
    if(f==="cleared"&&!cleared)show=false;
    if(f==="uncleared"&&cleared)show=false;
    if(f==="favorites"&&!favs.has(idx))show=false;
    card.style.display=show?"":"none";
  });
  document.querySelectorAll(".filter-btn").forEach(b=>b.classList.toggle("active",b.dataset.filter===f));
}
document.getElementById("levelSearch")?.addEventListener("input",(e)=>{
  const q=e.target.value.toLowerCase().trim();
  document.querySelectorAll(".level-card").forEach(card=>{
    const name=card.querySelector(".level-card-title strong")?.textContent?.toLowerCase()||"";
    const idx=Number(card.dataset.level)+1;
    card.style.display=(!q||name.includes(q)||String(idx).includes(q))?"":"none";
  });
});

function showSolutionSteps(){
  if(state.won){setMessage("已经通关！","info");return;}
  const result=aiBfsSolve(state.grid,state.player,state.goals);
  if(!result||!result.steps){setMessage("未找到解法","warn");return;}
  const dirs={up:"↑",down:"↓",left:"←",right:"→"};
  const txt=result.steps.map(s=>dirs[s.facing]||"?").join(" ");
  const ov=document.createElement("div");ov.className="modal";ov.style.zIndex="9999";
  ov.innerHTML="<div class='lb-overlay-card'><h2>解题步骤 ("+result.steps.length+"步)</h2><p style='font-family:monospace;word-break:break-all;line-height:2;color:var(--accent)'>"+txt+"</p><div class='controls center' style='margin-top:12px'><button id='solClose'>关闭</button></div></div>";
  document.body.appendChild(ov);
  ov.querySelector("#solClose")?.addEventListener("click",()=>ov.remove());
  ov.addEventListener("click",e=>{if(e.target===ov)ov.remove();});
}

function flashScreen(color,duration){
  const el=document.createElement("div");
  el.style.cssText="position:fixed;inset:0;background:"+color+";z-index:9997;pointer-events:none;opacity:0.3;transition:opacity "+duration+"ms";
  document.body.appendChild(el);
  requestAnimationFrame(()=>{el.style.opacity="0";setTimeout(()=>el.remove(),duration+50);});
}

function playBoardClearAnimation(){
  const tiles=boardEl.querySelectorAll('.tile:not(.wall)');
  const arr=[...tiles];
  arr.forEach((t,i)=>{
    setTimeout(()=>{t.style.transform="scale(0)";t.style.transition="transform 0.3s ease-in";},i*20);
  });
  setTimeout(()=>{arr.forEach(t=>{t.style.transform="";t.style.transition="";});},arr.length*20+400);
}

function zoomBoard(delta){
  const ts=parseInt(getComputedStyle(boardEl).getPropertyValue('--tile-size')||boardEl.style.getPropertyValue('--tile-size')||48);
  const newTs=Math.max(24,Math.min(64,ts+delta));
  boardEl.style.setProperty('--tile-size',newTs+'px');
  document.documentElement.style.setProperty('--tile-size',newTs+'px');
  notify(`棋盘大小：${newTs}px`,'🔍');
}
function showRankAnimation(rank){
  if(rank==="★★★")flashScreen("#ffd166",600);
  else if(rank==="★★")flashScreen("#8be9fd",400);
  else if(rank==="★")flashScreen("#7ee081",300);
}

function updateReplayProgress(){
  if(!replay.active)return;
  let el=document.getElementById("replayProgress");
  if(!el){
    el=document.createElement("div");el.id="replayProgress";el.className="replay-progress";
    document.querySelector(".game-shell")?.appendChild(el);
  }
  const pct=Math.round(replay.index/Math.max(replay.steps.length,1)*100);
  el.innerHTML=`<div class="rp-fill" style="width:${pct}%"></div>`;
  el.title=`${replay.index}/${replay.steps.length}`;
}

const EDITOR_TEMPLATES=[
  {name:"小仓库",rows:6,cols:8,map:["########","#      #","#      #","#      #","#      #","########"]},
  {name:"长廸",rows:5,cols:12,map:["############","#          #","#          #","#          #","############"]},
  {name:"T字形",rows:7,cols:9,map:["#########","###   ###","#       #","#   @   #","#       #","###   ###","#########"]},
];
function applyEditorTemplate(idx){
  const t=EDITOR_TEMPLATES[idx];if(!t)return;
  editor.rows=t.rows;editor.cols=t.map[0].length;
  editor.grid=t.map.map(r=>[...r]);
  editorSaveState();editorRender();
  setMessage("模板："+t.name,"info");
}

const FAV_KEY="pixelSokobanFavorites";
function loadFavs(){try{return new Set(JSON.parse(localStorage.getItem(FAV_KEY)||"[]"));}catch{return new Set();}}
function toggleFav(idx){const f=loadFavs();if(f.has(idx))f.delete(idx);else f.add(idx);localStorage.setItem(FAV_KEY,JSON.stringify([...f]));return f.has(idx);}
function isFav(idx){return loadFavs().has(idx);}


// ─── Main keyboard handler ───────────────────────────────────────────────────
document.addEventListener('keydown',(ev)=>{
  if(ev.ctrlKey||ev.metaKey||ev.altKey)return;
  const lk=ev.key.toLowerCase();
  if(ev.key==='Escape'){
    if(editorInlineTestMode){ev.preventDefault();stopEditorInlineTest();return;}
    if(state.uiScreen==='levelSelect'){ev.preventDefault();hideLevelSelect(true);return;}
    if(!winModalEl.classList.contains('hidden')){ev.preventDefault();clearAutoNext();hideModal();return;}
    ['editorModal','statsModal','helpModal'].forEach(id=>document.getElementById(id)?.classList.add('hidden'));
    return;
  }
  if(lk==='l'){ev.preventDefault();showLevelSelect(true);return;}
  if(state.uiScreen==='levelSelect'){
    const cols=window.innerWidth>=700?3:2,total=LEVELS.length;let f=state.levelSelectFocus;
    if(ev.key==='ArrowRight'){ev.preventDefault();f=Math.min(f+1,total-1);}
    else if(ev.key==='ArrowLeft'){ev.preventDefault();f=Math.max(f-1,0);}
    else if(ev.key==='ArrowDown'){ev.preventDefault();f=Math.min(f+cols,total-1);}
    else if(ev.key==='ArrowUp'){ev.preventDefault();f=Math.max(f-cols,0);}
    else if(ev.key==='Enter'){ev.preventDefault();const c2=levelSelectGridEl?.querySelectorAll('.level-card')[f];if(c2)c2.click();return;}
    state.levelSelectFocus=f;focusLevelCard(f);return;
  }
  if(state.won&&(ev.key==='Enter'||lk==='n')){ev.preventDefault();clearAutoNext();nextLevel(true);return;}
  if(lk==='p'){ev.preventDefault();togglePause();return;}
  if(lk==='f'){ev.preventDefault();
    const on=toggleFav(state.levelIndex);
    notify(on?'已收藏':'已取消收藏',on?'♥':'♡');
    return;
  }
  if(ev.key==='+'){ev.preventDefault();zoomBoard(4);return;}
  if(ev.key==='-'){ev.preventDefault();zoomBoard(-4);return;}
  if(lk==='r'){ev.preventDefault();restartLevel(true);return;}
  if(lk==='z'){ev.preventDefault();undo(true);return;}
  if(lk==='h'){ev.preventDefault();showHint();return;}
  if(lk==='e'){ev.preventDefault();showEditor();return;}
  if(lk==='s'){ev.preventDefault();showStats();return;}
  if(lk==='?'){ev.preventDefault();showHelp();return;}
  if(!ev.ctrlKey&&!ev.metaKey&&/^[1-9]$/.test(ev.key)&&state.uiScreen!=='levelSelect'){
    const idx=+ev.key-1;
    if(idx<LEVELS.length&&isLevelUnlocked(idx)){ev.preventDefault();audio.unlock();loadLevel(idx);setMessage('跳转到第'+ev.key+'关','info');}    return;
  }
  const mv=getKeyMove(ev.key);
  if(mv&&state.uiScreen==='game'&&!state.won){ev.preventDefault();tryMove(mv[0],mv[1],mv[2]);}
});

// Player trail effect
function showPlayerTrail(x,y){
  const tiles=boardEl.querySelectorAll('.tile');
  const cols=Math.max(...state.grid.map(r=>r.length));
  const idx=y*cols+x;
  const tile=tiles[idx];
  if(!tile)return;
  const rect=tile.getBoundingClientRect();
  const el=document.createElement('div');
  el.className="player-trail";
  el.style.left=rect.left+rect.width/2+"px";
  el.style.top=rect.top+rect.height/2+"px";
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),500);
}

// Step heatmap
let stepHeatmap={};
function recordStep(x,y){const k=`${x},${y}`;stepHeatmap[k]=(stepHeatmap[k]||0)+1;}
function resetHeatmap(){stepHeatmap={};}
function showHeatmap(){
  const tiles=boardEl.querySelectorAll('.tile');
  const cols=Math.max(...state.grid.map(r=>r.length));
  const maxv=Math.max(1,...Object.values(stepHeatmap));
  tiles.forEach((tile,i)=>{
    const x=i%cols,y=Math.floor(i/cols);
    const v=stepHeatmap[`${x},${y}`]||0;
    if(v>0){const opacity=v/maxv;tile.style.boxShadow=`inset 0 0 0 2px rgba(255,107,107,${opacity})`;}
  });
  setMessage(`热力图显示中，共 ${Object.keys(stepHeatmap).length} 个格子`,"info");
}
function clearHeatmapDisplay(){boardEl.querySelectorAll('.tile').forEach(t=>{t.style.boxShadow="";});}

// Pause system
let gamePaused=false;
function pauseGame(){
  if(state.won||state.uiScreen!=="game")return;
  gamePaused=true;
  stopTimer();
  let el=document.getElementById("pauseOverlay");
  if(!el){el=document.createElement("div");el.id="pauseOverlay";el.className="pause-overlay";
    el.innerHTML="<div class='pause-content'><h2>暂停</h2><p>按 P 或点击继续</p></div>";
    el.addEventListener("click",resumeGame);
    document.body.appendChild(el);
  }
  el.classList.remove("hidden");
}
function resumeGame(){
  gamePaused=false;
  if(state.moves>0)startTimer();
  document.getElementById("pauseOverlay")?.classList.add("hidden");
}
function togglePause(){if(gamePaused)resumeGame();else pauseGame();}

// Timed mode
const timedMode={active:false,limitMs:0,rafId:null};
function startTimedMode(limitSec){
  timedMode.active=true;timedMode.limitMs=limitSec*1000;
  loadLevel(state.levelIndex);
  notify("限时模式："+limitSec+"秒内通关！","⏳");
  timedTick();
}
function timedTick(){
  if(!timedMode.active)return;
  const elapsed=state.timer.elapsedMs||(Date.now()-state.timer.startMs);
  const rem=timedMode.limitMs-elapsed;
  if(rem<=0){timedMode.active=false;setMessage("时间到！请重试","warn");audio.playSfx("fail");restartLevel();return;}
  if(rem<5000){setMessage("还剩 "+Math.ceil(rem/1000)+" 秒！","warn");}
  timedMode.rafId=requestAnimationFrame(timedTick);
}
function stopTimedMode(){timedMode.active=false;if(timedMode.rafId)cancelAnimationFrame(timedMode.rafId);}

function showNextAchievement(){
  const unlocked=loadAchievements();
  const s2=calcStats();
  const ext={...s2,challenged:Object.values(state.records).filter(r=>r?.challengeCleared).length,noUndoCleared:0,editorPlayed:!!localStorage.getItem("pixelSokobanEditorPlayed"),taPlayed:state.stats.taPlayed,replayPlayed:state.stats.replayPlayed,maxCombo:state.stats.maxCombo,randomPlayed:state.stats.randomPlayed};
  const next=ACHIEVEMENTS.find(a=>!unlocked.has(a.id));
  if(!next){notify("所有成就已解锁！引领达人！","🏆");return;}
  notify(`下一成就：${next.name} - ${next.desc}`,"🎯");
}

function showGlobalRecords(){
  const entries=[];
  for(let i=0;i<LEVELS.length;i++){const r=state.records[i];if(r&&r.bestMoves)entries.push({i,name:LEVELS[i].name,moves:r.bestMoves,rank:r.bestRank,time:r.bestTimeMs});}
  entries.sort((a,b)=>a.moves-b.moves);
  let h="<div class='lb-overlay-card'><h2>全关卡记录</h2><table class='lb-table'><thead><tr><th>关</th><th>名称</th><th>步</th><th>评</th></tr></thead><tbody>";
  entries.forEach(e=>{h+=`<tr><td>L${e.i+1}</td><td>${e.name}</td><td>${e.moves}</td><td>${e.rank}</td></tr>`;});
  h+="</tbody></table><div class='controls center' style='margin-top:12px'><button id='grClose'>关闭</button></div></div>";
  const ov=document.createElement('div');ov.className='modal';ov.style.zIndex='9999';ov.innerHTML=h;
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});document.body.appendChild(ov);
  ov.querySelector('#grClose')?.addEventListener('click',()=>ov.remove());
}

// BGM beat visualizer
let beatPulse=false;
const origBgmTick=null;
function triggerBeatPulse(){
  if(!boardEl)return;
  boardEl.classList.add("beat-pulse");
  setTimeout(()=>boardEl.classList.remove("beat-pulse"),120);
}

function showCompletionTimeline(){
  const entries=[];
  for(let i=0;i<LEVELS.length;i++){const r=state.records[i];if(r?.completedAt)entries.push({i,name:LEVELS[i].name,ts:r.completedAt,rank:r.bestRank});}
  entries.sort((a,b)=>b.ts-a.ts);
  if(!entries.length){notify("还没有通关记录","📅");return;}
  let h="<div class='lb-overlay-card'><h2>通关时间线</h2><div class='timeline'>";
  entries.forEach(e=>{h+=`<div class='tl-item'><span class='tl-dot'></span><div class='tl-info'><strong>L${e.i+1} ${e.name}</strong><span>${new Date(e.ts).toLocaleDateString()}</span><span>${e.rank}</span></div></div>`;});
  h+="</div><div class='controls center' style='margin-top:12px'><button id='tlClose'>关闭</button></div></div>";
  const ov=document.createElement('div');ov.className='modal';ov.style.zIndex='9999';ov.innerHTML=h;
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});document.body.appendChild(ov);
  ov.querySelector('#tlClose')?.addEventListener('click',()=>ov.remove());
}

function previewSfx(type){audio.unlock();audio.playSfx(type);}
const SFX_LIST=[["move","移动"],["push","推笱子"],["boxOnGoal","归位"],["fail","擞墙"],["clear","过关"],["undo","撤销"],["ui","界面"],["ripple","涥漪"],["screenshot","快门"],["win3star","三星卡"],["combo","连击"],["comboEnd","连击结束"],["deadlock","死角"],["achievement","成就"]];
function showSfxPreview(){
  const ov=document.createElement("div");ov.className="modal";ov.style.zIndex="9999";
  let h="<div class='lb-overlay-card'><h2>音效试听</h2><div style='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0'>";
  SFX_LIST.forEach(([k,v])=>{h+=`<button class="sfx-preview-btn" data-sfx="${k}">🔊 ${v}</button>`;});
  h+="</div><div class='controls center' style='margin-top:12px'><button id='sfxClose'>关闭</button></div></div>";
  ov.innerHTML=h;ov.addEventListener("click",e=>{if(e.target===ov)ov.remove();});
  document.body.appendChild(ov);
  ov.querySelectorAll(".sfx-preview-btn").forEach(b=>b.addEventListener("click",()=>previewSfx(b.dataset.sfx)));
  ov.querySelector("#sfxClose")?.addEventListener("click",()=>ov.remove());
}

// Font size setting
function setFontSize(size){
  document.documentElement.style.fontSize=size+"px";
  localStorage.setItem("pixelSokobanFontSize",size);
  notify("字体大小："+size,"🔤");
}
const savedFontSize=localStorage.getItem("pixelSokobanFontSize");
if(savedFontSize)document.documentElement.style.fontSize=savedFontSize+"px";

// Solution comparison
function compareSolution(){
  if(!state.won){setMessage("先通关当前关卡再比较","warn");return;}
  const optMoves=getLevelConfig().parMoves;
  const myMoves=state.moves;
  const pct=Math.round(myMoves/optMoves*100);
  let msg=`你：${myMoves}步 | 目标：${optMoves}步 | 效率：${pct<100?pct+"%":"超过目标"}`;
  if(myMoves<=optMoves)msg+=" 🏆 达成目标步数!";
  notify(msg,myMoves<=optMoves?"🏆":"💪");
}

// Smart hint: suggest when over par
function getSmartHint(){
  const level=getLevelConfig();
  if(state.moves===0)return"先观察笱子和目标点的位置";
  if(state.pushes===0)return"找到距离目标点最近的笱子";
  if(state.moves>level.parMoves)return"尝试撤销(Z)并重新规划推笱子顺序";
  const dead=getDeadlockedBoxes();
  if(dead.length)return"有笱子进入死角，立刻撤销";
  return null;
}
function showSmartHint(){
  const msg=getSmartHint();
  if(msg)notify(msg,"🧠");
  else showHint();
}

// Level stats summary per level in stats panel
function renderLevelStats(){
  const s=calcStats();
  let h="<div class='level-stats-grid'>";
  s.perLevel.forEach(lv=>{
    const r=lv.r;
    const cleared=r&&r.bestMoves>0;
    const col=r?.bestRank==="★★★"?"var(--goal)":r?.bestRank==="★★"?"var(--accent)":r?.bestMoves>0?"var(--player)":"var(--line)";
    h+=`<div class='lsg-item' title='${lv.name}' style='background:${col}20;border-color:${col}'>`;
    h+=`<span class='lsg-num'>${lv.i+1}</span>`;
    h+=`<span class='lsg-moves'>${cleared?r.bestMoves+"步":"--"}</span>`;
    h+="</div>";
  });
  h+="</div>";
  return h;
}

function showRecentClears(){
  const r2=[];
  for(let i=0;i<LEVELS.length;i++){const r=state.records[i];if(r?.completedAt)r2.push({i,name:LEVELS[i].name,ts:r.completedAt});}
  r2.sort((a,b)=>b.ts-a.ts);const top=r2.slice(0,5);
  if(!top.length){notify("还没有通关记录","📅");return;}
  let h="<div class='lb-overlay-card'><h2>最近通关</h2><div class='replay-list'>";
  top.forEach(e=>{h+=`<div class='replay-item'><span class='replay-name'>L${e.i+1} ${e.name}</span>`;
    h+=`<span class='replay-info'>${new Date(e.ts).toLocaleDateString()}</span>`;
    h+=`<button class='replay-play-btn' data-level='${e.i}'>进入</button></div>`;});
  h+="</div><div class='controls center'><button id='rcClose'>关闭</button></div></div>";
  const ov=document.createElement('div');ov.className='modal';ov.style.zIndex='9999';ov.innerHTML=h;
  ov.querySelectorAll('[data-level]').forEach(b=>b.addEventListener('click',()=>{loadLevel(+b.dataset.level);ov.remove();}));
  ov.querySelector('#rcClose')?.addEventListener('click',()=>ov.remove());
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});document.body.appendChild(ov);
}

const CHALL_HIST_KEY="pixelSokobanChallengeHistory";
function loadChallengeHistory(){try{return JSON.parse(localStorage.getItem(CHALL_HIST_KEY)||"[]");}catch{return[];}}
function saveChallengeAttempt(li,moves,timeMs){const h=loadChallengeHistory();h.unshift({li,moves,timeMs,ts:Date.now()});localStorage.setItem(CHALL_HIST_KEY,JSON.stringify(h.slice(0,100)));}
function showChallengeHistory(){
  const h=loadChallengeHistory().slice(0,20);
  if(!h.length){notify("还没有挑战记录","📜");return;}
  let html="<div class='lb-overlay-card'><h2>挑战记录</h2><table class='lb-table'><thead><tr><th>关</th><th>步</th><th>时间</th></tr></thead><tbody>";
  h.forEach(e=>{html+=`<tr><td>L${e.li+1}</td><td>${e.moves}</td><td>${formatMs(e.timeMs)}</td></tr>`;});
  html+="</tbody></table><div class='controls center'><button id='chClose'>关闭</button></div></div>";
  const ov=document.createElement('div');ov.className='modal';ov.style.zIndex='9999';ov.innerHTML=html;
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});document.body.appendChild(ov);
  ov.querySelector('#chClose')?.addEventListener('click',()=>ov.remove());
}

// Custom key mapping
let keyBindings=JSON.parse(localStorage.getItem("pixelSokobanKeys")||"null")||{up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight"};
function getKeyMove(key){
  const lk=key.toLowerCase();
  if(key===keyBindings.up||lk==="w")return[0,-1,'up'];
  if(key===keyBindings.down||lk==="s")return[0,1,'down'];
  if(key===keyBindings.left||lk==="a")return[-1,0,'left'];
  if(key===keyBindings.right||lk==="d")return[1,0,'right'];
  return null;
}

function captureBoard(){audio.playSfx("screenshot");
  const canvas=document.createElement("canvas");
  const ts=parseInt(getComputedStyle(boardEl).getPropertyValue("--tile-size"))||48;
  const cols=Math.max(...state.grid.map(r=>r.length)),rows=state.grid.length;
  canvas.width=cols*ts+24;canvas.height=rows*ts+24;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle="#17121f";ctx.fillRect(0,0,canvas.width,canvas.height);
  const clr={"#":"#5c4b73"," ":"#3c3150",".":"#ffd166","$":"#c98f52","@":"#7ee081","*":"#efbb77","+":"#7ee081"};
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const c=(state.grid[y]||[])[x]||"";ctx.fillStyle=clr[c]||"#3c3150";ctx.fillRect(12+x*ts,12+y*ts,ts-2,ts-2);}
  const a=document.createElement("a");a.download="sokoban_L"+(state.levelIndex+1)+"_"+Date.now()+".png";
  a.href=canvas.toDataURL();a.click();
  notify("截图已保存","📷");
}

// Editor symmetric mode
editor.symmetric=false;
function editorPaintSymmetric(x,y){
  editorPaint(x,y);
  if(editor.symmetric){
    const mx=editor.cols-1-x;
    const my=editor.rows-1-y;
    if(mx!==x)editorPaint(mx,y);
    if(my!==y)editorPaint(x,my);
    if(mx!==x&&my!==y)editorPaint(mx,my);
  }
}

function showDifficultyAnalysis(){
  const data=[];
  for(let i=0;i<LEVELS.length;i++){const r=state.records[i],lv=LEVELS[i];
    if(r?.bestMoves)data.push({i,name:lv.name,ratio:r.bestMoves/lv.parMoves,moves:r.bestMoves,par:lv.parMoves});}
  data.sort((a,b)=>b.ratio-a.ratio);
  if(!data.length){notify("还没足够数据","📊");return;}
  let h="<div class='lb-overlay-card'><h2>难度分析</h2><table class='lb-table'><thead><tr><th>关</th><th>步</th><th>目</th><th>%</th></tr></thead><tbody>";
  data.slice(0,15).forEach(e=>{const col=e.ratio<=1?"#88ff88":e.ratio<=1.5?"#ffd166":"#ff79c6";
    h+=`<tr><td>L${e.i+1}</td><td>${e.moves}</td><td>${e.par}</td><td style="color:${col}">${(e.ratio*100)|0}%</td></tr>`;});
  h+="</tbody></table><div class='controls center'><button id='daClose'>关闭</button></div></div>";
  const ov=document.createElement('div');ov.className='modal';ov.style.zIndex='9999';ov.innerHTML=h;
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});document.body.appendChild(ov);
  ov.querySelector('#daClose')?.addEventListener('click',()=>ov.remove());
}

function recommendNextLevel(){
  let first=-1,bestChallenge=-1;
  for(let i=0;i<LEVELS.length;i++){const r=state.records[i];
    if(!r||!r.bestMoves){if(first===-1)first=i;continue;}
    if(!r.challengeCleared)bestChallenge=i;
  }
  if(first!==-1){const lv=LEVELS[first];
    notify(`推荐：L${first+1} ${lv.name}`,"🎯");
    if(confirm(`进入 L${first+1} ${lv.name}?`))loadLevel(first);
  } else if(bestChallenge!==-1){const lv=LEVELS[bestChallenge];
    notify(`挑战：L${bestChallenge+1} ${lv.name}`,"🔥");
    if(confirm(`尝试L${bestChallenge+1}的${lv.parMoves}步挑战?`))loadLevel(bestChallenge);
  } else notify("全部完成！🏆","🏆");
}

function printLevel(){
  const lv=getLevelConfig();
  const map=state.grid.map(r=>r.join("")).join("\n");
  const win=window.open("","_blank");
  if(!win)return;
  win.document.write(`<html><head><title>L${state.levelIndex+1} ${lv.name}</title><style>body{font-family:monospace;font-size:20px;background:#fff;color:#000}pre{border:2px solid #000;padding:16px;display:inline-block}</style></head><body><h2>L${state.levelIndex+1} ${lv.name}</h2><pre>${map}</pre><p>目标步数: ${lv.parMoves}</p></body></html>`);
  win.document.close();
  win.print();
}

// Extended win messages
const EXT_WIN_MSGS=[
  "这就是天才！","算法神人","笛子村长看了都要鼓掌",
  "小蒸山喜欢你！","仓管集团正在招聘！",
  "这抵提扳呢！","我冺了一下",
  "牛马合升呇！","殘血奔腾",
  "前方是个传奇","戒骄！我整个人霏了",
  "中华镶豏，巡视正常","大力员正在线",
];
function getWinMessage(rank,challenge){
  const pool=challenge&&rank==="★★★"?CHALLENGE_MESSAGES:[...WIN_MESSAGES,...EXT_WIN_MSGS];
  return pool[Math.floor(Math.random()*pool.length)];
}

function showSettingsPanel(){
  const ov=document.createElement("div");ov.className="modal";ov.style.zIndex="9999";
  const vol=localStorage.getItem("pixelSokobanBgmVol")||"0.22";
  const sfxVol=localStorage.getItem("pixelSokobanSfxVol")||"1";
  const lang=localStorage.getItem("pixelSokobanLang")||"zh";
  const lock=localStorage.getItem("pixelSokobanLockMode")==="1";
  let h="<div class='lb-overlay-card'><h2>快速设置</h2>";
  h+=`<div class='settings-row'><span>BGM音量</span><input type='range' min='0' max='1' step='0.05' value='${vol}' onchange='if(audio.bgmGain)audio.bgmGain.gain.value=+this.value*0.22;'></div>`;
  h+=`<div class='settings-row'><span>音效音量</span><input type='range' min='0' max='1' step='0.05' value='${sfxVol}' onchange='if(audio.sfxGain)audio.sfxGain.gain.value=+this.value;'></div>`;
  h+=`<div class='settings-row'><span>语言</span><button onclick='toggleLang()'>切换中/EN</button></div>`;
  h+=`<div class='settings-row'><span>解锁模式</span><button onclick='toggleLockMode()'>切换</button></div>`;
  h+="<div class='controls center' style='margin-top:12px'><button id='settClose'>关闭</button></div></div>";
  ov.innerHTML=h;ov.addEventListener("click",e=>{if(e.target===ov)ov.remove();});document.body.appendChild(ov);
  ov.querySelector("#settClose")?.addEventListener("click",()=>ov.remove());
}

function showAchievementWall(){
  const unlocked=loadAchievements();
  const total=ACHIEVEMENTS.length;
  const done=unlocked.size;
  let h="<div class='lb-overlay-card'>";
  h+=`<h2>勋章展示坦 ${done}/${total}</h2>`;
  h+="<div class='achiev-grid'>";
  ACHIEVEMENTS.forEach(a=>{
    const got=unlocked.has(a.id);
    h+=`<div class='achiev-item ${got?"unlocked":""}'><span class='achiev-icon'>${got?"🏅":"🔒"}</span><span class='achiev-name'>${a.name}</span><span class='achiev-desc'>${a.desc}</span></div>`;
  });
  h+="</div>";
  h+="<div class='controls center' style='margin-top:14px'><button id='awClose'>关闭</button></div></div>";
  const ov=document.createElement('div');ov.className='modal';ov.style.zIndex='9999';ov.innerHTML=h;
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});document.body.appendChild(ov);
  ov.querySelector('#awClose')?.addEventListener('click',()=>ov.remove());
}

function getAchievementProgress(a){
  const unlocked=loadAchievements();
  const s2=calcStats();
  const ext={...s2,challenged:Object.values(state.records).filter(r=>r?.challengeCleared).length,noUndoCleared:0,editorPlayed:!!localStorage.getItem("pixelSokobanEditorPlayed"),taPlayed:state.stats.taPlayed,replayPlayed:state.stats.replayPlayed,maxCombo:state.stats.maxCombo,randomPlayed:state.stats.randomPlayed};
  if(unlocked.has(a.id))return 100;
  if(a.id==="half")return Math.round(ext.cleared/15*100);
  if(a.id==="all")return Math.round(ext.cleared/30*100);
  if(a.id==="challenge5")return Math.round(ext.challenged/5*100);
  if(a.id==="stars30")return Math.round(ext.totalStars/30*100);
  if(a.id==="combo3")return Math.round(ext.maxCombo/3*100);
  if(a.id==="combo5")return Math.round(ext.maxCombo/5*100);
  return 0;
}

function renderProgressRing(pct,size,color){
  size=size||60;
  const r=size/2-6;
  const circ=2*Math.PI*r;
  const dash=circ*pct/100;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--panel-3)" stroke-width="6"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color||"var(--accent)"}" stroke-width="6"
      stroke-dasharray="${dash} ${circ}" stroke-dashoffset="${circ/4}" stroke-linecap="round"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="var(--text)" font-size="14" font-weight="bold">${pct}%</text>
  </svg>`;
}
function showProgressRings(){
  const s=calcStats();
  const pct1=Math.round(s.cleared/s.total*100);
  const pct2=Math.round(s.challenged/s.total*100);
  const pct3=Math.round(s.totalStars/(s.total*3)*100);
  const ov=document.createElement('div');ov.className='modal';ov.style.zIndex='9999';
  let h="<div class='lb-overlay-card'><h2>进度概览</h2><div class='rings-row'>";
  h+=`<div class='ring-item'>${renderProgressRing(pct1,80,'var(--accent)')}<p>通关</p></div>`;
  h+=`<div class='ring-item'>${renderProgressRing(pct2,80,'var(--goal)')}<p>挑战</p></div>`;
  h+=`<div class='ring-item'>${renderProgressRing(pct3,80,'var(--accent-2)')}<p>星级</p></div>`;
  h+="</div><div class='controls center'><button id='prgClose'>关闭</button></div></div>";
  ov.innerHTML=h;ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});document.body.appendChild(ov);
  ov.querySelector('#prgClose')?.addEventListener('click',()=>ov.remove());
}

function autoUpdateParMoves(){
  const lvIdx=state.levelIndex;
  const lv=LEVELS[lvIdx];
  if(!lv||lv.custom)return;
  setMessage("计算最优解...","info");
  setTimeout(()=>{
    const r=aiBfsSolve(lv.map.map(row=>[...row]),{x:0,y:0},state.goals);
    // rebuild grid to find player
    const grid=lv.map.map(row=>[...row]);
    let px=0,py=0;const goals=[];
    for(let y=0;y<grid.length;y++)for(let x=0;x<grid[y].length;x++){
      if("@+".includes(grid[y][x])){px=x;py=y;}
      if(".+*".includes(grid[y][x]))goals.push({x,y});
    }
    const result=aiBfsSolve(grid,{x:px,y:py},goals);
    if(result){
      lv.parMoves=result.steps.length;
      lv.starMoves={three:result.steps.length,two:Math.ceil(result.steps.length*1.3),one:Math.ceil(result.steps.length*1.7)};
      setMessage(`最优解：${result.steps.length}步`,"win");
      render();
    }
  },50);
}

function batchTestCustomLevels(){
  const custom=loadCustomLevels();
  if(!custom.length){notify("没有自定义关卡","📜");return;}
  let ok=0,fail=[];
  custom.forEach((lv,i)=>{
    const grid=lv.map.map(r=>[...r]);
    let px=0,py=0;const goals=[];
    for(let y=0;y<grid.length;y++)for(let x=0;x<grid[y].length;x++){
      if("@+".includes(grid[y][x])){px=x;py=y;}
      if(".+*".includes(grid[y][x]))goals.push({x,y});
    }
    const r=aiBfsSolve(grid,{x:px,y:py},goals);
    if(r&&r.steps)ok++;else fail.push(lv.name);
  });
  const msg=`关卡测试完成: ${ok}/${custom.length}个可解${fail.length?"，无解:「"+fail.slice(0,3).join("」「")+"」":"✓"}`;
  notify(msg,ok===custom.length?"✅":"⚠");
}

// Point system
const POINTS_KEY="pixelSokobanPoints";
function getPoints(){return Number(localStorage.getItem(POINTS_KEY)||0);}
function addPoints(p){const total=getPoints()+p;localStorage.setItem(POINTS_KEY,total);return total;}
function showPoints(){notify(`总积分：${getPoints()}分`,"💰");}

// Editor flip
function editorFlipH(){editor.grid=editor.grid.map(r=>[...r].reverse());editorSaveState();editorRender();}
function editorFlipV(){editor.grid=[...editor.grid].reverse();editorSaveState();editorRender();}
function editorRotate90(){
  const rows=editor.rows,cols=editor.cols;
  const newGrid=Array.from({length:cols},(_,x)=>Array.from({length:rows},(_,y)=>editor.grid[rows-1-y][x]));
  editor.rows=cols;editor.cols=rows;editor.grid=newGrid;
  editorSaveState();editorRender();
}

const SHOP_ITEMS=[
  {id:"neon",name:"霄光主题",cost:50,theme:{"--bg":"#050510","--panel":"#0a0a20","--accent":"#ff00ff","--goal":"#00ffff","--player":"#ff8800","--crate":"#aa00ff","--wall":"#001144"}},
  {id:"sunset",name:"日落主题",cost:80,theme:{"--bg":"#1a0500","--panel":"#2e0a00","--accent":"#ff6600","--goal":"#ffcc00","--player":"#ff3300","--crate":"#cc4400","--wall":"#330800"}},
];
SHOP_ITEMS.forEach(item=>{THEMES[item.id]=item.theme;});
function buyShopItem(id){
  const item=SHOP_ITEMS.find(i=>i.id===id);if(!item)return;
  const pts=getPoints();if(pts<item.cost){notify("积分不足","💰");return;}
  addPoints(-item.cost);localStorage.setItem("shop_"+id,"1");
  applyTheme(id);notify("已解锁"+item.name+"！","🎁");
}




let editorInlineTestMode=false;
function startEditorInlineTest(){
  if(!editorIsValid()){setMessage("关卡不合法！","warn");return;}
  const map=editorGetMapRows();
  const testLevel={name:"测试关卡",parMoves:999,starMoves:{three:999,two:9999,one:99999},map};
  LEVELS.push(testLevel);
  const idx=LEVELS.length-1;
  editorInlineTestMode=true;
  // Hide editor, show game
  document.getElementById("editorModal")?.classList.add("hidden");
  loadLevel(idx);
  notify("测试模式！按 Esc 返回编辑器","🎮");
}
function stopEditorInlineTest(){
  if(!editorInlineTestMode)return;
  editorInlineTestMode=false;
  // Remove temp level
  const lastLv=LEVELS[LEVELS.length-1];
  if(lastLv&&lastLv.name==="测试关卡")LEVELS.pop();
  document.getElementById("editorModal")?.classList.remove("hidden");
  loadLevel(Math.min(state.levelIndex,LEVELS.length-1));
  editorRender();
}
function editorFloodFill(x,y,tile){
  const target=(editor.grid[y]||[])[x];
  if(target===undefined||target===tile)return;
  const stack=[[x,y]];const visited=new Set([`${x},${y}`]);
  while(stack.length){
    const [cx,cy]=stack.pop();
    editor.grid[cy][cx]=tile;
    [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]].forEach(([nx,ny])=>{
      if(nx<0||ny<0||ny>=editor.rows||nx>=editor.cols)return;
      if(visited.has(`${nx},${ny}`))return;
      if(editor.grid[ny][nx]===target){visited.add(`${nx},${ny}`);stack.push([nx,ny]);}
    });
  }
  editorSaveState();editorRender();
}
function editorFillRect(x1,y1,x2,y2,tile){
  const minX=Math.min(x1,x2),maxX=Math.max(x1,x2);
  const minY=Math.min(y1,y2),maxY=Math.max(y1,y2);
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    if(x>=0&&x<editor.cols&&y>=0&&y<editor.rows)editor.grid[y][x]=tile||editor.activeTile;
  }
  editorSaveState();editorRender();
}
// Rect fill mode
editor.rectStart=null;
function editorRectMode(x,y){
  if(!editor.rectStart){editor.rectStart={x,y};notify("起点已设定","🟧");return;}
  editorFillRect(editor.rectStart.x,editor.rectStart.y,x,y);
  editor.rectStart=null;
}
function editorDrawLine(x1,y1,x2,y2,tile){
  // Bresenham line algorithm
  let dx=Math.abs(x2-x1),dy=Math.abs(y2-y1);
  let sx=x1<x2?1:-1,sy=y1<y2?1:-1;
  let err=dx-dy;
  while(true){
    if(x1>=0&&x1<editor.cols&&y1>=0&&y1<editor.rows)editor.grid[y1][x1]=tile||editor.activeTile;
    if(x1===x2&&y1===y2)break;
    const e2=2*err;
    if(e2>-dy){err-=dy;x1+=sx;}
    if(e2<dx){err+=dx;y1+=sy;}
  }
  editorSaveState();editorRender();
}

// Line draw mode
editor.lineStart=null;
function editorLineMode(x,y){
  if(!editor.lineStart){editor.lineStart={x,y};notify("起点已设定","📏");return;}
  editorDrawLine(editor.lineStart.x,editor.lineStart.y,x,y);
  editor.lineStart=null;
}


// Floating D-Pad
(function(){
  const toggle=document.getElementById('floatDpadToggle');
  const pad=document.getElementById('floatDpad');
  let vis=localStorage.getItem('pixelSokobanFloatDpad')==="1";
  function update(){if(pad)pad.classList.toggle('hidden',!vis);if(toggle)toggle.textContent=vis?"×":"D";localStorage.setItem('pixelSokobanFloatDpad',vis?"1":"0");}
  if(toggle)toggle.addEventListener('click',()=>{vis=!vis;update();});
  const dirMap={up:[0,-1,'up'],down:[0,1,'down'],left:[-1,0,'left'],right:[1,0,'right']};
  document.querySelectorAll('.fdpad-btn[data-dir]').forEach(btn=>{
    let iv=null;
    const fire=()=>{const m=dirMap[btn.dataset.dir];if(m){audio.unlock();tryMove(m[0],m[1],m[2]);}};
    btn.addEventListener('touchstart',(e)=>{e.preventDefault();fire();iv=setInterval(fire,200);},{passive:false});
    btn.addEventListener('touchend',()=>clearInterval(iv));
    btn.addEventListener('touchcancel',()=>clearInterval(iv));
    btn.addEventListener('click',()=>{audio.unlock();fire();});
  });
  update();
})();

// Step comparison float on win
function showStepCompareFloat(myMoves,parMoves,rank){
  const shell=document.querySelector(".game-shell");if(!shell)return;
  const el=document.createElement("div");el.className="step-compare-float";
  const diff=myMoves-parMoves;
  const diffStr=diff<=0?`-${Math.abs(diff)}步`:diff===0?"目标步数":`+${diff}步`;
  const col=diff<0?"var(--player)":diff===0?"var(--goal)":"var(--muted)";
  el.innerHTML=`<span style="color:${col}">${diffStr}</span> <span class="scf-rank">${rank}</span>`;
  shell.appendChild(el);
  el.style.animation="stepCompareFly 2s ease-out forwards";
  setTimeout(()=>el.remove(),2100);
}


function playCelebrationSequence(){
  const cols=Math.max(...state.grid.map(r=>r.length));
  state.goals.forEach(({x,y},i)=>{
    setTimeout(()=>{
      const idx=y*cols+x;
      const tile=boardEl.querySelectorAll('.tile')[idx];
      if(tile){tile.classList.add('win-flash');setTimeout(()=>tile.classList.remove('win-flash'),300);}
    },i*120);
  });
}

function haptic(type){
  if(!navigator.vibrate)return;
  if(type==="move")navigator.vibrate(8);
  else if(type==="push")navigator.vibrate(20);
  else if(type==="fail")navigator.vibrate([30,10,30]);
  else if(type==="win")navigator.vibrate([50,30,50,30,100]);
}
function showGoalRipple(x,y){
  const cols=Math.max(...state.grid.map(r=>r.length));
  const tiles=boardEl.querySelectorAll('.tile');
  const idx=y*cols+x;
  const tile=tiles[idx];if(!tile)return;
  const rect=tile.getBoundingClientRect();
  const el=document.createElement('div');
  el.className='goal-ripple';
  el.style.left=rect.left+rect.width/2+'px';
  el.style.top=rect.top+rect.height/2+'px';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),700);
}

function renderStepsBarChart(){
  const data=[];
  for(let i=0;i<Math.min(LEVELS.length,30);i++){
    const r=state.records[i],lv=LEVELS[i];
    data.push({i,par:lv.parMoves,best:r?.bestMoves||0,name:lv.name});
  }
  const maxV=Math.max(...data.map(d=>Math.max(d.par,d.best||d.par)));
  const w=data.length*14,h=80;
  let svg=`<div class="steps-chart-wrap"><h3>最优步数对比 (L1-30)</h3><svg viewBox="0 0 ${w} ${h+16}" style="width:100%;height:100px">`; 
  data.forEach((d,i)=>{
    const parH=Math.round(d.par/maxV*h);
    const bestH=d.best?Math.round(d.best/maxV*h):0;
    const x=i*14+1;
    const col=!d.best?"#333":d.best<=d.par?"#88ff88":d.best<=d.par*1.3?"#ffd166":"#ff79c6";
    svg+=`<rect x="${x}" y="${h-parH}" width="6" height="${parH}" fill="#56406f" rx="1" opacity="0.6"/>`;
    if(d.best)svg+=`<rect x="${x+1}" y="${h-bestH}" width="4" height="${bestH}" fill="${col}" rx="1"/>`;
  });
  svg+=`<line x1="0" y1="${h}" x2="${w}" y2="${h}" stroke="var(--line)" stroke-width="1"/></svg>`;
  svg+="<p style='font-size:0.68rem;color:var(--muted);margin:4px 0'><span style='color:#56406f'>■</span> 目标步数 &nbsp; <span style='color:#88ff88'>■</span>达标 <span style='color:#ffd166'>■</span>+30% <span style='color:#ff79c6'>■</span>超出</p></div>";
  return svg;
}

// Daily step challenge
function getDailyStepChallenge(){
  const lvIdx=getDailyChallenge();
  const lv=LEVELS[lvIdx];
  const today=new Date().toLocaleDateString();
  const hash=today.split("/").reduce((a,b)=>a*7+Number(b),0);
  const mult=[0.8,0.85,0.9,0.95,1.0][Math.abs(hash)%5];
  return{levelIndex:lvIdx,name:lv.name,parMoves:lv.parMoves,limit:Math.max(lv.parMoves,Math.ceil(lv.parMoves*mult))};
}
function showDailyStepChallenge(){
  const ch=getDailyStepChallenge();
  const saved=localStorage.getItem("pixelSokobanDailyStep");
  const today=new Date().toLocaleDateString();
  const done=saved===today;
  const msg=done?`今日步数挑战已完成！`:    `今日挑战：L${ch.levelIndex+1} ${ch.name}，在 ${ch.limit} 步内通关`;
  if(!done&&confirm(msg+"\n开始?"))loadLevel(ch.levelIndex);
  else if(done)notify(msg,"✅");
}
// Track daily step challenge completion
function checkDailyStepChallengeComplete(){
  const ch=getDailyStepChallenge();
  if(state.levelIndex!==ch.levelIndex||!state.won)return;
  if(state.moves<=ch.limit){
    const today=new Date().toLocaleDateString();
    localStorage.setItem("pixelSokobanDailyStep",today);
    notify("每日步数挑战完成！","🌟");
  }
}

function renderActivityCalendar(){
  // Collect completion dates from records
  const dates=new Set();
  for(let i=0;i<LEVELS.length;i++){
    const r=state.records[i];
    if(r?.completedAt){
      dates.add(new Date(r.completedAt).toLocaleDateString());
    }
  }
  if(dates.size===0)return "";
  // Build last 12 weeks (84 days) calendar
  const today=new Date();today.setHours(0,0,0,0);
  const days=[];
  for(let i=83;i>=0;i--){
    const d=new Date(today);d.setDate(d.getDate()-i);
    days.push({date:d.toLocaleDateString(),day:d.getDay()});
  }
  let h="<div class='activity-calendar'><h3>游玩日历 (近12周)</h3>";
  h+="<div class='cal-grid'>";
  days.forEach(d=>{
    const active=dates.has(d.date);
    h+=`<div class='cal-cell ${active?"active":""}' title='${d.date}'>\u200b</div>`;
  });
  h+="</div>";
  h+=`<p class='cal-legend'>${dates.size} 天有记录</p></div>`;
  return h;
}

// Editor keyboard shortcuts
(function(){
  document.addEventListener("keydown",(ev)=>{
    const modal=document.getElementById("editorModal");
    if(!modal||modal.classList.contains("hidden"))return;
    if(ev.ctrlKey&&ev.key==="z"){ev.preventDefault();editorUndo();return;}
    if(ev.ctrlKey&&(ev.key==="y"||ev.key==="Y")){ev.preventDefault();editorRedo();return;}
    if(ev.key==="Delete"||ev.key==="Backspace"){
      // Clear all non-wall cells
      ev.preventDefault();
      editorInitGrid(editor.rows,editor.cols,false);
      editorSaveState();editorRender();
    }
  });
})();

// SW update detection
(function(){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./sw.js").then(reg=>{
      reg.addEventListener("updatefound",()=>{
        const nw=reg.installing;
        nw?.addEventListener("statechange",()=>{
          if(nw.state==="installed"&&navigator.serviceWorker.controller){
            notify("游戏已更新！点击刺新","🔄");
          }
        });
      });
    }).catch(()=>{});
  }
})();

// Pinch-to-zoom
(function(){
  let lastDist=0;
  function dist(t){const dx=t[0].clientX-t[1].clientX,dy=t[0].clientY-t[1].clientY;return Math.sqrt(dx*dx+dy*dy);}
  boardEl.addEventListener('touchstart',(e)=>{if(e.touches.length===2)lastDist=dist(e.touches);},{passive:true});
  boardEl.addEventListener('touchmove',(e)=>{
    if(e.touches.length!==2||!lastDist)return;
    const d=dist(e.touches);const delta=d-lastDist;
    if(Math.abs(delta)>3){zoomBoard(delta>0?4:-4);lastDist=d;}
  },{passive:true});
  boardEl.addEventListener('touchend',()=>{lastDist=0;},{passive:true});
})();

function pixelBurst(x,y,color){
  const ts=parseInt(getComputedStyle(boardEl).getPropertyValue('--tile-size')||48);
  const cols=Math.max(...state.grid.map(r=>r.length));
  const tile=boardEl.querySelectorAll('.tile')[y*cols+x];if(!tile)return;
  const rect=tile.getBoundingClientRect();
  const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
  for(let i=0;i<8;i++){
    const el=document.createElement('div');
    el.className='pixel-burst';
    const angle=i*45*Math.PI/180;
    const speed=30+Math.random()*40;
    el.style.cssText=`position:fixed;left:${cx}px;top:${cy}px;background:${color||"var(--goal)"};--tx:${Math.cos(angle)*speed}px;--ty:${Math.sin(angle)*speed}px`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),700);
  }
}

function showPathVisualization(){
  const cols=Math.max(...state.grid.map(r=>r.length));
  const visited=new Map();
  // Reconstruct from history
  state.history.forEach((snap,step)=>{
    const key=`${snap.player.x},${snap.player.y}`;
    if(!visited.has(key))visited.set(key,{x:snap.player.x,y:snap.player.y,first:step});
  });
  const tiles=boardEl.querySelectorAll('.tile');
  visited.forEach(({x,y,first})=>{
    const idx=y*cols+x;
    const tile=tiles[idx];
    if(tile&&!tile.classList.contains('wall')){
      const opacity=Math.max(0.2,1-first/Math.max(state.moves,1));
      tile.style.outline=`2px solid rgba(139,233,253,${opacity})`;
    }
  });
  setTimeout(()=>boardEl.querySelectorAll('.tile').forEach(t=>t.style.outline=''),3000);
  notify(`路径可视化：经过 ${visited.size} 个格子`,'🗺');
}
function playPixelBurstAll(){
  const colors=["#ffd166","#8be9fd","#ff79c6","#7ee081","#ffb86c"];
  state.goals.forEach(({x,y},i)=>setTimeout(()=>pixelBurst(x,y,colors[i%colors.length]),i*100));
}

// Animated counter for win modal
function animateCounter(el,from,to,duration){
  if(!el)return;
  const start=performance.now();
  const tick=()=>{
    const p=Math.min(1,(performance.now()-start)/duration);
    const v=Math.round(from+(to-from)*p);
    el.textContent=String(v);
    if(p<1)requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Portrait orientation warning for mobile
(function(){
  function checkOrientation(){
    if(!navigator.maxTouchPoints)return;
    const isPortrait=window.innerHeight>window.innerWidth;
    let el=document.getElementById('orientWarning');
    if(isPortrait&&!el){
      el=document.createElement('div');el.id='orientWarning';el.className='orient-warn';
      el.textContent='建议横屏游玩，或站立使用大屏幕。';
      document.body.appendChild(el);
    } else if(!isPortrait&&el){el.remove();}
  }
  window.addEventListener('resize',checkOrientation);
  checkOrientation();
})();

function generateShareCard(rank,moves,levelName,timeMs){
  const canvas=document.createElement('canvas');
  canvas.width=400;canvas.height=220;
  const ctx=canvas.getContext('2d');
  const bg=ctx.createLinearGradient(0,0,400,220);
  bg.addColorStop(0,'#17121f');bg.addColorStop(1,'#2d2140');
  ctx.fillStyle=bg;ctx.fillRect(0,0,400,220);
  ctx.strokeStyle='#8be9fd';ctx.lineWidth=3;
  ctx.strokeRect(4,4,392,212);
  ctx.fillStyle='#8be9fd';ctx.font='bold 14px monospace';
  ctx.fillText('PIXEL SOKOBAN',20,32);
  ctx.fillStyle='#f6f1ff';ctx.font='bold 22px sans-serif';
  ctx.fillText(levelName.slice(0,16),20,70);
  const starColors={"★★★":"#ffd166","★★":"#8be9fd","★":"#7ee081"};
  ctx.fillStyle=starColors[rank]||"#888";
  ctx.font='bold 28px serif';ctx.fillText(rank,20,112);
  ctx.fillStyle='#d6c8ef';ctx.font='15px monospace';
  ctx.fillText(`${moves} 步`,20,150);
  if(timeMs)ctx.fillText(formatMs(timeMs),20,175);
  ctx.fillStyle='#56406f';ctx.font='11px monospace';
  ctx.fillText(new Date().toLocaleDateString(),20,205);
  return canvas;
}

function getAdaptiveDifficulty(){
  const s=calcStats();
  const pct=s.cleared/s.total;
  const avgRatio=s.perLevel.filter(l=>l.r?.bestMoves).reduce((a,l)=>a+(l.r.bestMoves/l.par),0)/(s.cleared||1);
  let level,icon;
  if(pct<0.2){level="新手";icon="🐣";}
  else if(pct<0.5||avgRatio>1.5){level="进阶";icon="👷";}
  else if(pct<0.8||avgRatio>1.2){level="达人";icon="🧑";}
  else{level="大师";icon="👑";}
  return{level,icon,pct:Math.round(pct*100),avgRatio:Math.round(avgRatio*100)/100};
}
function showAdaptiveAdvice(){
  const d=getAdaptiveDifficulty();
  const next=LEVELS.findIndex((_,i)=>!state.records[i]?.bestMoves);
  let msg=`${d.icon} 您的水平：${d.level}（通关率${d.pct}%）`;
  if(next>=0)msg+=" 建议 L"+(next+1)+" "+LEVELS[next].name;
  if(d.avgRatio<1)msg+=" 🏆 效率很高！";
  notify(msg,d.icon);
}

// Push-only challenge mode
let pushOnlyMode=false;
function togglePushOnly(){
  pushOnlyMode=!pushOnlyMode;
  const btn=document.getElementById('pushOnlyBtn');
  if(btn)btn.classList.toggle('active',pushOnlyMode);
  notify(pushOnlyMode?"纯推笱模式：每步必须推笱子！":"普通模式",pushOnlyMode?"📦":"🚶");
}

// Multi-tab sync
window.addEventListener('storage',(e)=>{
  if(e.key==='pixelSokobanRecords'){
    const newRecords=JSON.parse(e.newValue||'{}');
    if(newRecords.levels)state.records=newRecords.levels;
    else if(typeof newRecords==='object')state.records=newRecords;
    renderProgress();
  }
});

function randomChallenge(){
  const uncleared=LEVELS.map((_,i)=>i).filter(i=>!state.records[i]?.bestMoves);
  const pool=uncleared.length>0?uncleared:LEVELS.map((_,i)=>i);
  const idx=pool[Math.floor(Math.random()*pool.length)];
  const lv=LEVELS[idx];
  if(confirm(`随机挑战：L${idx+1} ${lv.name}?`))loadLevel(idx);
}

// Undo limit mode
let undoLimit=-1; // -1 = unlimited
let undoUsed=0;
function setUndoLimit(n){
  undoLimit=n;undoUsed=0;
  const btn=document.getElementById('undoLimitBtn');
  if(btn)btn.textContent=n<0?"标准":"撤销"+n+"次";
  notify(n<0?"不限撤销次数":"每关只允许撤销 "+n+" 次","🔄");
}
// Reset undo counter on loadLevel

function renderSpeedLeaderboard(){
  const entries=[];
  for(let i=0;i<LEVELS.length;i++){
    const r=state.records[i];if(!r?.bestMoves)continue;
    const eff=Math.round(LEVELS[i].parMoves/r.bestMoves*100);
    entries.push({i,name:LEVELS[i].name,moves:r.bestMoves,par:LEVELS[i].parMoves,eff});
  }
  entries.sort((a,b)=>b.eff-a.eff);
  if(!entries.length){notify("还没记录","📊");return;}
  let h="<div class='lb-overlay-card'><h2>效率排行</h2><table class='lb-table'><thead><tr><th>#</th><th>关</th><th>步</th><th>目标</th><th>效率</th></tr></thead><tbody>";
  entries.slice(0,20).forEach((e,i)=>{const col=e.eff>=100?"var(--player)":e.eff>=80?"var(--goal)":"var(--muted)";h+=`<tr><td>${i+1}</td><td>L${e.i+1} ${e.name}</td><td>${e.moves}</td><td>${e.par}</td><td style="color:${col}">${e.eff}%</td></tr>`;});
  h+="</tbody></table><div class='controls center'><button id='effClose'>关闭</button></div></div>";
  const ov=document.createElement('div');ov.className='modal';ov.style.zIndex='9999';ov.innerHTML=h;
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});document.body.appendChild(ov);
  ov.querySelector('#effClose')?.addEventListener('click',()=>ov.remove());
}
