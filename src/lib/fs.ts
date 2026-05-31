// ─────────────────────────────────────────────────────────────
//  lib/fs.ts
//  Virtual Filesystem — the heart of the whole thing.
//
//  Everything lives in a Map<id, FSNode> which is serialised
//  to localStorage on every write.  Consumers subscribe via
//  an event emitter so Svelte stores can react automatically.
// ─────────────────────────────────────────────────────────────

import type { FSNode, FileType } from "../types/fs";

const STORAGE_KEY = "macos_finder_fs_v2";

// ── Extension → file-type lookup ──────────────────────────────
const EXT_MAP: Record<string, FileType> = {
  // Images
  jpg: "image", jpeg: "image", png: "image", gif: "image",
  webp: "image", svg: "image", bmp: "image", ico: "image", tiff: "image",
  // Text / code
  txt: "text", md: "text", ts: "text", js: "text", html: "text",
  css: "text", json: "text", xml: "text", csv: "text", log: "text",
  py: "text", sh: "text", yaml: "text", yml: "text", toml: "text",
  // Docs
  pdf: "pdf",
  doc: "doc", docx: "doc",
  xls: "xls", xlsx: "xls",
  ppt: "ppt", pptx: "ppt",
  pages: "pages", numbers: "numbers", key: "keynote",
  // Media
  mp3: "music", m4a: "music", flac: "music", wav: "music",
  aac: "music", ogg: "music", opus: "music", wma: "music",
  mp4: "video", mov: "video", avi: "video", mkv: "video", webm: "video",
  // Archives
  zip: "archive", gz: "archive", tar: "archive", rar: "archive", "7z": "archive",
  // System
  dmg: "dmg", app: "app", pkg: "pkg",
};

export function detectType(filename: string): FileType {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MAP[ext] ?? "unknown";
}

// ── Icon + emoji maps (used by FinderIcons component) ─────────
export const TYPE_ICON: Record<FileType, string> = {
  folder:  "folder",
  image:   "file-image",
  text:    "file-text",
  pdf:     "file-pdf",
  music:   "file-music",
  video:   "file-video",
  archive: "file-archive",
  dmg:     "file-dmg",
  app:     "file-app",
  pkg:     "file-pkg",
  doc:     "file-doc",
  xls:     "file-xls",
  ppt:     "file-ppt",
  pages:   "file-pages",
  numbers: "file-numbers",
  keynote: "file-keynote",
  unknown: "file-generic",
};

export const TYPE_EMOJI: Record<FileType, string> = {
  folder: "📁", image: "🖼️", text: "📄", pdf: "📑",
  music: "🎵", video: "🎬", archive: "📦", dmg: "💿",
  app: "📱", pkg: "📦", doc: "📝", xls: "📊",
  ppt: "📊", pages: "📄", numbers: "📊", keynote: "📊",
  unknown: "📄",
};

export const TYPE_COLOR: Record<FileType, string> = {
  folder:  "#4CAAEE", image:   "#34C759", text:    "#8E8E93",
  pdf:     "#FF3B30", music:   "#FF2D55", video:   "#AF52DE",
  archive: "#FF9500", dmg:     "#636366", app:     "#007AFF",
  pkg:     "#FF9500", doc:     "#007AFF", xls:     "#34C759",
  ppt:     "#FF6B00", pages:   "#007AFF", numbers: "#34C759",
  keynote: "#FF6B00", unknown: "#8E8E93",
};

