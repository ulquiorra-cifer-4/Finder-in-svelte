<!-- ─────────────────────────────────────────────────────────────
     components/InfoPanel.svelte
     "Get Info" modal — the macOS⌘I equivalent.
     Shows full file metadata with a proper macOS-style sheet.
───────────────────────────────────────────────────────────── -->

<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import type { FSNode } from "../types/fs";
  import { fs } from "../stores";
  import FileIcon from "./FileIcon.svelte";

  export let node: FSNode;

  const dispatch = createEventDispatcher<{ close: void }>();

  function close() { dispatch("close"); }

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape" || (e.metaKey && e.key === "i")) close();
  }

  onMount(()  => document.addEventListener("keydown", handleKey));
  onDestroy(() => document.removeEventListener("keydown", handleKey));

  const KIND_MAP: Record<string, string> = {
    folder: "Folder", text: "Plain Text Document",
    image: "JPEG Image", pdf: "PDF Document",
    music: "Audio File", video: "Video File",
    archive: "ZIP Archive", dmg: "Disk Image",
    doc: "Microsoft Word Document", xls: "Microsoft Excel Spreadsheet",
    ppt: "Microsoft PowerPoint Presentation",
    pages: "Pages Document", numbers: "Numbers Spreadsheet",
    keynote: "Keynote Presentation", unknown: "Document",
  };

  $: kind = KIND_MAP[node.type] ?? "Document";
  $: created  = new Date(node.createdAt).toLocaleString();
  $: modified = new Date(node.modifiedAt).toLocaleString();
  $: size = node.type === "folder"
    ? fs.formatSize(fs.getChildren(node.id).reduce((s, c) => s + c.size, 0)) + " on disk"
    : fs.formatSize(node.size);
</script>

<div class="backdrop" on:click={close}>
  <div class="panel" on:click|stopPropagation>
    <!-- Title bar -->
    <div class="panel-header">
      <FileIcon {node} size={24} />
      <span class="panel-title">{node.name} — Info</span>
      <button class="close-btn" on:click={close}>✕</button>
    </div>

    <!-- Rows -->
    <div class="rows">
      <div class="row">
        <span class="label">Name</span>
        <span class="val">{node.name}</span>
      </div>
      <div class="sep"></div>
      <div class="row">
        <span class="label">Kind</span>
        <span class="val">{kind}</span>
      </div>
      <div class="row">
        <span class="label">Size</span>
        <span class="val">{size}</span>
      </div>
      <div class="sep"></div>
      <div class="row">
        <span class="label">Created</span>
        <span class="val">{created}</span>
      </div>
      <div class="row">
        <span class="label">Modified</span>
        <span class="val">{modified}</span>
      </div>
      {#if node.iCloudSync}
        <div class="sep"></div>
        <div class="row">
          <span class="label">iCloud</span>
          <span class="val" style="color:#0a84ff">✓ Synced</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(4px);
    animation: fade 120ms ease;
  }

  @keyframes fade {
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1); }
  }

  .panel {
    width: 300px;
    background: rgba(246, 246, 246, 0.97);
    border-radius: 14px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    backdrop-filter: blur(20px);
    border: 0.5px solid rgba(0, 0, 0, 0.12);
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
    background: rgba(240, 240, 240, 0.98);
  }

  .panel-title {
    flex: 1;
    font-size: 12.5px;
    font-weight: 600;
    color: #1c1c1e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.4);
    font-size: 12px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 80ms;
  }
  .close-btn:hover { background: rgba(0, 0, 0, 0.08); color: #000; }

  .rows   { padding: 8px 0 12px; }

  .row {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 4px;
    padding: 5px 16px;
    font-size: 12px;
  }

  .label { color: rgba(0, 0, 0, 0.45); }
  .val   { color: #1c1c1e; word-break: break-word; }

  .sep {
    height: 0.5px;
    background: rgba(0, 0, 0, 0.07);
    margin: 5px 12px;
  }
</style>
