// ─── 国际化系统 i18n ─────────────────────────────────────────────────────────

export type Locale = 'zh-CN' | 'en-US' | 'ja-JP';

export type TranslationKey =
  | 'game.title' | 'game.subtitle'
  | 'ui.moves' | 'ui.pushes' | 'ui.time' | 'ui.best' | 'ui.par'
  | 'ui.undo' | 'ui.restart' | 'ui.hint' | 'ui.prev' | 'ui.next'
  | 'ui.levelSelect' | 'ui.share' | 'ui.settings'
  | 'msg.won' | 'msg.newRecord' | 'msg.deadlock' | 'msg.hint'
  | 'msg.undo' | 'msg.restart' | 'msg.loading'
  | 'difficulty.beginner' | 'difficulty.easy' | 'difficulty.medium'
  | 'difficulty.hard' | 'difficulty.expert'
  | 'achievement.unlocked'
  | 'daily.title' | 'daily.completed' | 'daily.streak';

type Translations = Record<TranslationKey, string>;

const ZH_CN: Translations = {
  'game.title':           '像素推箱子',
  'game.subtitle':        '把所有木箱推进发光目标点',
  'ui.moves':             '步数',
  'ui.pushes':            '推箱',
  'ui.time':              '时间',
  'ui.best':              '最佳',
  'ui.par':               '目标',
  'ui.undo':              '撤销',
  'ui.restart':           '重开',
  'ui.hint':              '提示',
  'ui.prev':              '上一关',
  'ui.next':              '下一关',
  'ui.levelSelect':       '选关',
  'ui.share':             '分享',
  'ui.settings':          '设置',
  'msg.won':              '通关！',
  'msg.newRecord':        '新纪录！',
  'msg.deadlock':         '死局！按R重置',
  'msg.hint':             '提示箭头已显示',
  'msg.undo':             '已撤销',
  'msg.restart':          '已重置',
  'msg.loading':          '加载中...',
  'difficulty.beginner':  '入门',
  'difficulty.easy':      '简单',
  'difficulty.medium':    '中等',
  'difficulty.hard':      '困难',
  'difficulty.expert':    '极难',
  'achievement.unlocked': '成就解锁',
  'daily.title':          '今日挑战',
  'daily.completed':      '今日完成',
  'daily.streak':         '连续天数',
};

const EN_US: Translations = {
  'game.title':           'Pixel Sokoban',
  'game.subtitle':        'Push all boxes to the glowing targets',
  'ui.moves':             'Moves',
  'ui.pushes':            'Pushes',
  'ui.time':              'Time',
  'ui.best':              'Best',
  'ui.par':               'Par',
  'ui.undo':              'Undo',
  'ui.restart':           'Restart',
  'ui.hint':              'Hint',
  'ui.prev':              'Prev',
  'ui.next':              'Next',
  'ui.levelSelect':       'Levels',
  'ui.share':             'Share',
  'ui.settings':          'Settings',
  'msg.won':              'Level Clear!',
  'msg.newRecord':        'New Record!',
  'msg.deadlock':         'Deadlock! Press R to reset',
  'msg.hint':             'Hint arrow shown',
  'msg.undo':             'Undone',
  'msg.restart':          'Restarted',
  'msg.loading':          'Loading...',
  'difficulty.beginner':  'Beginner',
  'difficulty.easy':      'Easy',
  'difficulty.medium':    'Medium',
  'difficulty.hard':      'Hard',
  'difficulty.expert':    'Expert',
  'achievement.unlocked': 'Achievement Unlocked',
  'daily.title':          'Daily Challenge',
  'daily.completed':      'Completed Today',
  'daily.streak':         'Day Streak',
};

const JA_JP: Translations = {
  'game.title':           'ピクセル倉庫番',
  'game.subtitle':        '箱を光る目標に押し込め',
  'ui.moves':             '手数',
  'ui.pushes':            '押し',
  'ui.time':              '時間',
  'ui.best':              '最高',
  'ui.par':               '目標',
  'ui.undo':              '元に戻す',
  'ui.restart':           'やり直し',
  'ui.hint':              'ヒント',
  'ui.prev':              '前へ',
  'ui.next':              '次へ',
  'ui.levelSelect':       'ステージ',
  'ui.share':             '共有',
  'ui.settings':          '設定',
  'msg.won':              'クリア！',
  'msg.newRecord':        '新記録！',
  'msg.deadlock':         'デッドロック！Rでリセット',
  'msg.hint':             'ヒント矢印表示',
  'msg.undo':             '元に戻した',
  'msg.restart':          'リセット',
  'msg.loading':          '読み込み中...',
  'difficulty.beginner':  '入門',
  'difficulty.easy':      '簡単',
  'difficulty.medium':    '普通',
  'difficulty.hard':      '難しい',
  'difficulty.expert':    '超難',
  'achievement.unlocked': '実績解除',
  'daily.title':          '今日の挑戦',
  'daily.completed':      '本日完了',
  'daily.streak':         '連続日数',
};

const LOCALES: Record<Locale, Translations> = { 'zh-CN': ZH_CN, 'en-US': EN_US, 'ja-JP': JA_JP };

let currentLocale: Locale = 'zh-CN';

export function initI18n(): void {
  const saved = localStorage.getItem('sokoban_locale') as Locale | null;
  const browser = navigator.language as Locale;
  currentLocale = saved || (LOCALES[browser] ? browser : 'zh-CN');
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  localStorage.setItem('sokoban_locale', locale);
}

export function t(key: TranslationKey): string {
  return LOCALES[currentLocale]?.[key] ?? LOCALES['zh-CN'][key] ?? key;
}

export function getLocale(): Locale { return currentLocale; }

export function getAvailableLocales(): Locale[] {
  return Object.keys(LOCALES) as Locale[];
}
