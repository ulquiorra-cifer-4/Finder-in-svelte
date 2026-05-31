// ─────────────────────────────────────────────────────────────
//  lib/trash.ts
//  Separate store for the Trash bin.
//  Completely decoupled from FinderFS — items are moved here
//  on delete and either restored or permanently wiped.
// ─────────────────────────────────────────────────────────────

import type { FSNode, TrashEntry } from "../types/fs";

const TRASH_KEY = "macos_trash_v1";

export class TrashStore {
  private items: TrashEntry[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.items = this.load();
  }

  // ── Persistence ─────────────────────────────────────────────

  private load(): TrashEntry[] {
    try {
      const raw = localStorage.getItem(TRASH_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(TRASH_KEY, JSON.stringify(this.items));
    } catch { /* storage full */ }
    this.listeners.forEach(fn => fn());
  }

  subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  // ── Read ─────────────────────────────────────────────────────

  getItems(): TrashEntry[] {
    return [...this.items].sort((a, b) => b.deletedAt - a.deletedAt);
  }

  getCount(): number {
    return this.items.length;
  }

  getTotalSize(): number {
    return this.items.reduce((sum, item) => sum + (item.size ?? 0), 0);
  }

  // ── Write ─────────────────────────────────────────────────────

  add(node: FSNode): void {
    this.items.push({
      ...node,
      deletedAt: Date.now(),
      originalParentId: node.parentId,
    });
    this.persist();
  }

  // Remove from trash and return the entry so FinderFS can re-add it
  restore(id: string): TrashEntry | null {
    const item = this.items.find(i => i.id === id);
    if (!item) return null;
    this.items = this.items.filter(i => i.id !== id);
    this.persist();
    return item;
  }

  // Permanent delete from trash
  remove(id: string): void {
    this.items = this.items.filter(i => i.id !== id);
    this.persist();
  }

  empty(): void {
    this.items = [];
    this.persist();
  }
}
