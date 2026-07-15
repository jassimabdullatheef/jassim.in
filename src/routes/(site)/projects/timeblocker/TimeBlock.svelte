<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import CloseIcon from "$lib/icons/close.svelte";

  export let task;
  export let tasks;
  export let updateBlock;
  export let deleteBlock;
  export let scheduleTask;
  export let openTaskForm;

  const dispatch = createEventDispatcher();

  let blockRef;
  let isDragging = false;
  let isResizing = false;
  let dragStartY = 0;
  let dragStartHour = 0;
  let resizeStartY = 0;
  let resizeStartHeight = 0;
  let startHour = task.startHour;
  let duration = task.duration;
  let rafId = null;
  let dragOffsetY = 0;
  let hasMoved = false;

  $: taskData = tasks.find((t) => t.id === task.taskId);

  $: color = task.color === "work" ? "#77d2ff" : "#fde72d";
  $: bufferBefore = (taskData?.bufferBefore || 0) / 60;
  $: bufferAfter = (taskData?.bufferAfter || 0) / 60;

  $: containerStartHour = startHour - bufferBefore;
  $: hourSlotStart = Math.floor(startHour);
  $: containerOffsetInHour = containerStartHour - hourSlotStart;
  $: topPercent = containerOffsetInHour * 100;

  $: totalHeight = bufferBefore + duration + bufferAfter;
  $: totalHeightPercent = totalHeight * 100;

  $: bufferBeforeHeightPercent =
    totalHeight > 0 ? (bufferBefore / totalHeight) * 100 : 0;
  $: blockContentHeightPercent =
    totalHeight > 0 ? (duration / totalHeight) * 100 : 100;
  $: bufferAfterHeightPercent =
    totalHeight > 0 ? (bufferAfter / totalHeight) * 100 : 0;
  $: displayDuration = Math.round(duration * 60);

  function formatTime(hour) {
    const hourInt = Math.floor(hour);
    const minutes = Math.round((hour % 1) * 60);
    const displayHour =
      hourInt === 0 ? 12 : hourInt > 12 ? hourInt - 12 : hourInt;
    const period = hourInt < 12 ? "AM" : "PM";
    return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
  }

  $: displayTime = `${formatTime(startHour)} - ${formatTime(startHour + duration)}`;

  $: if (task.startHour !== undefined && !isDragging && !isResizing) {
    startHour = task.startHour;
  }
  $: if (task.duration !== undefined && !isDragging && !isResizing) {
    duration = task.duration;
  }

  function handleMouseDown(event) {
    if (event.target.closest(".delete-btn")) {
      return;
    }

    if (event.target.classList.contains("resize-handle")) {
      isResizing = true;
      resizeStartY = event.clientY;
      resizeStartHeight = duration;
      event.preventDefault();
    } else {
      isDragging = true;
      dragStartY = event.clientY;
      dragStartHour = startHour;
      dragOffsetY = 0;
      hasMoved = false;

      event.preventDefault();
    }
  }

  function handleMouseMove(event) {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      const timelineGrid = blockRef.closest(".timeline-grid");
      if (!timelineGrid) return;

      const mouseY = event.clientY;
      const gridRect = timelineGrid.getBoundingClientRect();

      const hourSlots = Array.from(timelineGrid.querySelectorAll(".hour-slot"));
      if (hourSlots.length === 0) return;

      const firstHour = parseInt(hourSlots[0].dataset.hour) || 0;

      if (isResizing) {
        const gridHeight = timelineGrid.offsetHeight;
        const visibleHoursCount = hourSlots.length;
        const hourHeight = gridHeight / visibleHoursCount;
        const deltaY = mouseY - resizeStartY;
        const deltaHours = deltaY / hourHeight;

        let newDuration = Math.max(0.25, resizeStartHeight + deltaHours);
        newDuration = Math.min(newDuration, 24 - startHour);
        const roundedDuration = Math.round(newDuration * 4) / 4;

        if (roundedDuration !== duration) {
          duration = roundedDuration;
        }
      } else if (isDragging) {
        const deltaY = mouseY - dragStartY;
        dragOffsetY = deltaY;

        if (Math.abs(deltaY) > 3) {
          hasMoved = true;
        }
      }

      rafId = null;
    });
  }

  function handleMouseUp(event) {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    if (isResizing) {
      updateBlock(task.id, {
        startHour,
        duration,
      });
    } else if (isDragging) {
      if (hasMoved) {
        const timelineGrid = blockRef?.closest(".timeline-grid");
        if (timelineGrid && blockRef) {
          const gridRect = timelineGrid.getBoundingClientRect();
          const blockRect = blockRef.getBoundingClientRect();
          const hourSlots = Array.from(
            timelineGrid.querySelectorAll(".hour-slot")
          );
          if (hourSlots.length > 0) {
            const firstHour = parseInt(hourSlots[0].dataset.hour) || 0;

            const blockTopRelativeToGrid = blockRect.top - gridRect.top;

            let targetHour = firstHour;
            let blockTopOffsetInHour = 0;

            for (let i = 0; i < hourSlots.length; i++) {
              const slot = hourSlots[i];
              const slotRect = slot.getBoundingClientRect();
              const slotRelativeTop = slotRect.top - gridRect.top;
              const slotRelativeBottom = slotRect.bottom - gridRect.top;

              if (
                blockTopRelativeToGrid >= slotRelativeTop &&
                blockTopRelativeToGrid <= slotRelativeBottom
              ) {
                targetHour = parseInt(slot.dataset.hour) || firstHour;
                const slotHourContent = slot.querySelector(".hour-content");
                if (slotHourContent) {
                  const contentRect = slotHourContent.getBoundingClientRect();
                  const contentRelativeTop = contentRect.top - gridRect.top;
                  const blockTopInContent =
                    blockTopRelativeToGrid - contentRelativeTop;
                  const hourContentHeight = slotHourContent.offsetHeight;
                  blockTopOffsetInHour = Math.max(
                    0,
                    Math.min(1, blockTopInContent / hourContentHeight)
                  );
                }
                break;
              }
            }

            let newStartHour = targetHour + blockTopOffsetInHour;

            newStartHour = Math.max(0, Math.min(24 - duration, newStartHour));
            const roundedStartHour = Math.round(newStartHour * 4) / 4;

            startHour = roundedStartHour;

            updateBlock(task.id, {
              startHour: roundedStartHour,
              duration,
            });
          }
        }
      } else {
        if (openTaskForm && taskData) {
          openTaskForm(taskData);
        }
      }

      dragOffsetY = 0;
      hasMoved = false;
    }

    isDragging = false;
    isResizing = false;
  }

  function handleRemove() {
    if (confirm(`Remove "${taskData?.name || "this task"}" from schedule?`)) {
      deleteBlock(task.id);
    }
  }

  let listenersActive = false;

  $: if ((isDragging || isResizing) && !listenersActive) {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    listenersActive = true;
  } else if (!isDragging && !isResizing && listenersActive) {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    listenersActive = false;
  }

  onDestroy(() => {
    if (listenersActive) {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  });
</script>

<div
  class="time-block"
  class:dragging={isDragging}
  class:resizing={isResizing}
  style="top: {topPercent}%; height: {totalHeightPercent}%; transform: {isDragging
    ? `translateY(${dragOffsetY}px)`
    : 'none'};"
  bind:this={blockRef}
  on:mousedown={handleMouseDown}
  role="button"
  tabindex="0"
