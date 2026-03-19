// ─── 关卡收藏夹与标签系统 Favorites & Tags ───────────────────────────────────

export type TagColor = '#ff6b6b' | '#ffd166' | '#06d6a0' | '#8be9fd' | '#ff79c6' | '#bd93f9';

export interface LevelTag {
  id: string;
  label: string;
  color: TagColor;
}

const DEFAULT_TAGS: LevelTag[] = [
  { id: 'fav',       label: '⭐ 收藏',   color: '#ffd166' },
  { id: 'hard',      label: '💀 难',     color: '#ff6b6b' },
  { id: 'practice',  label: '🔁 练习',   color: '#8be9fd' },
  { id: 'done',      label: '✅ 完成',   color: '#06d6a0' },
  { id: 'skip',      label: '⏭ 跳过',   color: '#bd93f9' },
];

const TAGS_KEY    = 'sokoban_tags_def';
const LEVEL_TAGS_KEY = 'sokoban_level_tags';

export function loadTags(): LevelTag[] {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_TAGS;
  } catch { return DEFAULT_TAGS; }
}

export function saveTags(tags: LevelTag[]): void {
  try { localStorage.setItem(TAGS_KEY, JSON.stringify(tags)); } catch { }
}

// levelTags: { [levelIndex]: string[] (tag ids) }
type LevelTagsMap = Record<number, string[]>;

let _levelTagsCache: LevelTagsMap | null = null;

export function loadLevelTags(): LevelTagsMap {
  if (_levelTagsCache) return _levelTagsCache;
  try {
    const raw = localStorage.getItem(LEVEL_TAGS_KEY);
    _levelTagsCache = raw ? JSON.parse(raw) : {};
    return _levelTagsCache;
  } catch { return {}; }
}

export function saveLevelTags(map: LevelTagsMap): void {
  _levelTagsCache = map; // 更新缓存
  try { localStorage.setItem(LEVEL_TAGS_KEY, JSON.stringify(map)); } catch { }
}

export function toggleLevelTag(levelIndex: number, tagId: string): boolean {
  const map = loadLevelTags();
  const tags = map[levelIndex] ?? [];
  const idx = tags.indexOf(tagId);
  if (idx >= 0) tags.splice(idx, 1);
  else tags.push(tagId);
  map[levelIndex] = tags;
  saveLevelTags(map);
  return idx < 0; // true = added
}

export function getLevelTags(levelIndex: number): string[] {
  return loadLevelTags()[levelIndex] ?? [];
}

export function isFavorite(levelIndex: number): boolean {
  return getLevelTags(levelIndex).includes('fav');
}

export function toggleFavorite(levelIndex: number): boolean {
  return toggleLevelTag(levelIndex, 'fav');
}

export function getFavorites(): number[] {
  const map = loadLevelTags();
  return Object.entries(map)
    .filter(([, tags]) => tags.includes('fav'))
    .map(([i]) => Number(i))
    .sort((a, b) => a - b);
}

export function filterLevelsByTag(tagId: string): number[] {
  const map = loadLevelTags();
  return Object.entries(map)
    .filter(([, tags]) => tags.includes(tagId))
    .map(([i]) => Number(i))
    .sort((a, b) => a - b);
}
