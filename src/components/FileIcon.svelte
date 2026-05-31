<!-- ─────────────────────────────────────────────────────────────
     components/FileIcon.svelte
     Renders the right icon for any FSNode.
     Priority: image thumbnail → PNG from icons/ → emoji fallback
───────────────────────────────────────────────────────────── -->

<script lang="ts">
  import type { FSNode } from "../types/fs";
  import { TYPE_EMOJI, TYPE_COLOR } from "../lib/fs";

  export let node: FSNode;
  export let size: number = 56;

  // Which PNG to attempt loading
  const ICON_FILES: Record<string, string> = {
    folder:  "folder.png",
    image:   "file-image.png",
    text:    "file-text.png",
    pdf:     "file-pdf.png",
    music:   "file-music.png",
    video:   "file-video.png",
    archive: "file-archive.png",
    dmg:     "file-dmg.png",
    app:     "file-app.png",
    pkg:     "file-pkg.png",
    doc:     "file-doc.png",
    xls:     "file-xls.png",
    ppt:     "file-ppt.png",
    pages:   "file-pages.png",
    numbers: "file-numbers.png",
    keynote: "file-keynote.png",
    unknown: "file-generic.png",
  };

  // Track whether the PNG loaded successfully
  let pngFailed = false;

  $: iconFile  = ICON_FILES[node.type] ?? ICON_FILES.unknown;
  $: iconPath  = `icons/${iconFile}`;
  $: emoji     = TYPE_EMOJI[node.type] ?? "📄";
  $: accentColor = TYPE_COLOR[node.type] ?? "#8E8E93";
  $: isThumb   = node.type === "image" && !!node.dataUrl;

  // Recalculate if the node changes (e.g. after rename)
  $: { pngFailed = false; }
</script>

<div
  class="file-icon"
  style="width:{size}px; height:{size}px;"
>
  {#if isThumb}
    <!-- Image files show their actual thumbnail -->
    <img
      src={node.dataUrl}
      alt={node.name}
      class="thumb"
      style="width:{size}px; height:{size}px; border-radius:{Math.round(size * 0.12)}px;"
    />

  {:else if !pngFailed}
    <!-- Try the PNG from icons/ directory -->
    <img
      src={iconPath}
      alt={node.type}
      style="width:{size}px; height:{size}px; object-fit:contain;"
      on:error={() => (pngFailed = true)}
    />

  {:else}
    <!-- Emoji fallback — styled box that matches the type's accent color -->
    <div
      class="emoji-box"
      style="
        width:{size}px;
        height:{size}px;
        background:{accentColor}20;
        border:1.5px solid {accentColor}44;
        border-radius:{Math.round(size * 0.18)}px;
        font-size:{Math.round(size * 0.52)}px;
      "
    >
      {emoji}
    </div>
  {/if}
</div>

<style>
  .file-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
  }

  .thumb {
    object-fit: cover;
  }

  .emoji-box {
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
