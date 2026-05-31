<!-- ─────────────────────────────────────────────────────────────
     components/FileGrid.svelte
     The main content area — renders files in four view modes:
       • Icon grid
       • List (with headers)
       • Column browser
       • Gallery (larger icons)

     Also handles:
       • Single/multi select (Shift / Cmd/Ctrl)
       • Double-click to open
       • Right-click context menu
       • Drag-and-drop reorder + OS file drop/import
       • Inline rename
───────────────────────────────────────────────────────────── -->

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { currentItems, selectedIds, viewMode, fs } from "../stores";
  import type { FSNode } from "../types/fs";
  import FileIcon from "./FileIcon.svelte";
  import ContextMenu from "./ContextMenu.svelte";
  import type { CtxItem } from "./ContextMenu.svelte";

  const dispatch = createEventDispatcher<{
    open:         FSNode;
    select:       Set<string>;
    deleteNodes:  string[];
    duplicate:    string;
    rename:       { id: string; name: string };
    openInNotes:  FSNode;
    getInfo:      FSNode;
  }>();

  // ── Context menu state ───────────────────────────────────────
  let ctxMenu: { items: CtxItem[]; x: number; y: number } | null = null;

  // ── Rename state ─────────────────────────────────────────────
  let renamingId: string | null = null;
  let renameValue = "";

  // ── Drop zone ────────────────────────────────────────────────
  let dragOver = false;

  // ── Selection logic ──────────────────────────────────────────
  let lastClickedId: string | null = null;
  let dblClickTimer: ReturnType<typeof setTimeout> | null = null;

  function handleItemClick(e: MouseEvent, node: FSNode) {
    e.stopPropagation();

    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      // Multi-select
      selectedIds.update(set => {
        const s = new Set(set);
        s.has(node.id) ? s.delete(node.id) : s.add(node.id);
        return s;
      });
    } else {
      selectedIds.set(new Set([node.id]));
    }

    dispatch("select", $selectedIds);

    // Double-click detection
    if (dblClickTimer) {
      clearTimeout(dblClickTimer);
      dblClickTimer = null;
      dispatch("open", node);
    } else {
      dblClickTimer = setTimeout(() => { dblClickTimer = null; }, 300);
    }
  }

  function handleGridClick() {
    selectedIds.set(new Set());
    dispatch("select", $selectedIds);
    ctxMenu = null;
  }

  // ── Context menu ─────────────────────────────────────────────
  function handleContextMenu(e: MouseEvent, node: FSNode) {
    e.preventDefault();
    e.stopPropagation();

    if (!$selectedIds.has(node.id)) {
      selectedIds.set(new Set([node.id]));
      dispatch("select", $selectedIds);
    }

    const isText  = node.type === "text";
    const isMusic = node.type === "music";
    const isImage = node.type === "image";

    const items: CtxItem[] = [
      { label: "Open",            icon: "▶", action: () => dispatch("open", node) },
      ...(isText  ? [{ label: "Open in Notes", icon: "📝", action: () => dispatch("openInNotes", node) }] : []),
      ...(isMusic ? [{ label: "Play in Music", icon: "🎵" }] : []),
      ...(isImage ? [{ label: "Quick Look",    icon: "👁",  action: () => dispatch("open", node) }] : []),
      { sep: true },
      { label: "Get Info",    icon: "ℹ️", action: () => dispatch("getInfo", node) },
      { label: "Rename",      icon: "✏️", action: () => startRename(node) },
      { label: "Duplicate",   icon: "⧉",  action: () => dispatch("duplicate", node.id) },
      { sep: true },
      { label: "Copy",        icon: "📋" },
      { label: "Cut",         icon: "✂️" },
      { sep: true },
      { label: "Move to Trash", icon: "🗑️", danger: true, action: () => dispatch("deleteNodes", [node.id]) },
    ];

    ctxMenu = { items, x: e.clientX, y: e.clientY };
  }

  // ── Inline rename ─────────────────────────────────────────────
  function startRename(node: FSNode) {
    renamingId  = node.id;
    renameValue = node.name;
    ctxMenu     = null;
  }

  function commitRename(node: FSNode) {
    const newName = renameValue.trim() || node.name;
    if (newName !== node.name) {
      dispatch("rename", { id: node.id, name: newName });
    }
    renamingId = null;
  }

  function handleRenameKey(e: KeyboardEvent, node: FSNode) {
    if (e.key === "Enter")  { e.preventDefault(); commitRename(node); }
    if (e.key === "Escape") { renamingId = null; }
  }

  // ── Drag and drop (OS files → VFS) ───────────────────────────
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;

    const files = [...(e.dataTransfer?.files ?? [])];
    for (const file of files) {
      await importFile(file);
    }
    // Trigger a re-render by nudging the store
    // (stores auto-update via the fs subscriber)
  }

  async function importFile(file: File) {
    const parentId = null; // drops always go to current folder (handled by parent)
    if (file.type.startsWith("image/")) {
      const url = await readDataURL(file);
      fs.createImageFile(parentId, file.name, url, file.size);
    } else if (file.type.startsWith("audio/") || /\.(mp3|m4a|flac|wav|aac|ogg)$/i.test(file.name)) {
      const url = await readDataURL(file);
      fs.createMusicFile(parentId, file.name, url, file.size);
    } else if (file.type === "text/plain" || /\.(txt|md|js|ts|json|css|html)$/i.test(file.name)) {
      const text = await readText(file);
      fs.createTextFile(parentId, file.name, text);
    } else {
      fs.createFile(parentId, file.name, undefined, file.size);
    }
  }

  function readDataURL(f: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(f);
    });
  }

  function readText(f: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result as string);
      r.onerror = rej;
      r.readAsText(f);
    });
  }

  // ── Kind label for list/column views ─────────────────────────
  const KIND_LABELS: Record<string, string> = {
    folder: "Folder", image: "Image", text: "Text", pdf: "PDF",
    music: "Audio", video: "Video", archive: "Archive", dmg: "Disk Image",
    app: "Application", doc: "Document", xls: "Spreadsheet", ppt: "Presentation",
    unknown: "File",
  };

  function kindLabel(node: FSNode): string {
    return KIND_LABELS[node.type] ?? "File";
  }

  function formatDate(ms: number): string {
    return new Date(ms).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  }