// ── Seed data shown on first launch ───────────────────────────
function buildSeed(): FSNode[] {
  const now = Date.now();
  const day = 86_400_000;
  return [
    // Top-level folders
    { id: "desktop",     parentId: null, name: "Desktop",      type: "folder", size: 0, createdAt: now, modifiedAt: now, iCloudSync: true },
    { id: "documents",   parentId: null, name: "Documents",    type: "folder", size: 0, createdAt: now, modifiedAt: now, iCloudSync: true },
    { id: "receipts",    parentId: null, name: "Receipts",     type: "folder", size: 0, createdAt: now, modifiedAt: now, iCloudSync: true, color: "#0a84ff" },
    { id: "downloads",   parentId: null, name: "Downloads",    type: "folder", size: 0, createdAt: now, modifiedAt: now },
    { id: "apps_folder", parentId: null, name: "Applications", type: "folder", size: 0, createdAt: now, modifiedAt: now },

    // Desktop — some sample images
    { id: "f1", parentId: "desktop", name: "BeverlyHills.jpeg", type: "image", size: 2_048_000, createdAt: now - day * 5,  modifiedAt: now - day * 5  },
    { id: "f2", parentId: "desktop", name: "Brunch.jpeg",       type: "image", size: 1_840_000, createdAt: now - day * 3,  modifiedAt: now - day * 3  },
    { id: "f3", parentId: "desktop", name: "Isolate.jpeg",      type: "image", size:   920_000, createdAt: now - day * 2,  modifiedAt: now - day * 2  },
    { id: "f4", parentId: "desktop", name: "JuneLake.jpeg",     type: "image", size: 3_100_000, createdAt: now - day * 8,  modifiedAt: now - day * 8  },
    { id: "f5", parentId: "desktop", name: "KidsLondon.jpeg",   type: "image", size: 2_700_000, createdAt: now - day * 10, modifiedAt: now - day * 10 },
    { id: "f6", parentId: "desktop", name: "LosAngeles.jpeg",   type: "image", size: 4_100_000, createdAt: now - day * 12, modifiedAt: now - day * 12 },
    { id: "f7", parentId: "desktop", name: "Purple.jpeg",       type: "image", size: 1_200_000, createdAt: now - day,      modifiedAt: now - day      },

    // Documents — some text files
    {
      id: "d1", parentId: "documents", name: "README.txt", type: "text", size: 1200,
      createdAt: now - day * 30, modifiedAt: now - day * 2,
      content: "# macOS Web Emulator\n\nA browser-based recreation of macOS Tahoe.\n\n## Features\n- Dock with magnification\n- Window management\n- Notes, Finder, Music apps\n- Full virtual filesystem\n\nBuilt with Svelte + TypeScript.",
    },
    {
      id: "d2", parentId: "documents", name: "Project Notes.txt", type: "text", size: 860,
      createdAt: now - day * 14, modifiedAt: now - day,
      content: "Project Notes\n==============\n\nTODO:\n- [ ] Safari app\n- [ ] Calendar app\n- [ ] Settings panel\n\nDone:\n- [x] Dock animation\n- [x] Window manager\n- [x] Notes app\n- [x] Finder with VFS\n",
    },
    {
      id: "d3", parentId: "documents", name: "Ideas.txt", type: "text", size: 430,
      createdAt: now - day * 7, modifiedAt: now - day * 7,
      content: "Ideas:\n\n1. Add more apps\n2. Improve animations\n3. File sharing\n4. Better search\n5. Spotlight integration",
    },
    { id: "docs_sub", parentId: "documents", name: "Work", type: "folder", size: 0, createdAt: now - day * 20, modifiedAt: now - day * 5 },

    // Downloads
    { id: "dl1", parentId: "downloads", name: "installer.dmg", type: "dmg",     size: 52_428_800, createdAt: now - day * 2, modifiedAt: now - day * 2 },
    { id: "dl2", parentId: "downloads", name: "report.pdf",    type: "pdf",     size:  1_048_576, createdAt: now - day * 4, modifiedAt: now - day * 4 },
    { id: "dl3", parentId: "downloads", name: "archive.zip",   type: "archive", size:  8_388_608, createdAt: now - day * 6, modifiedAt: now - day * 6 },
  ];
}

// ── FinderFS ───────────────────────────────────────────────────
//  The virtual filesystem class.
//  All operations mutate the internal Map and persist to localStorage.
export class FinderFS {
  private nodes = new Map<string, FSNode>();
  private listeners: Array<() => void> = [];

  constructor() {
    this.load();
  }

