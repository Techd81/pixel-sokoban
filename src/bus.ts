// ─── 游戏事件总线 Event Bus ───────────────────────────────────────────────────
// 类型安全的发布/订阅系统，解耦模块间通信

export type GameEventMap = {
  'level:load':      { index: number; name: string };
  'level:won':       { index: number; moves: number; timeMs: number; rank: string };
  'level:restart':   { index: number };
  'player:move':     { dx: number; dy: number; facing: string; x: number; y: number };
  'player:push':     { from: {x:number;y:number}; to: {x:number;y:number} };
  'player:undo':     { movesLeft: number };
  'combo:update':    { count: number; x: number; y: number };
  'hint:show':       { arrow: string; boxX: number; boxY: number };
  'ai:start':        { levelIndex: number };
  'ai:done':         { steps: number };
  'ai:step':         { stepIndex: number; total: number };
  'theme:change':    { from: string; to: string };
  'skin:change':     { from: string; to: string };
  'achievement:unlock': { id: string; name: string; tier: string };
  'daily:complete':  { moves: number; timeMs: number };
  'race:start':      Record<string, never>;
  'race:win':        { winner: 1 | 2; moves: number; timeMs: number };
  'save:write':      { slot: number };
  'save:read':       { slot: number };
  'config:change':   { key: string; value: unknown };
  'error':           { message: string; code?: string };
};

type EventHandler<T> = (data: T) => void;
type AnyHandler = (data: unknown) => void;

class EventBus {
  private handlers = new Map<string, Set<AnyHandler>>();

  on<K extends keyof GameEventMap>(event: K, handler: EventHandler<GameEventMap[K]>): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    const h = handler as AnyHandler;
    this.handlers.get(event)!.add(h);
    return () => this.off(event, handler);
  }

  once<K extends keyof GameEventMap>(event: K, handler: EventHandler<GameEventMap[K]>): void {
    const unsub = this.on(event, (data) => { handler(data); unsub(); });
  }

  off<K extends keyof GameEventMap>(event: K, handler: EventHandler<GameEventMap[K]>): void {
    this.handlers.get(event)?.delete(handler as AnyHandler);
  }

  emit<K extends keyof GameEventMap>(event: K, data: GameEventMap[K]): void {
    this.handlers.get(event)?.forEach(h => h(data));
  }

  clear(event?: keyof GameEventMap): void {
    if (event) this.handlers.delete(event);
    else this.handlers.clear();
  }
}

export const bus = new EventBus();
