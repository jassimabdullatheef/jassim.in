<script>
  import { onMount } from "svelte";
  import CheckIcon from "$lib/icons/check.svelte";
  import SquareIcon from "$lib/icons/square.svelte";
  import PractiveDrillsDetails from "./PractiveDrillsDetails.svelte";
  import practiceDrillsData from "./practice-drills.json";

  /** @type {string | null} */
  export let selectedKey = null;
  /** @type {{ name: string; alternateNames: string[]; intervals: string[]; description: string } | null} */
  export let selectedScale = null;

  /** @type {{ [key: string]: boolean }} */
  let completionData = {};
  /** @type {{ id: number; name: string; description: string; instructions: string; videoReferences: Array<{ title: string; source: string; url: string }> } | null} */
  let selectedDrill = null;
  let showDetailsDialog = false;
  /** @type {{ completed: number; total: number; percentage: number }} */
  let drillProgress = { completed: 0, total: practiceDrillsData.length, percentage: 0 };

  /**
   * @param {string} key
   * @param {string} scaleName
   * @param {number} drillId
   */
  function getDrillCompletionKey(key, scaleName, drillId) {
    return `${key}-${scaleName}-${drillId}`;
  }

  /**
   * @param {string} key
   * @param {string} scaleName
   * @param {{ [key: string]: boolean }} data
   */
  function getDrillProgress(key, scaleName, data) {
    if (!key || !scaleName) {
      return { completed: 0, total: practiceDrillsData.length, percentage: 0 };
    }
    const completed = practiceDrillsData.filter((drill) => {
      const completionKey = getDrillCompletionKey(key, scaleName, drill.id);
      return data[completionKey] === true;
    }).length;
    return {
      completed,
      total: practiceDrillsData.length,
      percentage: Math.round((completed / practiceDrillsData.length) * 100),
    };
  }

  onMount(() => {
    // Load completion data from localStorage
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        const stored = localStorage.getItem("drill-progress");
        if (stored) {
          completionData = JSON.parse(stored);
        } else {
          completionData = {};
        }
      } catch (error) {
        console.error("Error loading drill completion data:", error);
        completionData = {};
      }
    }
  });

  /**
   * @param {number} drillId
   * @param {MouseEvent | KeyboardEvent} event
   */
  function handleToggleCompletion(drillId, event) {
    event.stopPropagation();
    event.preventDefault();
    
    if (!selectedKey || !selectedScale) {
      return;
    }

    const completionKey = getDrillCompletionKey(selectedKey, selectedScale.name, drillId);
    completionData[completionKey] = !completionData[completionKey];

    try {
      localStorage.setItem("drill-progress", JSON.stringify(completionData));
    } catch (error) {
      console.error("Error saving drill progress:", error);
    }

    // Trigger reactivity
    completionData = { ...completionData };
  }

  // Reactive progress calculation - depends on completionData, selectedKey, and selectedScale
  $: {
    if (selectedKey && selectedScale) {
      // Calculate directly in reactive block to ensure Svelte tracks completionData
      const completed = practiceDrillsData.filter((drill) => {
        const completionKey = getDrillCompletionKey(selectedKey, selectedScale.name, drill.id);
        return completionData[completionKey] === true;
      }).length;
      drillProgress = {
        completed,
        total: practiceDrillsData.length,
        percentage: Math.round((completed / practiceDrillsData.length) * 100),
      };
    } else {
      drillProgress = { completed: 0, total: practiceDrillsData.length, percentage: 0 };
    }
  }

  /**
   * @param {{ id: number; name: string; description: string; instructions: string; videoReferences: Array<{ title: string; source: string; url: string }> }} drill
   */
  function handleShowDetails(drill) {
    selectedDrill = drill;
    showDetailsDialog = true;
  }

  function handleCloseDetails() {
    showDetailsDialog = false;
    selectedDrill = null;
  }
</script>

<div class="practice-drills">
  <div class="drills-header">
    <h5 class="section-title">Practice Drills</h5>
    {#if selectedKey && selectedScale}
      <div class="drill-progress">
        <div class="progress-bar-container small">
          <div
            class="progress-bar"
            style="width: {drillProgress.percentage}%"
          ></div>
        </div>
        <span class="progress-text"
          >{drillProgress.completed} / {drillProgress.total} drills completed</span
        >
      </div>
    {:else}
      <p class="no-selection">Select a scale to track drill progress</p>
    {/if}
  </div>
  <div class="drills-list">
    {#each practiceDrillsData as drill (drill.id)}
      {@const isCompleted = selectedKey && selectedScale
        ? completionData[getDrillCompletionKey(selectedKey, selectedScale.name, drill.id)] === true
        : false}
      <button
        type="button"
        class="drill-button"
        class:completed={isCompleted}
        on:click={() => handleShowDetails(drill)}
        disabled={!selectedKey || !selectedScale}
      >
        <span
          class="drill-icon"
          on:click={(e) => handleToggleCompletion(drill.id, e)}
          role="button"
          tabindex="0"
          on:keydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleToggleCompletion(drill.id, e);
            }
          }}
        >
          {#if isCompleted}
            <CheckIcon />
          {:else}
            <SquareIcon />
          {/if}
        </span>
        <span class="drill-name">{drill.name}</span>
      </button>
    {/each}
  </div>
</div>

{#if showDetailsDialog && selectedDrill}
  <PractiveDrillsDetails
    drill={selectedDrill}
    on:close={handleCloseDetails}
  />
{/if}

<style lang="scss">
  .practice-drills {
    margin-top: 2rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
  }

  .drills-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .section-title {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 600;
    margin: 0;
  }

  .drill-progress {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .progress-bar-container {
    width: 150px;
    height: 16px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    overflow: hidden;
    position: relative;

    &.small {
      width: 150px;
      height: 16px;
    }
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(119, 210, 255, 0.8),
      rgba(253, 231, 45, 0.8)
    );
    transition: width 0.3s ease;
    border-radius: 12px;
  }

  .progress-text {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    white-space: nowrap;
  }

  .no-selection {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.5);
    font-style: italic;
    margin: 0;
  }

  .drills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .drill-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.5rem;
    font-weight: 200;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: inherit;
    position: relative;
    overflow: hidden;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
      transition: transform 0.1s ease;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.completed {
      background: rgba(119, 210, 255, 0.1);
      border-color: rgba(119, 210, 255, 0.3);

      .drill-name {
        color: rgba(119, 210, 255, 1);
        text-decoration: line-through;
        opacity: 0.8;
      }

      &:hover:not(:disabled) {
        background: rgba(119, 210, 255, 0.15);
        border-color: rgba(119, 210, 255, 0.4);
      }
    }
  }

  .drill-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.1rem;
    height: 1.1rem;
    flex-shrink: 0;
    cursor: pointer;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    color: rgba(255, 255, 255, 0.7);

    &:hover {
      transform: scale(1.1);
      color: rgba(255, 255, 255, 0.9);
    }

    :global(svg) {
      width: 100%;
      height: 100%;
    }
  }

  .drill-name {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 300;
    font-size: 0.8rem;
    white-space: nowrap;
  }
</style>

