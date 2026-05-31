// ─────────────────────────────────────────────────────────────
//  main.ts — entry point
//
//  Mounts the Finder Svelte component and (optionally) exposes
//  a global openFinderWindow() so the macOS shell can launch it
//  exactly like the original vanilla JS version did.
// ─────────────────────────────────────────────────────────────

import Finder from "./Finder.svelte";

// ── Standalone mount (dev / demo mode) ───────────────────────
//  When running outside the full macOS shell, just mount into
//  the page body so you can see the component on its own.
if (!("__createWindow" in window)) {
  const app = new Finder({
    target: document.getElementById("app") ?? document.body,
  });
}

// ── Shell integration ─────────────────────────────────────────
//  When loaded inside the macOS shell, register the same
//  openFinderWindow() global the rest of the shell calls.
(window as any).openFinderWindow = function () {
  const existing = (window as any).__finderSvelteInstance;
  const winEl    = existing?.$el?.closest?.(".app-window");

  if (winEl && document.contains(winEl)) return; // already open

  (window as any).__createWindow?.({
    appId:   "finder",
    title:   "Finder",
    width:   960,
    height:  580,
    content: (container: HTMLElement) => {
      const app = new Finder({ target: container });
      (window as any).__finderSvelteInstance = app;
      return container;
    },
  });
};
