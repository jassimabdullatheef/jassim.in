<script>
  import { onMount } from "svelte";
  import scalesData from "./scales.json";
  import PractiveDrills from "./PractiveDrills.svelte";
  import ChevronRightIcon from "$lib/icons/chevron-right.svelte";

  const STORAGE_KEY = "scale-progress";

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  /** @type {{ [key: string]: boolean }} */
  export let completionData = {};
  let viewMode = "by-key"; // 'by-key' or 'by-scale'
  let stats = { completed: 0, total: 0, percentage: 0 };
  /** @type {string | null} */
  let selectedKey = "C";
  /** @type {{ name: string; alternateNames: string[]; intervals: string[]; description: string } | null} */
  let selectedScale =
    scalesData.scales.find((s) => s.name === "Ionian") || null;

  /** @type {{ [key: string]: boolean }} */
  let expandedKeys = {};
  /** @type {{ [key: string]: boolean }} */
  let expandedScales = {};

  // If completionData is not provided, load from localStorage
  onMount(() => {
    if (Object.keys(completionData).length === 0) {
      loadProgress();
    }
    // Expand first key and first scale by default
    if (scalesData.keys.length > 0) {
      expandedKeys = { [scalesData.keys[0]]: true };
    }
    if (scalesData.scales.length > 0) {
      expandedScales = { [scalesData.scales[0].name]: true };
    }
    // Dispatch initial selection if we have a default
    if (selectedKey && selectedScale) {
      dispatch("scale-selected", { key: selectedKey, scale: selectedScale });
    }
    // Dispatch initial viewMode
    dispatch("view-mode-change", { viewMode });
  });

  function loadProgress() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Create new object to trigger reactivity
        completionData = { ...parsed };
      } else {
        completionData = {};
      }
    } catch (error) {
      console.error("Error loading progress:", error);
      completionData = {};
    }
    // Force reactivity update
    completionData = { ...completionData };
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completionData));
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }

  /**
   * @param {string} key
   * @param {string} scaleName
   */
  function getCompletionKey(key, scaleName) {
    return `${key}-${scaleName}`;
  }

  /**
   * @param {string} key
   * @param {string} scaleName
   */
  function isCompleted(key, scaleName) {
    const completionKey = getCompletionKey(key, scaleName);
    return completionData[completionKey] === true;
  }

  /**
   * @param {string} key
   * @param {string} scaleName
   */
  function selectScale(key, scaleName) {
    selectedKey = key;
    selectedScale = scalesData.scales.find((s) => s.name === scaleName) || null;
    if (selectedScale) {
      dispatch("scale-selected", { key, scale: selectedScale });
    }
  }

  /**
   * @param {string} key
   * @param {string} scaleName
   */
  function toggleCompletion(key, scaleName) {
    const completionKey = getCompletionKey(key, scaleName);
    completionData[completionKey] = !completionData[completionKey];
    saveProgress();
    completionData = { ...completionData }; // Trigger reactivity
  }

  /**
   * @param {string} key
   */
  function getKeyProgress(key) {
    const scalesForKey = scalesData.scales.length;
    const completed = scalesData.scales.filter((scale) =>
      isCompleted(key, scale.name)
    ).length;
    return {
      completed,
      total: scalesForKey,
      percentage: Math.round((completed / scalesForKey) * 100),
    };
  }

  /**
   * @param {string} scaleName
   */
  function getScaleProgress(scaleName) {
    const keysForScale = scalesData.keys.length;
    const completed = scalesData.keys.filter((key) =>
      isCompleted(key, scaleName)
    ).length;
    return {
      completed,
      total: keysForScale,
      percentage: Math.round((completed / keysForScale) * 100),
    };
  }

  /**
   * @param {string} key
   */
  function toggleKeyExpanded(key) {
    expandedKeys = {
      ...expandedKeys,
      [key]: !expandedKeys[key],
    };
  }

  /**
   * @param {string} scaleName
   */
  function toggleScaleExpanded(scaleName) {
    expandedScales = {
      ...expandedScales,
      [scaleName]: !expandedScales[scaleName],
    };
  }

  // Reactive progress calculation - depends on completionData
  $: completionData,
    (stats = (() => {
      const total = scalesData.keys.length * scalesData.scales.length;
      const completed = Object.values(completionData).filter(
        (v) => v === true
      ).length;
      return {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    })());
</script>

<div class="scale-practice">
  <div class="header">
    <h2>Scale Practice Progress</h2>
    <div class="progress-summary">
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: {stats.percentage}%"></div>
      </div>
      <span class="progress-text"
        >{stats.completed} / {stats.total} completed ({stats.percentage}%)</span
      >
    </div>
  </div>

  <div class="controls">
    <div class="view-toggle">
      <button
        class="toggle-btn"
        class:active={viewMode === "by-key"}
        on:click={() => {
          viewMode = "by-key";
          dispatch("view-mode-change", { viewMode });
        }}
      >
        By Key
      </button>
      <button
        class="toggle-btn"
        class:active={viewMode === "by-scale"}
        on:click={() => {
          viewMode = "by-scale";
          dispatch("view-mode-change", { viewMode });
        }}
      >
        By Scale
      </button>
    </div>
  </div>

  {#if viewMode === "by-key"}
    <div class="keys-view">
      {#each scalesData.keys as key}
        {@const keyProgress = (() => {
          const scalesForKey = scalesData.scales.length;
          const completed = scalesData.scales.filter((scale) => {
            const completionKey = getCompletionKey(key, scale.name);
            return completionData[completionKey] === true;
          }).length;
          return {
            completed,
            total: scalesForKey,
            percentage: Math.round((completed / scalesForKey) * 100),
          };
        })()}
        {@const isExpanded = expandedKeys[key] === true}
        <div class="key-section">
          <button
            type="button"
            class="key-header"
            class:expanded={isExpanded}
            on:click={() => toggleKeyExpanded(key)}
          >
            <span class="chevron-icon">
              <ChevronRightIcon />
            </span>
            <h3 class="key-name">{key}</h3>
            <div class="key-progress">
              <div class="progress-bar-container small">
                <div
                  class="progress-bar"
                  style="width: {keyProgress.percentage}%"
                ></div>
              </div>
              <span class="progress-text"
                >{keyProgress.completed} / {keyProgress.total}</span
              >
            </div>
          </button>
          {#if isExpanded}
            <div class="scales-grid">
              {#each scalesData.scales as scale}
                {@const completionKey = getCompletionKey(key, scale.name)}
                {@const isChecked = completionData[completionKey] === true}
                {@const isSelected =
                  selectedKey === key && selectedScale?.name === scale.name}
                <button
                  type="button"
                  class="scale-item"
                  class:completed={isChecked}
                  class:selected={isSelected}
                  on:click|stopPropagation={() => selectScale(key, scale.name)}
                >
                  <span class="scale-name">{scale.name}</span>
                  {#if scale.alternateNames.length > 0}
                    <span class="alternate-names"
                      >({scale.alternateNames.join(", ")})</span
                    >
                  {/if}
                  {#if isChecked}
                    <span class="checkmark">✓</span>
                  {/if}
                </button>
              {/each}
            </div>
            <PractiveDrills {selectedKey} {selectedScale} />
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="scales-view">
      {#each scalesData.scales as scale}
        {@const scaleProgress = (() => {
          const keysForScale = scalesData.keys.length;
          const completed = scalesData.keys.filter((key) => {
            const completionKey = getCompletionKey(key, scale.name);
            return completionData[completionKey] === true;
          }).length;
          return {
            completed,
            total: keysForScale,
            percentage: Math.round((completed / keysForScale) * 100),
          };
        })()}
        {@const isExpanded = expandedScales[scale.name] === true}
        <div class="scale-section">
          <button
            type="button"
            class="scale-header"
            class:expanded={isExpanded}
            on:click={() => toggleScaleExpanded(scale.name)}
          >
            <span class="chevron-icon">
              <ChevronRightIcon />
            </span>
            <h3 class="scale-name-title">
              {scale.name}
              {#if scale.alternateNames.length > 0}
                <span class="alternate-names"
                  >({scale.alternateNames.join(", ")})</span
                >
              {/if}
            </h3>
            <div class="scale-progress">
              <div class="progress-bar-container small">
                <div
                  class="progress-bar"
                  style="width: {scaleProgress.percentage}%"
                ></div>
              </div>
              <span class="progress-text"
                >{scaleProgress.completed} / {scaleProgress.total}</span
              >
            </div>
          </button>
          {#if isExpanded}
            <div class="scale-content">
              <p class="scale-description">{scale.description}</p>
              <div class="keys-grid">
                {#each scalesData.keys as key}
                  {@const completionKey = getCompletionKey(key, scale.name)}
                  {@const isChecked = completionData[completionKey] === true}
                  {@const isSelected =
                    selectedKey === key && selectedScale?.name === scale.name}
                  <button
                    type="button"
                    class="key-item"
                    class:completed={isChecked}
                    class:selected={isSelected}
                    on:click|stopPropagation={() =>
                      selectScale(key, scale.name)}
                  >
                    <span class="key-name">{key}</span>
                    {#if isChecked}
                      <span class="checkmark">✓</span>
                    {/if}
                  </button>
                {/each}
              </div>
              <PractiveDrills {selectedKey} {selectedScale} />
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .scale-practice {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .header {
    margin-bottom: 2rem;

    h2 {
      font-size: 2rem;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 600;
      margin-bottom: 1rem;
    }
  }

  .progress-summary {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .progress-bar-container {
    flex: 1;
    height: 24px;
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
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.7);
    white-space: nowrap;
  }

  .controls {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .view-toggle {
    display: flex;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.25rem;
  }

  .toggle-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.95rem;
    font-weight: 500;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.9);
    }

    &.active {
      background: rgba(119, 210, 255, 0.2);
      color: rgba(119, 210, 255, 1);
    }
  }

  .keys-view {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .key-section {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .key-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    margin: -0.5rem;
    text-align: left;
    font-family: inherit;
    transition: all 0.2s ease;

    &:hover {
      opacity: 0.8;
    }

    &.expanded {
      margin-bottom: 1rem;

      .chevron-icon {
        transform: rotate(90deg);
      }
    }

    * {
      pointer-events: none;
    }
  }

  .key-name {
    font-size: 1.5rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    flex: 1;
  }

  .key-progress {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .chevron-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    transition: transform 0.2s ease;
    color: rgba(255, 255, 255, 0.7);
    flex-shrink: 0;

    :global(svg) {
      width: 100%;
      height: 100%;
    }
  }

  .scales-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
    animation: slideDown 0.2s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .scale-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    border: none;
    width: 100%;
    text-align: left;
    font-family: inherit;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }

    &.completed {
      background: rgba(119, 210, 255, 0.15);
      border-color: rgba(119, 210, 255, 0.4);

      .scale-name {
        color: rgba(119, 210, 255, 1);
        text-decoration: line-through;
      }
    }

    &.selected {
      background: rgba(253, 231, 45, 0.15);
      border-color: rgba(253, 231, 45, 0.4);
      box-shadow: 0 0 0 2px rgba(253, 231, 45, 0.2);
    }
  }

  .checkmark {
    color: rgba(119, 210, 255, 1);
    font-weight: bold;
    font-size: 1.1rem;
  }

  .scale-name {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
    flex: 1;
  }

  .alternate-names {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85em;
  }

  .scales-view {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .scale-section {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .scale-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    margin: -0.5rem;
    text-align: left;
    font-family: inherit;
    transition: all 0.2s ease;

    &:hover {
      opacity: 0.8;
    }

    &.expanded {
      margin-bottom: 0.75rem;

      .chevron-icon {
        transform: rotate(90deg);
      }
    }

    * {
      pointer-events: none;
    }
  }

  .scale-content {
    animation: slideDown 0.2s ease;
  }

  .scale-name-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    flex: 1;
  }

  .scale-progress {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .scale-description {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
    margin: 0 0 1rem 0;
    font-style: italic;
  }

  .keys-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.75rem;
  }

  .key-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    border: none;
    width: 100%;
    font-family: inherit;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }

    &.completed {
      background: rgba(119, 210, 255, 0.15);
      border-color: rgba(119, 210, 255, 0.4);

      .key-name {
        color: rgba(119, 210, 255, 1);
        text-decoration: line-through;
      }
    }

    &.selected {
      background: rgba(253, 231, 45, 0.15);
      border-color: rgba(253, 231, 45, 0.4);
      box-shadow: 0 0 0 2px rgba(253, 231, 45, 0.2);
    }

    .key-name {
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
    }
  }
</style>
