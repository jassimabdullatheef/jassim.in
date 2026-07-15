<script>
  import { createEventDispatcher } from "svelte";

  export let title = "";
  export let x = 120;
  export let y = 80;
  export let width = 480;
  export let height = 360;
  export let minWidth = 260;
  export let minHeight = 160;

  const dispatch = createEventDispatcher();

  let dragging = false;
  let resizing = false;
  let maximized = false;
  let prevRect = null;
  let startX, startY, startLeft, startTop, startW, startH;

  function toggleMaximize() {
    if (maximized) {
      maximized = false;
      if (prevRect) ({ x, y, width, height } = prevRect);
    } else {
      prevRect = { x, y, width, height };
      maximized = true;
    }
  }

  function startDrag(e) {
    if (maximized) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = x;
    startTop = y;
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", stopDrag);
  }
  function onDragMove(e) {
    if (!dragging) return;
    const maxX = Math.max(0, window.innerWidth - 60);
    const maxY = Math.max(0, window.innerHeight - 40);
    x = Math.min(maxX, Math.max(-width + 60, startLeft + (e.clientX - startX)));
    y = Math.min(maxY, Math.max(0, startTop + (e.clientY - startY)));
  }
  function stopDrag() {
    dragging = false;
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", stopDrag);
  }

  function startResize(e) {
    if (maximized) return;
    e.stopPropagation();
    resizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startW = width;
    startH = height;
    window.addEventListener("pointermove", onResizeMove);
    window.addEventListener("pointerup", stopResize);
  }
  function onResizeMove(e) {
    if (!resizing) return;
    const maxWidth = window.innerWidth - x - 4;
    const maxHeight = window.innerHeight - y - 4;
    width = Math.min(maxWidth, Math.max(minWidth, startW + (e.clientX - startX)));
    height = Math.min(maxHeight, Math.max(minHeight, startH + (e.clientY - startY)));
  }
  function stopResize() {
    resizing = false;
    window.removeEventListener("pointermove", onResizeMove);
    window.removeEventListener("pointerup", stopResize);
  }
</script>

<div
  class="fwin"
  class:maximized
  style={maximized ? "left:0; top:0; width:100%; height:100%;" : `left:${x}px; top:${y}px; width:${width}px; height:${height}px;`}
  on:pointerdown|stopPropagation
  on:contextmenu|stopPropagation
  role="dialog"
  aria-label={title}
>
  <div class="fwin-titlebar" on:pointerdown={startDrag} on:dblclick={toggleMaximize}>
    <span class="fwin-title">{title}</span>
    <span class="fwin-actions">
      <button class="fwin-max" on:pointerdown|stopPropagation on:click={toggleMaximize} aria-label={maximized ? "Restore" : "Maximize"}>{maximized ? "❐" : "□"}</button>
      <button class="fwin-close" on:pointerdown|stopPropagation on:click={() => dispatch("close")} aria-label="Close">×</button>
    </span>
  </div>
  <div class="fwin-body">
    <slot />
  </div>
  {#if !maximized}
    <div class="fwin-resize" on:pointerdown={startResize}></div>
  {/if}
</div>

<style lang="scss">
  .fwin {
    position: absolute;
    z-index: 70;
    display: flex;
    flex-direction: column;
    background: var(--bg2, #0c130d);
    border: 1px solid var(--border, #1b2e20);
    border-radius: 8px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    overflow: hidden;
    max-width: 100vw;
    max-height: 100vh;
  }
  .fwin.maximized {
    border-radius: 0;
    box-shadow: none;
  }
  .fwin-titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    background: var(--bg, #070c08);
    border-bottom: 1px solid var(--border, #1b2e20);
    cursor: grab;
    user-select: none;
    touch-action: none;
    font-size: 12.5px;
    color: var(--dim, #4e7a5c);
    flex-shrink: 0;
  }
  .fwin-titlebar:active {
    cursor: grabbing;
  }
  .fwin-title {
    color: var(--fg, #9fe8b2);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fwin-actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .fwin-max,
  .fwin-close {
    background: transparent;
    border: none;
    color: var(--dim, #4e7a5c);
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
    padding: 2px 6px;
    font-family: inherit;
  }
  .fwin-close {
    font-size: 16px;
  }
  .fwin-max:hover,
  .fwin-close:hover {
    color: var(--accent2, #b7ffd0);
  }
  .fwin-body {
    flex: 1;
    overflow: auto;
    position: relative;
  }
  .fwin-resize {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 24px;
    height: 24px;
    cursor: nwse-resize;
    touch-action: none;
  }
  .fwin-resize::after {
    content: "";
    position: absolute;
    right: 3px;
    bottom: 3px;
    width: 8px;
    height: 8px;
    border-right: 2px solid var(--border, #1b2e20);
    border-bottom: 2px solid var(--border, #1b2e20);
  }
</style>
