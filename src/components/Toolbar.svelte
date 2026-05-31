<!-- ─────────────────────────────────────────────────────────────
     components/Toolbar.svelte
     Top bar: back/forward, breadcrumb, view-mode buttons,
     action buttons, search input.
───────────────────────────────────────────────────────────── -->

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    canGoBack, canGoForward, goBack, goForward,
    breadcrumb, currentFolderId, searchQuery, viewMode,
    navigateTo, fs,
  } from "../stores";
  import type { ViewMode } from "../types/fs";

  const dispatch = createEventDispatcher<{
    newFolder: void;
    newFile:   void;
    togglePreview: void;
  }>();

  let searchOpen = false;
  let searchEl: HTMLInputElement;

  $: title = (() => {
    if ($searchQuery) return `Search: "${$searchQuery}"`;
    const last = $breadcrumb.at(-1);
    return last?.name ?? "iCloud Drive";
  })();

  function toggleSearch() {
    searchOpen = !searchOpen;
    if (!searchOpen) searchQuery.set("");
    else setTimeout(() => searchEl?.focus(), 50);
  }

  function handleSearchInput(e: Event) {
    searchQuery.set((e.target as HTMLInputElement).value);
  }

  function changeView(mode: ViewMode) {
    viewMode.set(mode);
  }

  function clickBreadcrumb(nodeId: string | null) {
    navigateTo(nodeId);
  }

  // "More" menu state
  let moreMenuOpen = false;
  let moreMenuX = 0;
  let moreMenuY = 0;

  function openMoreMenu(e: MouseEvent) {
    moreMenuOpen = true;
    moreMenuX = (e.currentTarget as HTMLElement).getBoundingClientRect().left - 80;
    moreMenuY = (e.currentTarget as HTMLElement).getBoundingClientRect().bottom + 4;
    setTimeout(() => document.addEventListener("click", closeMoreMenu), 10);
  }

  function closeMoreMenu() {
    moreMenuOpen = false;
    document.removeEventListener("click", closeMoreMenu);
  }

  const VIEW_BUTTONS: Array<{ mode: ViewMode; title: string; svg: string }> = [
    {
      mode: "icons", title: "Icon View",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M3 3h8v8H3zm0 10h8v8H3zm10-10h8v8h-8zm0 10h8v8h-8z"/></svg>`,
    },
    {
      mode: "list", title: "List View",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>`,
    },
    {
      mode: "columns", title: "Column View",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M4 18h17v-2H4v2zM4 13h17v-2H4v2zM3 6v2h18V6H3z"/></svg>`,
    },
    {
      mode: "gallery", title: "Gallery View",
      svg: `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/></svg>`,
    },
  ];
</script>

