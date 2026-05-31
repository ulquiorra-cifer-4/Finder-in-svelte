// ─────────────────────────────────────────────────────────────
//  stores/index.ts
//  Svelte reactive stores that wrap FinderFS and TrashStore.
//
//  Because FinderFS has its own listener system, we bridge it
//  into Svelte's writable() so that components re-render on
//  any filesystem change without manual subscriptions.
// ─────────────────────────────────────────────────────────────

import { writable, derived, get } from "svelte/store";
import { FinderFS } from "../lib/fs";
import { TrashStore } from "../lib/trash";
import type { FSNode, ViewMode } from "../types/fs";

// ── Singleton instances ─────────────────────────────────────
//  One instance per app — components import the stores, not
//  the classes directly.
export const fs    = new FinderFS();
export const trash = new TrashStore();

// ── Reactive tick store ─────────────────────────────────────
//  Both FS and Trash fire their listeners on mutation.
//  We convert those callbacks into a Svelte writable tick
//  counter so components re-derive data automatically.
const fsTick    = writable(0);
const trashTick = writable(0);

fs.subscribe(()    => fsTick.update(n => n + 1));
trash.subscribe(() => trashTick.update(n => n + 1));

// ── Navigation state ─────────────────────────────────────────
export const currentFolderId = writable<string | null>(null);
export const viewMode        = writable<ViewMode>("icons");
export const showPreview     = writable(false);
export const selectedIds     = writable<Set<string>>(new Set());
export const searchQuery     = writable("");

// Navigation history — managed as a simple array + pointer
interface NavHistory {
  stack: Array<string | null>;
  pos:   number;
}
export const navHistory = writable<NavHistory>({ stack: [null], pos: 0 });

// ── Derived: current folder's children ──────────────────────
//  Re-runs any time the FS changes OR the current folder changes.
export const currentItems = derived(
  [fsTick, currentFolderId, searchQuery],
  ([$tick, $folderId, $query]) => {
    if ($query.trim()) {
      return fs.search($query.trim());
    }
    return fs.getChildren($folderId);
  }
);

// ── Derived: breadcrumb path array ──────────────────────────
export const breadcrumb = derived(
  [fsTick, currentFolderId],
  ([$tick, $folderId]) => fs.getPath($folderId)
);

// ── Derived: trash item list ─────────────────────────────────
export const trashItems = derived(trashTick, () => trash.getItems());
export const trashCount = derived(trashTick, () => trash.getCount());

// ── Navigation actions ───────────────────────────────────────

export function navigateTo(folderId: string | null): void {
  searchQuery.set("");
  selectedIds.set(new Set());
  currentFolderId.set(folderId);

  navHistory.update(h => {
    const stack = h.stack.slice(0, h.pos + 1);
    stack.push(folderId);
    return { stack, pos: stack.length - 1 };
  });
}

export function goBack(): void {
  navHistory.update(h => {
    if (h.pos <= 0) return h;
    const pos = h.pos - 1;
    currentFolderId.set(h.stack[pos]);
    selectedIds.set(new Set());
    searchQuery.set("");
    return { ...h, pos };
  });
}

export function goForward(): void {
  navHistory.update(h => {
    if (h.pos >= h.stack.length - 1) return h;
    const pos = h.pos + 1;
    currentFolderId.set(h.stack[pos]);
    selectedIds.set(new Set());
    searchQuery.set("");
    return { ...h, pos };
  });
}

// ── Can-navigate helpers (used to disable toolbar buttons) ───
export const canGoBack    = derived(navHistory, h => h.pos > 0);
export const canGoForward = derived(navHistory, h => h.pos < h.stack.length - 1);

// ── FS mutation helpers ──────────────────────────────────────
//  Thin wrappers that also pass the trash callback to fs.delete()

export function deleteNodes(ids: string[]): void {
  ids.forEach(id => fs.delete(id, node => trash.add(node)));
}

export function restoreFromTrash(id: string): void {
  const entry = trash.restore(id);
  if (!entry) return;
  // Re-insert into the FS at its original parent
  const restored: FSNode = { ...entry };
  // @ts-ignore — we reach into the Map via a small escape hatch
  (fs as any).nodes.set(restored.id, restored);
  (fs as any).persist();
}

// ── Recent files helper ──────────────────────────────────────
//  Grabs the 20 most recently modified non-folder nodes
export function getRecents(): FSNode[] {
  const knownRoots = ["desktop", "documents", "downloads", "receipts"];
  const topLevel   = fs.getChildren(null);
  const fromRoots  = knownRoots.flatMap(id => fs.getChildren(id));

  return [...topLevel, ...fromRoots]
    .filter(n => n.type !== "folder")
    .sort((a, b) => b.modifiedAt - a.modifiedAt)
    .slice(0, 20);
}