>
  {#if bufferBefore > 0}
    <div
      class="buffer-zone buffer-before"
      style="flex: 0 0 {bufferBeforeHeightPercent}%;"
    ></div>
  {/if}
  <div
    class="block-content"
    style="flex: 0 0 {blockContentHeightPercent}%; background-color: {color};"
  >
    <div class="block-header">
      <span class="block-name">{taskData?.name || "Unknown Task"}</span>
      <button
        class="delete-btn"
        on:click|stopPropagation={handleRemove}
        on:mousedown|stopPropagation
        title="Remove from schedule"
      >
        <CloseIcon />
      </button>
    </div>
    <div class="block-time">
      {displayTime}
    </div>
    <div class="block-duration">{displayDuration} min</div>
    <div class="resize-handle" title="Drag to resize"></div>
  </div>
  {#if bufferAfter > 0}
    <div
      class="buffer-zone buffer-after"
      style="flex: 0 0 {bufferAfterHeightPercent}%;"
    ></div>
  {/if}
</div>

<style scoped lang="scss">
  .time-block {
    position: absolute;
    left: 0;
    right: 0;
    min-height: 30px;
    cursor: move;
    transition: box-shadow 0.2s ease;
    z-index: 10;
    overflow: visible;
    display: flex;
    flex-direction: column;
    padding: 0;
    box-sizing: border-box;

    &:hover:not(.dragging):not(.resizing) {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 20;
    }

    &:active {
      cursor: grabbing;
    }

    &.dragging,
    &.resizing {
      transition: none !important;
      z-index: 100;
      pointer-events: none;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      will-change: top, height;
    }
  }

  .block-content {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    color: rgba(0, 0, 0, 0.9);
    border-radius: 6px;
    padding: 0.5rem;
    padding-bottom: 0.25rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.2);
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
    min-height: 0;
  }

  .buffer-zone {
    width: 100%;
    flex-shrink: 0;
    min-height: 4px;
    background: repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.1),
      rgba(255, 255, 255, 0.1) 10px,
      rgba(255, 255, 255, 0.05) 10px,
      rgba(255, 255, 255, 0.05) 20px
    );
    border-left: 2px solid rgba(255, 255, 255, 0.2);
    border-right: 2px solid rgba(255, 255, 255, 0.2);
    opacity: 0.6;
    box-sizing: border-box;
  }

  .buffer-before {
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    border-top: 2px solid rgba(255, 255, 255, 0.2);
  }

  .buffer-after {
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  }

  .block-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.25rem;
  }

  .block-name {
    font-weight: 600;
    font-size: 0.9rem;
    line-height: 1.2;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .delete-btn {
    border: none;
    color: rgba(0, 0, 0, 0.7);
    width: 20px;
    height: 20px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s ease;
    padding: 2px;
    margin-left: 0.25rem;

    :global(svg) {
      width: 100%;
      height: 100%;
    }

    &:hover {
      background: rgba(0, 0, 0, 0.4);
      color: rgba(0, 0, 0, 1);
    }
  }

  .block-time {
    font-size: 0.75rem;
    opacity: 0.8;
    margin-bottom: 0.125rem;
    font-weight: 500;
  }

  .block-duration {
    font-size: 0.7rem;
    opacity: 0.7;
    margin-top: auto;
  }

  .resize-handle {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 8px;
    cursor: ns-resize;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 0 0 6px 6px;
    transition: background 0.2s ease;
    z-index: 1;

    &:hover {
      background: rgba(0, 0, 0, 0.2);
    }

    &::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 30px;
      height: 3px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 2px;
    }
  }
</style>
