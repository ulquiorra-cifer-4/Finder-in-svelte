<!-- ─────────────────────────────────────────────────────────────
     components/Lightbox.svelte
     Full-screen image viewer modal.
     Click backdrop or press Escape to close.
───────────────────────────────────────────────────────────── -->

<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import type { FSNode } from "../types/fs";

  export let node: FSNode;

  const dispatch = createEventDispatcher<{ close: void }>();

  function close() { dispatch("close"); }

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  onMount(()  => document.addEventListener("keydown", handleKey));
  onDestroy(() => document.removeEventListener("keydown", handleKey));
</script>

<div class="backdrop" on:click={close}>
  <div class="content" on:click|stopPropagation>
    <button class="close-btn" on:click={close}>✕</button>
    <img src={node.dataUrl} alt={node.name} class="img" />
    <div class="name">{node.name}</div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(6px);
    animation: fade-in 150ms ease;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    max-width: 90vw;
    max-height: 90vh;
  }

  .close-btn {
    position: absolute;
    top: -40px;
    right: 0;
    background: rgba(255, 255, 255, 0.15);
    border: none;
    color: #fff;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 100ms;
  }
  .close-btn:hover { background: rgba(255, 255, 255, 0.25); }

  .img {
    max-width: 100%;
    max-height: 75vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  .name {
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
  }
</style>
