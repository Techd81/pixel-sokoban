// ─── 撤销树系统 Undo Tree ─────────────────────────────────────────────────────
// 支持分支撤销，像 vim undotree 一样可视化历史分支

export interface UndoNode {
  id: number;
  parentId: number | null;
  grid: string[][];
  player: { x: number; y: number };
  moves: number;
  description: string;  // '↑ 移动' / '→ 推箱'
  children: number[];
  timestamp: number;
}

export class UndoTree {
  private nodes: Map<number, UndoNode> = new Map();
  private currentId = 0;
  private nextId = 1;

  init(grid: string[][], player: { x: number; y: number }): void {
    this.nodes.clear();
    this.nodes.set(0, { id:0, parentId:null, grid:grid.map(r=>[...r]), player:{...player}, moves:0, description:'开始', children:[], timestamp:Date.now() });
    this.currentId = 0; this.nextId = 1;
  }

  push(grid: string[][], player: { x: number; y: number }, moves: number, desc: string): void {
    const node: UndoNode = { id:this.nextId, parentId:this.currentId, grid:grid.map(r=>[...r]), player:{...player}, moves, description:desc, children:[], timestamp:Date.now() };
    const parent = this.nodes.get(this.currentId);
    if (parent) parent.children.push(this.nextId);
    this.nodes.set(this.nextId, node);
    this.currentId = this.nextId++;
  }

  undo(): UndoNode | null {
    const cur = this.nodes.get(this.currentId);
    if (!cur || cur.parentId === null) return null;
    this.currentId = cur.parentId;
    return this.nodes.get(this.currentId) || null;
  }

  redo(): UndoNode | null {
    const cur = this.nodes.get(this.currentId);
    if (!cur || cur.children.length === 0) return null;
    this.currentId = cur.children[cur.children.length-1];
    return this.nodes.get(this.currentId) || null;
  }

  getCurrent(): UndoNode | null { return this.nodes.get(this.currentId) || null; }
  getDepth(): number {
    let d = 0, id: number|null = this.currentId;
    while (id !== null) { d++; id = this.nodes.get(id)?.parentId ?? null; }
    return d;
  }
  getSize(): number { return this.nodes.size; }
}
