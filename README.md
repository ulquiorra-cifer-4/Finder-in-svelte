# 🗂️ macOS Finder — Svelte VFS Edition

A fully working macOS Finder clone built entirely in **Svelte + TypeScript**, extracted from the [macOS Tahoe Web](https://macostahoeweb.vercel.app/) project. The goal here is to show — with clean, readable code — exactly how a **Virtual File System (VFS)** works in the browser.

---

## What is a VFS?

A real filesystem lives on disk. A *virtual* filesystem lives in memory (and localStorage). The concept is the same:

- Every **file** and **folder** is a node with an ID, a parent ID, a name, and metadata
- The parent-child relationship forms a **tree**
- Operations like create, rename, move, delete, and search all walk that tree
- Everything is serialised to `localStorage` so it persists across page refreshes

No server. No database. No backend. Pure browser.

---

## File Structure

```
src/
├── types/
│   └── fs.ts              # All shared TypeScript types (FSNode, TrashEntry, etc.)
│
├── lib/
│   ├── fs.ts              # FinderFS — the VFS class (create, read, update, delete)
│   └── trash.ts           # TrashStore — separate bin with restore support
│
├── stores/
│   └── index.ts           # Svelte reactive stores + navigation helpers
│
├── components/
│   ├── FileIcon.svelte     # Smart icon: thumbnail → PNG → emoji fallback
│   ├── Sidebar.svelte      # Left nav panel (Favourites, Locations)
│   ├── Toolbar.svelte      # Top bar (back/fwd, breadcrumb, view toggle, search)
│   ├── ContextMenu.svelte  # Reusable right-click menu
│   ├── FileGrid.svelte     # All 4 view modes: icons, list, columns, gallery
│   ├── Preview.svelte      # Right-side preview panel
│   ├── Lightbox.svelte     # Full-screen image viewer
│   ├── InfoPanel.svelte    # ⌘I "Get Info" modal
│   └── StatusBar.svelte    # Bottom item count bar
│
├── Finder.svelte           # Root component — wires everything together
└── main.ts                 # Entry point + shell integration
```

---

## How the VFS Works

### 1. Data Model (`src/lib/fs.ts`)

Every node is a plain object:

```ts
interface FSNode {
  id:         string;       // "node_1712345678_abc123"
  parentId:   string | null;  // null = root level
  name:       string;
  type:       FileType;     // "folder" | "image" | "text" | ...
  size:       number;       // bytes
  createdAt:  number;       // Unix ms
  modifiedAt: number;
  content?:   string;       // for text files
  dataUrl?:   string;       // for images (base64)
}
```

All nodes live in a `Map<id, FSNode>`. On every write, the Map is serialised to `localStorage` as a JSON array.

### 2. Tree Traversal

```ts
// Get all direct children of a folder
getChildren(parentId: string | null): FSNode[]

// Walk up to build a breadcrumb path
getPath(id: string): FSNode[]

// Full-text search across all nodes
search(query: string): FSNode[]
```

The tree is implicit — there's no pointer-based structure. Instead we just filter the flat Map by `parentId`. This is O(n) but fast enough for any realistic number of files.

### 3. Reactivity Bridge (`src/stores/index.ts`)

`FinderFS` has its own pub/sub system (`.subscribe(fn)`). We bridge it into Svelte's reactive stores using a "tick counter" pattern:

```ts
const fsTick = writable(0);
fs.subscribe(() => fsTick.update(n => n + 1));

// This store re-runs whenever fsTick or currentFolderId changes
export const currentItems = derived(
  [fsTick, currentFolderId],
  ([$, $folderId]) => fs.getChildren($folderId)
);
```

Svelte components that reference `$currentItems` automatically re-render whenever the filesystem changes — no manual DOM updates needed.

### 4. Trash Pipeline

Deleting a file doesn't immediately destroy it. It goes to `TrashStore` (a separate localStorage key) with a `deletedAt` timestamp and its `originalParentId`. From there it can be restored or permanently deleted.

```
fs.delete(id)
  → TrashStore.add(node)       // save to trash
  → fs.nodes.delete(id)        // remove from VFS
  → fs.persist()               // write to localStorage
```

---

## Running Locally

```bash
npm install
npm run dev
```

The dev server runs a standalone Finder — no macOS shell needed.

---

## Improvements Over Original

| Feature | Original (vanilla JS) | This (Svelte) |
|---|---|---|
| Reactivity | Manual DOM updates | Svelte stores — zero DOM code |
| State management | Scattered globals | Centralised `stores/index.ts` |
| Type safety | Mostly `any` | Full TypeScript throughout |
| Component isolation | Class methods | Proper `.svelte` components with scoped styles |
| Breadcrumb navigation | Hard-coded HTML inject | Reactive derived store |
| Preview | Manually toggled DOM nodes | Svelte `{#if}` block |
| Context menu | Appended to `document.body` | Dedicated `ContextMenu.svelte` component |

---

## Credits

Built by [Nx4real](https://github.com/ulquiorra-cifer-4) as part of the **macOS Tahoe Web** project — a browser-based macOS emulator that outperforms the popular puruVJ macOS web clone in features, animation quality, and app completeness.
