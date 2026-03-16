// ─── 游戏状态机 Game State Machine ───────────────────────────────────────────
// 明确的状态转换，防止非法状态

export type GameScreen =
  | 'loading'
  | 'menu'
  | 'playing'
  | 'won'
  | 'levelSelect'
  | 'editor'
  | 'settings'
  | 'stats'
  | 'race'
  | 'speedrun'
  | 'tutorial';

export type GameEvent =
  | 'start' | 'load_level' | 'win' | 'next_level'
  | 'open_select' | 'close_select'
  | 'open_editor' | 'close_editor'
  | 'open_settings' | 'close_settings'
  | 'open_stats' | 'close_stats'
  | 'start_race' | 'end_race'
  | 'start_speedrun' | 'end_speedrun'
  | 'start_tutorial' | 'end_tutorial'
  | 'back_to_menu';

type TransitionMap = Partial<Record<GameScreen, Partial<Record<GameEvent, GameScreen>>>>;

const TRANSITIONS: TransitionMap = {
  loading: {
    start: 'menu',
  },
  menu: {
    load_level:     'playing',
    open_select:    'levelSelect',
    open_editor:    'editor',
    open_settings:  'settings',
    open_stats:     'stats',
    start_tutorial: 'tutorial',
    start_speedrun: 'speedrun',
    start_race:     'race',
  },
  playing: {
    win:            'won',
    open_select:    'levelSelect',
    open_editor:    'editor',
    open_settings:  'settings',
    open_stats:     'stats',
    back_to_menu:   'menu',
  },
  won: {
    next_level:     'playing',
    load_level:     'playing',
    open_select:    'levelSelect',
    back_to_menu:   'menu',
  },
  levelSelect: {
    load_level:     'playing',
    close_select:   'playing',
    back_to_menu:   'menu',
  },
  editor: {
    close_editor:   'playing',
    back_to_menu:   'menu',
  },
  settings: {
    close_settings: 'playing',
    back_to_menu:   'menu',
  },
  stats: {
    close_stats:    'playing',
    back_to_menu:   'menu',
  },
  race: {
    end_race:       'menu',
  },
  speedrun: {
    end_speedrun:   'menu',
  },
  tutorial: {
    end_tutorial:   'playing',
  },
};

type ScreenListener = (from: GameScreen, to: GameScreen, event: GameEvent) => void;

export class GameStateMachine {
  private current: GameScreen = 'loading';
  private listeners: ScreenListener[] = [];
  private history: GameScreen[] = [];

  get screen(): GameScreen { return this.current; }

  dispatch(event: GameEvent): boolean {
    const next = TRANSITIONS[this.current]?.[event];
    if (!next) {
      console.warn(`[FSM] Invalid transition: ${this.current} + ${event}`);
      return false;
    }
    const from = this.current;
    this.history.push(from);
    if (this.history.length > 20) this.history.shift();
    this.current = next;
    this.listeners.forEach(fn => fn(from, next, event));
    return true;
  }

  onTransition(fn: ScreenListener): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  canDispatch(event: GameEvent): boolean {
    return !!(TRANSITIONS[this.current]?.[event]);
  }

  back(): boolean {
    const prev = this.history.pop();
    if (!prev) return false;
    const from = this.current;
    this.current = prev;
    this.listeners.forEach(fn => fn(from, prev, 'back_to_menu'));
    return true;
  }

  is(screen: GameScreen): boolean { return this.current === screen; }
}

export const gameFSM = new GameStateMachine();
