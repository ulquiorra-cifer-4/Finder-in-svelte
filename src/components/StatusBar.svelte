<!-- ─────────────────────────────────────────────────────────────
     components/StatusBar.svelte
     Thin bar at the bottom of Finder showing item count
     and selected item count.
───────────────────────────────────────────────────────────── -->

<script lang="ts">
  import { currentItems, selectedIds } from "../stores";

  $: total    = $currentItems.length;
  $: selCount = $selectedIds.size;
</script>

<div class="statusbar">
  {#if selCount > 0}
    {selCount} item{selCount !== 1 ? "s" : ""} selected
  {:else}
    {total} item{total !== 1 ? "s" : ""}
  {/if}
</div>

<style>
  .statusbar {
    height: 22px;
    min-height: 22px;
    background: rgba(232, 230, 226, 0.97);
    border-top: 0.5px solid rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: rgba(0, 0, 0, 0.4);
    flex-shrink: 0;
    user-select: none;
  }

  :global(#desktop.dark-mode) .statusbar {
    background: rgba(28, 28, 30, 0.97);
    border-top-color: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.35);
  }
</style>