  // ── Persistence ────────────────────────────────────────────

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        (JSON.parse(raw) as FSNode[]).forEach(n => this.nodes.set(n.id, n));
        return;
      }
    } catch { /* corrupt storage — fall through to seed */ }

    buildSeed().forEach(n => this.nodes.set(n.id, n));
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.nodes.values()]));
    } catch { /* storage full — ignore */ }
    this.listeners.forEach(fn => fn());
  }

  // Subscribe to any change (returns unsubscribe fn)
  subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  // ── Read ───────────────────────────────────────────────────

  getNode(id: string): FSNode | undefined {
    return this.nodes.get(id);
  }

  // Returns direct children, folders first then alphabetical
  getChildren(parentId: string | null): FSNode[] {
    return [...this.nodes.values()]
      .filter(n => n.parentId === parentId)
      .sort((a, b) => {
        if (a.type === "folder" && b.type !== "folder") return -1;
        if (a.type !== "folder" && b.type === "folder") return  1;
        return a.name.localeCompare(b.name);
      });
  }

  // Walks up the tree to build a breadcrumb path
  getPath(id: string | null): FSNode[] {
    const path: FSNode[] = [];
    let cur = id ? this.nodes.get(id) : undefined;
    while (cur) {
      path.unshift(cur);
      cur = cur.parentId ? this.nodes.get(cur.parentId) : undefined;
    }
    return path;
  }

  // Full-text search across all nodes
  search(query: string, scopeId?: string): FSNode[] {
    const q = query.toLowerCase();
    return [...this.nodes.values()].filter(n =>
      n.name.toLowerCase().includes(q) &&
      (scopeId === undefined || this.isDescendant(n.id, scopeId))
    );
  }

  private isDescendant(id: string, ancestorId: string): boolean {
    let n = this.nodes.get(id);
    while (n) {
      if (n.parentId === ancestorId) return true;
      n = n.parentId ? this.nodes.get(n.parentId) : undefined;
    }
    return false;
  }

  // ── Write ──────────────────────────────────────────────────

  createFolder(parentId: string | null, name: string): FSNode {
    const node: FSNode = {
      id: this.uid(), parentId, name,
      type: "folder", size: 0,
      createdAt: Date.now(), modifiedAt: Date.now(),
    };
    this.nodes.set(node.id, node);
    this.persist();
    return node;
  }

  createTextFile(parentId: string | null, name: string, content = ""): FSNode {
    const safeName = name.endsWith(".txt") ? name : name + ".txt";
    const node: FSNode = {
      id: this.uid(), parentId, name: safeName,
      type: "text", size: content.length, content,
      createdAt: Date.now(), modifiedAt: Date.now(),
    };
    this.nodes.set(node.id, node);
    this.persist();
    return node;
  }

  createImageFile(parentId: string | null, name: string, dataUrl: string, size: number): FSNode {
    const node: FSNode = {
      id: this.uid(), parentId, name,
      type: "image", size, dataUrl,
      createdAt: Date.now(), modifiedAt: Date.now(),
    };
    this.nodes.set(node.id, node);
    this.persist();
    return node;
  }

  createMusicFile(parentId: string | null, name: string, audioUrl: string, size: number): FSNode {
    const node: FSNode = {
      id: this.uid(), parentId, name,
      type: "music", size, audioUrl,
      createdAt: Date.now(), modifiedAt: Date.now(),
    };
    this.nodes.set(node.id, node);
    this.persist();
    return node;
  }

  // Generic file create — type is inferred from extension
  createFile(parentId: string | null, name: string, dataUrl?: string, size = 0, content?: string): FSNode {
    const node: FSNode = {
      id: this.uid(), parentId, name,
      type: detectType(name), size, dataUrl, content,
      createdAt: Date.now(), modifiedAt: Date.now(),
    };
    this.nodes.set(node.id, node);
    this.persist();
    return node;
  }

  updateContent(id: string, content: string): void {
    const n = this.nodes.get(id);
    if (!n) return;
    n.content = content;
    n.size = content.length;
    n.modifiedAt = Date.now();
    this.persist();
  }

  rename(id: string, newName: string): void {
    const n = this.nodes.get(id);
    if (!n) return;
    n.name = newName;
    n.modifiedAt = Date.now();
    this.persist();
  }

  move(id: string, newParentId: string | null): void {
    const n = this.nodes.get(id);
    if (!n) return;
    n.parentId = newParentId;
    n.modifiedAt = Date.now();
    this.persist();
  }

  // Moves to trash — consumers should inject the TrashStore via callback
  delete(id: string, onTrash?: (node: FSNode) => void): void {
    const node = this.nodes.get(id);
    if (!node) return;

    // Recursively handle children first
    this.getChildren(id).forEach(child => this.delete(child.id, onTrash));

    onTrash?.(node);
    this.nodes.delete(id);
    this.persist();
  }

  // Hard delete — called when emptying trash
  permanentDelete(id: string): void {
    this.getChildren(id).forEach(child => this.permanentDelete(child.id));
    this.nodes.delete(id);
    this.persist();
  }

  duplicate(id: string): FSNode | null {
    const orig = this.nodes.get(id);
    if (!orig) return null;

    const node: FSNode = {
      ...orig,
      id: this.uid(),
      name: this.dupName(orig.name),
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };
    this.nodes.set(node.id, node);
    this.persist();
    return node;
  }

  // ── Utility ────────────────────────────────────────────────

  formatSize(bytes: number | undefined): string {
    if (!bytes || bytes === 0) return "--";
    if (bytes < 1024)                return `${bytes} B`;
    if (bytes < 1024 * 1024)         return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  private uid(): string {
    return "node_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  }

  private dupName(name: string): string {
    const dot = name.lastIndexOf(".");
    return dot === -1 ? name + " copy" : name.slice(0, dot) + " copy" + name.slice(dot);
  }
}
