<!-- ─────────────────────────────────────────────────────────────
     components/ContextMenu.svelte
     Generic right-click context menu.
     Parent builds the items array and passes x/y coordinates.
───────────────────────────────────────────────────────────── -->

<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";

  export interface CtxItem {
    label?:  string;
    icon?:   string;   // emoji or svg string
    action?: () => void;
    danger?: boolean;
    sep?:    true;      // render a separator instead of a button
  }

  export let items: CtxItem[] = [];
  export let x = 0;
  export let y = 0;

  const dispatch = createEventDispatcher<{ close: void }>();

  let menuEl: HTMLDivElement;

  // After mounting, adjust position so the menu never goes off-screen
  onMount(() => {
    const rect = menuEl.getBoundingClientRect();
    if (rect.right  > window.innerWidth)  x = x - rect.width;
    if (rect.bottom > window.innerHeight) y = y - rect.height;

    // Close on any outside click
    setTimeout(() => document.addEventListener("click", handleOutsideClick), 10);
  });

  onDestroy(() => {
    document.removeEventListener("click", handleOutsideClick);
  });

  function handleOutsideClick(e: MouseEvent) {
    if (!menuEl?.contains(e.target as Node)) {
      dispatch("close");
    }
  }

  function trigger(item: CtxItem) {
    item.action?.();
    dispatch("close");
  }
</script>

<div
  bind:this={menuEl}
  class="ctx-menu"
  style="left:{x}px; top:{y}px;"
  on:contextmenu|preventDefault
>
  {#each items as item}
    {#if item.sep}
      <div class="sep"></div>
    {:else}
      <button
        class="item"
        class:danger={item.danger}
        on:click={() => trigger(item)}
      >
        {#if item.icon}
          <span class="icon">{@html item.icon}</span>
        {/if}
        {item.label}
      </button>
    {/if}
  {/each}
</div>

<style>
  .ctx-menu {
    position: fixed;
    background: rgba(248, 248, 248, 0.96);
    border: 0.5px solid rgba(0, 0, 0, 0.15);
    border-radius: 10px;
    padding: 4px;
    min-width: 170px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(20px);
    z-index: 99999;
    user-select: none;
  }

  .item {
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

  .item:hover        { background: rgba(0, 122, 255, 0.1); color: #0a7aff; }
  .item.danger       { color: #ff3b30; }
  .item.danger:hover { background: rgba(255, 59, 48, 0.1); color: #ff3b30; }

  .icon {
    width: 16px;
    text-align: center;
    font-size: 12px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sep {
    height: 0.5px;
    background: rgba(0, 0, 0, 0.1);
    margin: 3px 6px;
  }

  /* Dark mode */
  :global(#desktop.dark-mode) .ctx-menu {
    background: rgba(44, 44, 46, 0.96);
    border-color: rgba(255, 255, 255, 0.1);
  }
  :global(#desktop.dark-mode) .item { color: #f5f5f7; }
  :global(#desktop.dark-mode) .sep  { background: rgba(255, 255, 255, 0.08); }
</style>