<header class="toolbar">
  <!-- Left: back / forward + title/breadcrumb -->
  <div class="left">
    <button class="btn" title="Back"    disabled={!$canGoBack}    on:click={goBack}>
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
    </button>
    <button class="btn" title="Forward" disabled={!$canGoForward} on:click={goForward}>
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
    </button>

    <div class="title-wrap">
      <span class="title">{title}</span>

      <!-- Breadcrumb — click any segment to navigate there -->
      {#if $breadcrumb.length > 0}
        <div class="breadcrumb">
          <button class="bc-seg" on:click={() => clickBreadcrumb(null)}>iCloud Drive</button>
          {#each $breadcrumb as node, i}
            <span class="bc-sep">›</span>
            <button
              class="bc-seg"
              class:bc-active={i === $breadcrumb.length - 1}
              on:click={() => clickBreadcrumb(node.id)}
            >{node.name}</button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Center: view-mode toggle group -->
  <div class="center">
    <div class="view-group">
      {#each VIEW_BUTTONS as vb}
        <button
          class="view-btn"
          class:active={$viewMode === vb.mode}
          title={vb.title}
          on:click={() => changeView(vb.mode)}
        >
          {@html vb.svg}
        </button>
      {/each}
    </div>

    <div class="divider"></div>

    <!-- Group-by button (visual only for now) -->
    <button class="btn" title="Group By">
      <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/></svg>
      <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10" style="margin-left:1px"><path d="M7 10l5 5 5-5z"/></svg>
    </button>
  </div>

  <!-- Right: share, tags, more, search, preview toggle -->
  <div class="right">
    <button class="btn" title="Share">
      <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
    </button>
    <button class="btn" title="Tags">
      <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/></svg>
    </button>

    <!-- More menu trigger -->
    <button class="btn" title="More options" on:click={openMoreMenu}>
      <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
    </button>

    <!-- Search toggle -->
    <button class="btn" title="Search" class:active={searchOpen} on:click={toggleSearch}>
      <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
    </button>

    {#if searchOpen}
      <div class="search-wrap">
        <input
          bind:this={searchEl}
          type="text"
          class="search-input"
          placeholder="Search"
          value={$searchQuery}
          on:input={handleSearchInput}
        />
      </div>
    {/if}

    <!-- Preview panel toggle -->
    <button
      class="btn pv-toggle"
      title="Preview"
      on:click={() => dispatch("togglePreview")}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
    </button>
  </div>
</header>

<!-- More menu (portal-style, fixed position) -->
{#if moreMenuOpen}
  <div class="ctx-menu" style="left:{moreMenuX}px; top:{moreMenuY}px;">
    <button class="ctx-item" on:click={() => { closeMoreMenu(); dispatch("newFolder"); }}>
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z"/></svg>
      New Folder
    </button>
    <button class="ctx-item" on:click={() => { closeMoreMenu(); dispatch("newFile"); }}>
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
      New Text File
    </button>
    <div class="ctx-sep"></div>
    <button class="ctx-item">
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
      Get Info
    </button>
  </div>
{/if}

<style>
  .toolbar {
    height: 52px;
    min-height: 52px;
    background: rgba(232, 230, 226, 0.97);
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    padding: 0 10px 0 80px;
    gap: 6px;
    flex-shrink: 0;
    backdrop-filter: blur(10px);
    position: relative;
  }

  .left   { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
  .center { display: flex; align-items: center; gap: 4px; flex: 1; justify-content: center; }
  .right  { display: flex; align-items: center; gap: 2px; flex-shrink: 0; margin-left: auto; }

  .btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(0, 0, 0, 0.55);
    transition: background 100ms;
  }
  .btn:hover    { background: rgba(0, 0, 0, 0.08); color: #000; }
  .btn:disabled { opacity: 0.3; cursor: default; pointer-events: none; }
  .btn.active   { background: rgba(0, 0, 0, 0.1); color: #000; }

  .divider { width: 0.5px; height: 18px; background: rgba(0, 0, 0, 0.15); margin: 0 2px; }

  .title-wrap { display: flex; flex-direction: column; gap: 1px; padding: 0 6px; }
  .title      { font-size: 13px; font-weight: 700; color: #1c1c1e; }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 10.5px;
    color: rgba(0, 0, 0, 0.4);
  }

  .bc-seg {
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    font-size: inherit;
    font-family: inherit;
    padding: 0;
    transition: color 100ms;
  }
  .bc-seg:hover  { color: #0a84ff; }
  .bc-active     { color: rgba(0, 0, 0, 0.6); cursor: default; }
  .bc-sep        { color: rgba(0, 0, 0, 0.25); font-size: 10px; }

  .view-group {
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 7px;
    padding: 2px;
    gap: 1px;
  }

  .view-btn {
    width: 26px;
    height: 24px;
    border-radius: 5px;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(0, 0, 0, 0.45);
    transition: background 80ms, color 80ms;
  }
  .view-btn:hover  { color: rgba(0, 0, 0, 0.7); }
  .view-btn.active { background: #fff; color: #000; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15); }

  .search-wrap {
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.07);
    border-radius: 7px;
    padding: 3px 8px;
    margin-left: 4px;
  }

  .search-input {
    width: 130px;
    background: none;
    border: none;
    outline: none;
    font-size: 12px;
    color: #1c1c1e;
    font-family: -apple-system, "SF Pro Text", sans-serif;
  }
  .search-input::placeholder { color: rgba(0, 0, 0, 0.3); }

  /* Context/more menu */
  .ctx-menu {
    position: fixed;
    background: rgba(248, 248, 248, 0.95);
    border: 0.5px solid rgba(0, 0, 0, 0.15);
    border-radius: 10px;
    padding: 4px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
    backdrop-filter: blur(20px);
    z-index: 99999;
    min-width: 160px;
  }

  .ctx-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 10px;
    background: none;
    border: none;
    border-radius: 7px;
    cursor: pointer;
    font-size: 12.5px;
    color: #1c1c1e;
    font-family: -apple-system, "SF Pro Text", sans-serif;
    text-align: left;
    transition: background 60ms;
  }
  .ctx-item:hover { background: rgba(0, 122, 255, 0.12); color: #0a84ff; }

  .ctx-sep {
    height: 0.5px;
    background: rgba(0, 0, 0, 0.1);
    margin: 3px 6px;
  }

  /* Dark mode */
  :global(#desktop.dark-mode) .toolbar {
    background: rgba(28, 28, 30, 0.97);
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
  :global(#desktop.dark-mode) .title   { color: #f5f5f7; }
  :global(#desktop.dark-mode) .btn     { color: rgba(255, 255, 255, 0.55); }
  :global(#desktop.dark-mode) .btn:hover { color: #fff; background: rgba(255,255,255,0.08); }
  :global(#desktop.dark-mode) .view-btn.active { background: rgba(255,255,255,0.12); color: #fff; }
  :global(#desktop.dark-mode) .search-input    { color: #f5f5f7; }
  :global(#desktop.dark-mode) .search-wrap     { background: rgba(255,255,255,0.08); }
</style>
