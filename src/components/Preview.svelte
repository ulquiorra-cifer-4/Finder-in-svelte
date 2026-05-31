<!-- ─────────────────────────────────────────────────────────────
     components/Preview.svelte
     Right-side preview panel.
     Shows a thumbnail (or type icon) + file metadata.
     Also used by the Info modal.
───────────────────────────────────────────────────────────── -->

<script lang="ts">
  import { selectedIds } from "../stores";
  import { fs } from "../stores";
  import type { FSNode } from "../types/fs";
  import FileIcon from "./FileIcon.svelte";

  // The node to display — parent passes it in
  export let nodeId: string | null = null;

  $: node = nodeId ? fs.getNode(nodeId) : null;

  $: childCount = node?.type === "folder"
    ? fs.getChildren(node.id).length
    : 0;

  $: folderSize = node?.type === "folder"
    ? fs.formatSize(fs.getChildren(node.id).reduce((s, c) => s + c.size, 0))
    : null;

  function kindLabel(n: FSNode): string {
    const MAP: Record<string, string> = {
      folder: "Folder", text: "Plain Text Document",
      image: "Image", pdf: "PDF Document",
      music: "Audio File", video: "Video File",
      archive: "Archive", dmg: "Disk Image",
      doc: "Word Document", xls: "Spreadsheet",
      ppt: "Presentation", unknown: "Document",
    };
    return MAP[n.type] ?? "Document";
  }
</script>

<aside class="preview">
  {#if !node}
    <!-- Nothing selected yet -->
    <div class="empty">
      <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32" style="opacity:.2">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
      </svg>
      <p>Select a file to preview</p>
    </div>

  {:else}
    <!-- Preview area -->
    <div class="pv-area">
      {#if node.type === "image" && node.dataUrl}
        <img src={node.dataUrl} alt={node.name} class="pv-img" />

      {:else if node.type === "text" && node.content}
        <pre class="pv-text">{node.content.slice(0, 500)}{node.content.length > 500 ? "\n…" : ""}</pre>

      {:else if node.type === "folder"}
        <!-- Folder icon + child count -->
        <div class="pv-folder">
          <svg viewBox="0 0 80 64" width="80" height="64">
            <path d="M4 12 C4 9 6 8 9 8 L30 8 L34 13 L73 13 C76 13 78 15 78 18 L78 56 C78 59 76 61 73 61 L9 61 C6 61 4 59 4 56 Z" fill="#4CAAEE"/>
            <path d="M4 18 L78 18 L78 56 C78 59 76 61 73 61 L9 61 C6 61 4 59 4 56 Z" fill="#5BB8F5"/>
          </svg>
          <span class="pv-folder-count">{childCount} item{childCount !== 1 ? "s" : ""}</span>
        </div>

      {:else}
        <!-- Generic file icon -->
        <FileIcon {node} size={72} />
      {/if}
    </div>

    <!-- Metadata section -->
    <div class="pv-info">
      <div class="pv-name">{node.name}</div>

      <div class="pv-meta-grid">
        <div class="pv-row">
          <span class="pv-label">Kind</span>
          <span class="pv-val">{kindLabel(node)}</span>
        </div>
        <div class="pv-row">
          <span class="pv-label">Size</span>
          <span class="pv-val">{folderSize ?? fs.formatSize(node.size)}</span>
        </div>
        <div class="pv-row">
          <span class="pv-label">Created</span>
          <span class="pv-val">{new Date(node.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="pv-row">
          <span class="pv-label">Modified</span>
          <span class="pv-val">{new Date(node.modifiedAt).toLocaleDateString()}</span>
        </div>
        {#if node.iCloudSync}
          <div class="pv-row">
            <span class="pv-label">iCloud</span>
            <span class="pv-val pv-synced">✓ Synced</span>
          </div>
        {/if}
      </div>

      {#if node.tags?.length}
        <div class="pv-tags">
          {#each node.tags as tag}
            <span class="pv-tag">{tag}</span>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</aside>

<style>
  .preview {
    width: 220px;
    min-width: 220px;
    border-left: 0.5px solid rgba(0, 0, 0, 0.1);
    background: rgba(240, 239, 234, 0.98);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    flex-shrink: 0;
  }

  /* Empty state */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 8px;
    color: rgba(0, 0, 0, 0.4);
  }
  .empty p { font-size: 12px; margin: 0; }

  /* Preview thumbnail area */
  .pv-area {
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 140px;
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.07);
  }

  .pv-img {
    max-width: 100%;
    max-height: 150px;
    object-fit: contain;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .pv-text {
    font-family: "SF Mono", Menlo, monospace;
    font-size: 10px;
    color: rgba(0, 0, 0, 0.6);
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
    line-height: 1.5;
    max-height: 150px;
    overflow: hidden;
  }

  .pv-folder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .pv-folder-count { font-size: 11px; color: rgba(0, 0, 0, 0.4); }

  /* Metadata */
  .pv-info    { padding: 12px 14px; }
  .pv-name    { font-size: 12.5px; font-weight: 600; color: #1c1c1e; word-break: break-word; margin-bottom: 10px; }
  .pv-meta-grid { display: flex; flex-direction: column; gap: 4px; }

  .pv-row {
    display: grid;
    grid-template-columns: 60px 1fr;
    gap: 4px;
    font-size: 11px;
  }
  .pv-label  { color: rgba(0, 0, 0, 0.4); }
  .pv-val    { color: #1c1c1e; word-break: break-word; }
  .pv-synced { color: #0a84ff; }

  .pv-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
  }
  .pv-tag {
    font-size: 10px;
    padding: 2px 7px;
    background: rgba(0, 122, 255, 0.1);
    color: #0a84ff;
    border-radius: 20px;
  }

  /* Dark mode */
  :global(#desktop.dark-mode) .preview     { background: rgba(36, 36, 38, 0.98); border-left-color: rgba(255,255,255,0.08); }
  :global(#desktop.dark-mode) .pv-name     { color: #f5f5f7; }
  :global(#desktop.dark-mode) .pv-val      { color: #f5f5f7; }
  :global(#desktop.dark-mode) .pv-text     { color: rgba(255,255,255,0.5); }
</style>
