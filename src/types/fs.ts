// ─────────────────────────────────────────────────────────────
//  types/fs.ts
//  All shared TypeScript types for the virtual filesystem.
//  Keep everything here so every component stays in sync.
// ─────────────────────────────────────────────────────────────

export type FileType =
  | "folder"
  | "image"
  | "text"
  | "pdf"
  | "music"
  | "video"
  | "archive"
  | "dmg"
  | "app"
  | "pkg"
  | "doc"
  | "xls"
  | "ppt"
  | "pages"
  | "numbers"
  | "keynote"
  | "unknown";

export type ViewMode = "icons" | "list" | "columns" | "gallery";

// A single node in the virtual filesystem — file or folder
export interface FSNode {
  id:         string;
  parentId:   string | null;
  name:       string;
  type:       FileType;
  size:       number;        // bytes (0 for folders)
  createdAt:  number;        // Unix ms
  modifiedAt: number;        // Unix ms

  // Optional — only populated for certain types
  content?:   string;        // text files
  dataUrl?:   string;        // images (base64 data URL)
  audioUrl?:  string;        // music files (base64 data URL)
  iCloudSync?: boolean;
  color?:     string;        // folder accent color
  tags?:      string[];
}

// A trash-bin entry — same shape as FSNode but with extra bookkeeping
export interface TrashEntry extends FSNode {
  deletedAt:        number;
  originalParentId: string | null;
}

// What the sidebar emits when you click a location
export interface SidebarLocation {
  id:      string;
  label:   string;
  icon:    string;
  fsId:    string | null;
  virtual?: "icloud" | "recents" | "home";
}
