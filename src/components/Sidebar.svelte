<!-- ─────────────────────────────────────────────────────────────
     components/Sidebar.svelte
     Left-hand navigation panel.
     Sections: Recents/Shared → Favourites → Locations
───────────────────────────────────────────────────────────── -->

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { SidebarLocation } from "../types/fs";
  import { currentFolderId } from "../stores";

  const dispatch = createEventDispatcher<{ navigate: SidebarLocation }>();

  // All the static sidebar entries — split into sections below
  const ITEMS: SidebarLocation[] = [
    { id: "recents",    label: "Recents",       icon: "recents",    fsId: null,          virtual: "recents" },
    { id: "shared",     label: "Shared",         icon: "shared",     fsId: null },
    { id: "applications",label: "Applications", icon: "apps",       fsId: "apps_folder" },
    { id: "downloads",  label: "Downloads",      icon: "downloads",  fsId: "downloads" },
    { id: "desktop",    label: "Desktop",        icon: "desktop",    fsId: "desktop" },
    { id: "documents",  label: "Documents",      icon: "documents",  fsId: "documents" },
    { id: "icloud",     label: "iCloud Drive",   icon: "icloud",     fsId: null,          virtual: "icloud" },
    { id: "home",       label: "dannyrico1",     icon: "home",       fsId: null,          virtual: "home" },
    { id: "macintosh",  label: "Macintosh HD",   icon: "drive",      fsId: null },
  ];

  const SECTIONS = [
    { label: null,         items: ITEMS.slice(0, 2) },
    { label: "Favourites", items: ITEMS.slice(2, 6) },
    { label: "Locations",  items: ITEMS.slice(6) },
  ];

  // Which item is currently active — synced to the folder store
  let activeId = "icloud";

  function handleClick(loc: SidebarLocation) {
    activeId = loc.id;
    dispatch("navigate", loc);
  }

  // Auto-highlight when currentFolderId matches an fsId
  $: {
    const match = ITEMS.find(i => i.fsId === $currentFolderId);
    if (match) activeId = match.id;
  }
</script>

<aside class="sidebar">
  {#each SECTIONS as section}
    {#if section.label}
      <p class="section-label">{section.label}</p>
    {/if}

    {#each section.items as loc}
      <button
        class="item"
        class:active={loc.id === activeId}
        on:click={() => handleClick(loc)}
      >
        <span class="icon">
          {@html getSvgIcon(loc.icon)}
        </span>
        <span class="name">{loc.label}</span>
      </button>
    {/each}
  {/each}
</aside>

<!-- ── SVG icons (self-contained, no external deps) ─────────── -->
<script lang="ts" context="module">
  const ICONS: Record<string, string> = {
    recents:   `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>`,
    shared:    `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>`,
    apps:      `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>`,
    downloads: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
    desktop:   `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/></svg>`,
    documents: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`,
    icloud:    `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>`,
    home:      `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    drive:     `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M4 20h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2zM4 6h16v12H4V6z"/></svg>`,
  };

  export function getSvgIcon(name: string): string {
    return ICONS[name] ?? ICONS.documents;
  }
</script>

<style>
  .sidebar {
    width: 200px;
    min-width: 200px;
    background: rgba(236, 234, 229, 0.98);
    border-right: 0.5px solid rgba(0, 0, 0, 0.1);
    padding: 8px 0;
    overflow-y: auto;
    flex-shrink: 0;
  }

  .section-label {
    font-size: 10.5px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.4);
    padding: 10px 14px 4px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin: 0;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 12px;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 7px;
    margin: 1px 6px;
    width: calc(100% - 12px);
    text-align: left;
    font-size: 12.5px;
    color: #1c1c1e;
    transition: background 80ms;
    font-family: -apple-system, "SF Pro Text", sans-serif;
  }

  .item:hover  { background: rgba(0, 0, 0, 0.06); }
  .item.active { background: rgba(0, 0, 0, 0.1); font-weight: 500; }

  .icon {
    color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .item.active .icon { color: #0a84ff; }

  .name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Dark mode */
  :global(#desktop.dark-mode) .sidebar {
    background: rgba(36, 36, 38, 0.98);
    border-right-color: rgba(255, 255, 255, 0.08);
  }
  :global(#desktop.dark-mode) .section-label { color: rgba(255, 255, 255, 0.35); }
  :global(#desktop.dark-mode) .item          { color: #f5f5f7; }
  :global(#desktop.dark-mode) .item:hover    { background: rgba(255, 255, 255, 0.08); }
  :global(#desktop.dark-mode) .item.active   { background: rgba(255, 255, 255, 0.1); }
</style>
