<!-- ─────────────────────────────────────────────────────────────
     Finder.svelte  — root component
     Wires every sub-component together:
       Toolbar → Sidebar → FileGrid → Preview → StatusBar

     Also owns:
       • Navigation (back/forward, breadcrumb clicks)
       • Modal overlays (Lightbox, InfoPanel)
       • File operations (open, delete, duplicate, rename)
───────────────────────────────────────────────────────────── -->

<script lang="ts">
  import Toolbar    from "./components/Toolbar.svelte";
  import Sidebar    from "./components/Sidebar.svelte";
  import FileGrid   from "./components/FileGrid.svelte";
  import Preview    from "./components/Preview.svelte";
  import StatusBar  from "./components/StatusBar.svelte";
  import Lightbox   from "./components/Lightbox.svelte";
  import InfoPanel  from "./components/InfoPanel.svelte";

  import {
    navigateTo, getRecents, deleteNodes,
    currentFolderId, showPreview, selectedIds, fs,
  } from "./stores";
  import type { SidebarLocation, FSNode } from "./types/fs";

  // ── Modal state ──────────────────────────────────────────────
  let lightboxNode: FSNode | null = null;
  let infoPanelNode: FSNode | null = null;

  // ── Preview: single selected node ───────────────────────────
  $: previewNodeId = $selectedIds.size === 1
    ? [...$selectedIds][0]
    : null;

  // ── Sidebar navigation ───────────────────────────────────────
  function handleSidebarNav(e: CustomEvent<SidebarLocation>) {
    const loc = e.detail;

    if (loc.virtual === "recents") {
      // Show recently modified files (special view)
      // We push null to navigation so back/forward still works
      navigateTo(null);
      // Then inject recents into the grid via a search-like override
      // (the store handles this via getRecents helper)
      // TODO: wire recents as a separate nav mode
      return;
    }

    if (loc.fsId) {
      navigateTo(loc.fsId);
    } else {
      // iCloud root, home, Macintosh HD etc → go to null (root)
      navigateTo(null);
    }
  }

  // ── File open ────────────────────────────────────────────────
  function handleOpen(e: CustomEvent<FSNode>) {
    const node = e.detail;

    if (node.type === "folder") {
      navigateTo(node.id);
      return;
    }

    if (node.type === "image" && node.dataUrl) {
      lightboxNode = node;
      return;
    }

    if (node.type === "text") {
      // Delegate to Notes app if available (same as original)
      const notesStore = (window as any).__notesStore;
      if (notesStore) {
        const all = notesStore.getNotes();
        let existing = all.find((n: any) => n.title === node.name);
        if (!existing) {
          existing = notesStore.createNote("notes");
          notesStore.updateNote(existing.id, {
            title: node.name,
            body: `<pre>${(node.content ?? "").replace(/</g, "&lt;")}</pre>`,
            plainText: node.content ?? "",
          });
        }
        (window as any).openNotesWindow?.();
      }
      return;
    }

    // Anything else — just show info
    infoPanelNode = node;
  }

  // ── File operations ──────────────────────────────────────────
  function handleDelete(e: CustomEvent<string[]>) {
    deleteNodes(e.detail);
  }

  function handleDuplicate(e: CustomEvent<string>) {
    fs.duplicate(e.detail);
  }

  function handleRename(e: CustomEvent<{ id: string; name: string }>) {
    fs.rename(e.detail.id, e.detail.name);
  }

  function handleNewFolder() {
    fs.createFolder($currentFolderId, "Untitled Folder");
  }

  function handleNewFile() {
    fs.createTextFile($currentFolderId, "Untitled");
  }

  function handleGetInfo(e: CustomEvent<FSNode>) {
    infoPanelNode = e.detail;
  }

  function handleOpenInNotes(e: CustomEvent<FSNode>) {
    handleOpen(e); // same path as text open
  }
</script>

<div class="finder">
  <!-- ── Toolbar ──────────────────────────────────────────────── -->
  <Toolbar
    on:newFolder={handleNewFolder}
    on:newFile={handleNewFile}
    on:togglePreview={() => showPreview.update(v => !v)}
  />

  <!-- ── Body: sidebar + content + optional preview ───────────── -->
  <div class="body">
    <Sidebar on:navigate={handleSidebarNav} />

    <main class="main">
      <FileGrid
        on:open={handleOpen}
        on:deleteNodes={handleDelete}
        on:duplicate={handleDuplicate}
        on:rename={handleRename}
        on:getInfo={handleGetInfo}
        on:openInNotes={handleOpenInNotes}
      />

      {#if $showPreview}
        <Preview nodeId={previewNodeId} />
      {/if}
    </main>
  </div>

  <!-- ── Status bar ───────────────────────────────────────────── -->
  <StatusBar />

  <!-- ── Modal overlays ───────────────────────────────────────── -->
  {#if lightboxNode}
    <Lightbox node={lightboxNode} on:close={() => (lightboxNode = null)} />
  {/if}

  {#if infoPanelNode}
    <InfoPanel node={infoPanelNode} on:close={() => (infoPanelNode = null)} />
  {/if}
</div>

<style>
  /* The root container fills whatever window it's placed in */
  .finder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #f0efea;
    border-radius: 0.75rem;
    overflow: hidden;
    font-family: -apple-system, "SF Pro Text", sans-serif;
    font-size: 13px;
    color: #1c1c1e;
    user-select: none;
  }

  .body {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .main {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  /* Dark mode root */
  :global(#desktop.dark-mode) .finder {
    background: #1c1c1e;
    color: #f5f5f7;
  }
</style>