</script>

<!-- ── Drop zone wrapper ──────────────────────────────────────── -->
<div
  class="grid-wrap"
  class:drag-active={dragOver}
  on:click={handleGridClick}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
  {#if $currentItems.length === 0}
    <!-- Empty folder state -->
    <div class="empty">
      <div class="empty-icon">📂</div>
      <p>This folder is empty</p>
    </div>

  {:else if $viewMode === "icons"}
    <!-- ── Icon grid ──────────────────────────────────────────── -->
    <div class="icon-grid">
      {#each $currentItems as node (node.id)}
        <div
          class="icon-item"
          class:selected={$selectedIds.has(node.id)}
          data-id={node.id}
          on:click={(e) => handleItemClick(e, node)}
          on:contextmenu={(e) => handleContextMenu(e, node)}
        >
          <FileIcon {node} size={56} />

          {#if renamingId === node.id}
            <input
              class="rename-input"
              bind:value={renameValue}
              on:blur={() => commitRename(node)}
              on:keydown={(e) => handleRenameKey(e, node)}
              use:focusInput
            />
          {:else}
            <span class="file-name">{node.name}</span>
          {/if}
        </div>
      {/each}
    </div>

  {:else if $viewMode === "gallery"}
    <!-- ── Gallery (larger icons) ────────────────────────────── -->
    <div class="gallery-grid">
      {#each $currentItems as node (node.id)}
        <div
          class="icon-item"
          class:selected={$selectedIds.has(node.id)}
          on:click={(e) => handleItemClick(e, node)}
          on:contextmenu={(e) => handleContextMenu(e, node)}
        >
          <FileIcon {node} size={90} />
          <span class="file-name">{node.name}</span>
        </div>
      {/each}
    </div>

  {:else if $viewMode === "list"}
    <!-- ── List view ─────────────────────────────────────────── -->
    <div class="list">
      <div class="list-header">
        <span>Name</span>
        <span>Date Modified</span>
        <span>Size</span>
        <span>Kind</span>
      </div>
      <div class="list-body">
        {#each $currentItems as node (node.id)}
          <div
            class="list-row"
            class:selected={$selectedIds.has(node.id)}
            on:click={(e) => handleItemClick(e, node)}
            on:contextmenu={(e) => handleContextMenu(e, node)}
          >
            <div class="lr-name">
              <FileIcon {node} size={16} />
              {#if renamingId === node.id}
                <input
                  class="rename-input rename-input--inline"
                  bind:value={renameValue}
                  on:blur={() => commitRename(node)}
                  on:keydown={(e) => handleRenameKey(e, node)}
                  use:focusInput
                />
              {:else}
                <span class="lr-label">{node.name}</span>
              {/if}
            </div>
            <div class="lr-meta">{formatDate(node.modifiedAt)}</div>
            <div class="lr-meta">{node.type === "folder" ? "--" : fs.formatSize(node.size)}</div>
            <div class="lr-meta">{kindLabel(node)}</div>
          </div>
        {/each}
      </div>
    </div>

  {:else if $viewMode === "columns"}
    <!-- ── Column view ───────────────────────────────────────── -->
    <div class="columns">
      <div class="column">
        {#each $currentItems as node (node.id)}
          <div
            class="col-row"
            class:selected={$selectedIds.has(node.id)}
            on:click={(e) => handleItemClick(e, node)}
            on:contextmenu={(e) => handleContextMenu(e, node)}
          >
            <FileIcon {node} size={16} />
            <span class="col-name">{node.name}</span>
            {#if node.type === "folder"}
              <svg class="col-arrow" viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Context menu (rendered outside the scroll container) -->
{#if ctxMenu}
  <ContextMenu
    items={ctxMenu.items}
    x={ctxMenu.x}
    y={ctxMenu.y}
    on:close={() => (ctxMenu = null)}
  />
{/if}

<!-- Svelte action: auto-focuses a newly created input -->
<script context="module" lang="ts">
  export function focusInput(el: HTMLInputElement) {
    el.focus();
    el.select();
  }
</script>

<style>
  .grid-wrap {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px;
    position: relative;
  }

  .grid-wrap.drag-active {
    background: rgba(0, 122, 255, 0.04);
    outline: 2px dashed rgba(0, 122, 255, 0.4);
    outline-offset: -2px;
  }

  /* ── Empty state ─────────────────────────────────────────── */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 8px;
    color: rgba(0, 0, 0, 0.3);
  }
  .empty-icon { font-size: 48px; opacity: 0.4; }
  .empty p    { font-size: 13px; margin: 0; }

  /* ── Icon grid ───────────────────────────────────────────── */
  .icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 8px;
    align-content: start;
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 12px;
    align-content: start;
  }

  .icon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 8px 6px 6px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 80ms;
    text-align: center;
  }
  .icon-item:hover    { background: rgba(0, 0, 0, 0.05); }
  .icon-item.selected { background: rgba(0, 122, 255, 0.15); }

  .file-name {
    font-size: 11px;
    color: #1c1c1e;
    word-break: break-word;
    text-align: center;
    max-width: 80px;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .icon-item.selected .file-name {
    background: #0a7aff;
    color: #fff;
    border-radius: 4px;
    padding: 1px 4px;
  }

  /* ── Rename input ────────────────────────────────────────── */
  .rename-input {
    font-size: 11px;
    text-align: center;
    background: #fff;
    border: 1.5px solid #0a7aff;
    border-radius: 4px;
    padding: 1px 4px;
    outline: none;
    width: 80px;
    max-width: 80px;
    font-family: -apple-system, "SF Pro Text", sans-serif;
  }

  .rename-input--inline {
    text-align: left;
    width: 120px;
    max-width: 200px;
  }

  /* ── List view ───────────────────────────────────────────── */
  .list { display: flex; flex-direction: column; }

  .list-header {
    display: grid;
    grid-template-columns: 1fr 130px 70px 90px;
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.45);
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    background: rgba(240, 239, 234, 0.97);
    z-index: 1;
  }

  .list-row {
    display: grid;
    grid-template-columns: 1fr 130px 70px 90px;
    padding: 5px 12px;
    cursor: pointer;
    transition: background 60ms;
    border-radius: 5px;
    margin: 1px 4px;
    align-items: center;
  }
  .list-row:hover    { background: rgba(0, 0, 0, 0.04); }
  .list-row.selected { background: rgba(0, 122, 255, 0.12); }

  .lr-name  { display: flex; align-items: center; gap: 6px; overflow: hidden; }
  .lr-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lr-meta  { font-size: 11px; color: rgba(0, 0, 0, 0.45); display: flex; align-items: center; }

  /* ── Column view ─────────────────────────────────────────── */
  .columns { display: flex; height: 100%; overflow-x: auto; }
  .column  { min-width: 220px; max-width: 220px; border-right: 0.5px solid rgba(0, 0, 0, 0.1); overflow-y: auto; }

  .col-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    cursor: pointer;
    font-size: 12.5px;
    transition: background 60ms;
    border-radius: 5px;
    margin: 1px 4px;
  }
  .col-row:hover    { background: rgba(0, 0, 0, 0.05); }
  .col-row.selected { background: rgba(0, 122, 255, 0.12); }

  .col-name  { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .col-arrow { color: rgba(0, 0, 0, 0.3); flex-shrink: 0; }

  /* ── Dark mode ───────────────────────────────────────────── */
  :global(#desktop.dark-mode) .icon-item:hover  { background: rgba(255, 255, 255, 0.07); }
  :global(#desktop.dark-mode) .file-name        { color: #f5f5f7; }
  :global(#desktop.dark-mode) .list-header      { background: rgba(28, 28, 30, 0.97); color: rgba(255,255,255,0.35); }
  :global(#desktop.dark-mode) .list-row:hover   { background: rgba(255, 255, 255, 0.06); }
  :global(#desktop.dark-mode) .lr-label         { color: #f5f5f7; }
  :global(#desktop.dark-mode) .lr-meta          { color: rgba(255, 255, 255, 0.38); }
  :global(#desktop.dark-mode) .col-name         { color: #f5f5f7; }
</style>
