<script>
  import Metronome from "./Metronome.svelte";
  import MetronomeDialog from "./MetronomeDialog.svelte";
  import ScalePractice from "./ScalePractice.svelte";
  import SelectedScale from "./SelectedScale.svelte";
  import scalesData from "./scales.json";
  import { onMount } from "svelte";
  import ClockStopwatchIcon from "$lib/icons/clock-stopwatch.svelte";

  let bpm = 120;
  let timeSignature = { numerator: 4, denominator: 4 };
  let soundType = "tick";
  let countdown = { enabled: true, bars: 1 }; // bars: 0 (off), 1, or 2
  let showDialog = false;
  let speedProgression = {
    enabled: true,
    startBpm: 60,
    finalBpm: 200,
    increment: 10,
    barsPerSpeed: 4,
    endBehavior: "continue",
  };

  /** @type {string | null} */
  let selectedKey = "C";
  /** @type {{ name: string; alternateNames: string[]; intervals: string[]; description: string } | null} */
  let selectedScale =
    scalesData.scales.find((s) => s.name === "Ionian") || null;
  /** @type {{ [key: string]: boolean }} */
  let completionData = {};
  let viewMode = "by-key"; // Track the current view mode from ScalePractice

  onMount(() => {
    // Ensure C Major is selected on mount
    if (!selectedScale) {
      selectedScale =
        scalesData.scales.find((s) => s.name === "Ionian") || null;
    }
    if (!selectedKey) {
      selectedKey = "C";
    }
  });

  // Load completion data to check if selected scale is completed
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      const stored = localStorage.getItem("scale-progress");
      if (stored) {
        completionData = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading completion data:", error);
    }
  }

  /**
   * @param {CustomEvent} event
   */
  function handleSettingsChange(event) {
    const {
      bpm: newBpm,
      timeSignature: newTimeSignature,
      soundType: newSoundType,
      countdown: newCountdown,
      speedProgression: newSpeedProgression,
    } = event.detail;

    bpm = newBpm;
    timeSignature = newTimeSignature;
    soundType = newSoundType;
    countdown = newCountdown || countdown;
    speedProgression = newSpeedProgression || speedProgression;
  }

  /**
   * @param {CustomEvent} event
   */
  function handleScaleSelected(event) {
    selectedKey = event.detail.key;
    selectedScale = event.detail.scale;
    // Reload completion data
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        const stored = localStorage.getItem("scale-progress");
        if (stored) {
          completionData = JSON.parse(stored);
        }
      } catch (error) {
        console.error("Error loading completion data:", error);
      }
    }
  }

  /**
   * @param {CustomEvent} event
   */
  function handleToggleCompletion(event) {
    const { key, scale } = event.detail;
    const completionKey = `${key}-${scale}`;
    completionData[completionKey] = !completionData[completionKey];

    try {
      localStorage.setItem("scale-progress", JSON.stringify(completionData));
    } catch (error) {
      console.error("Error saving progress:", error);
    }

    // Trigger reactivity
    completionData = { ...completionData };
  }

  /**
   * @param {string} key
   * @param {string} scaleName
   */
  function getCompletionKey(key, scaleName) {
    return `${key}-${scaleName}`;
  }

  $: isSelectedCompleted =
    selectedKey && selectedScale
      ? completionData[getCompletionKey(selectedKey, selectedScale.name)] ===
        true
      : false;

  /**
   * @param {CustomEvent} event
   */
  function handleViewModeChange(event) {
    viewMode = event.detail.viewMode;
  }

  function handleNext() {
    if (!selectedKey || !selectedScale) return;

    if (viewMode === "by-key") {
      // In key mode: keep the same key, move to next scale
      const currentScaleIndex = scalesData.scales.findIndex(
        (s) => s.name === selectedScale?.name
      );
      if (currentScaleIndex === -1) {
        // If not found, default to first scale
        selectedScale = scalesData.scales[0] || selectedScale;
      } else {
        const nextScaleIndex =
          (currentScaleIndex + 1) % scalesData.scales.length;
        selectedScale = scalesData.scales[nextScaleIndex];
      }
      // Reload completion data
      if (
        typeof window !== "undefined" &&
        typeof localStorage !== "undefined"
      ) {
        try {
          const stored = localStorage.getItem("scale-progress");
          if (stored) {
            completionData = JSON.parse(stored);
          }
        } catch (error) {
          console.error("Error loading completion data:", error);
        }
      }
    } else {
      // In scale mode: keep the same scale, move to next key
      const currentKeyIndex = scalesData.keys.indexOf(selectedKey);
      if (currentKeyIndex === -1) {
        // If not found, default to first key
        selectedKey = scalesData.keys[0] || selectedKey;
      } else {
        const nextKeyIndex = (currentKeyIndex + 1) % scalesData.keys.length;
        selectedKey = scalesData.keys[nextKeyIndex];
      }
      // Reload completion data
      if (
        typeof window !== "undefined" &&
        typeof localStorage !== "undefined"
      ) {
        try {
          const stored = localStorage.getItem("scale-progress");
          if (stored) {
            completionData = JSON.parse(stored);
          }
        } catch (error) {
          console.error("Error loading completion data:", error);
        }
      }
    }
  }
</script>

<svelte:head>
  <title>Scale Pro - Music Scale Practice Tool</title>
  <meta
    name="description"
    content="A tool for music students to learn and practice scales and modes. Comes with a progressive metronome with customizable settings."
  />
</svelte:head>

<div class="page-container">
  <div class="header">
    <div class="header-content">
      <div>
        <div class="title-wrapper">
          <span class="title-icon">
            <svelte:component this={ClockStopwatchIcon} />
          </span>
          <h1 class="title">Scale Pro</h1>
        </div>
        <p class="subtitle">
          A tool for music students to learn and practice scales and modes
        </p>
      </div>
    </div>
  </div>

  <SelectedScale
    {selectedKey}
    {selectedScale}
    isCompleted={isSelectedCompleted}
    on:toggle-completion={handleToggleCompletion}
    on:next={handleNext}
  />
  <Metronome
    {bpm}
    {timeSignature}
    {soundType}
    {countdown}
    {speedProgression}
    showSettingsButton={true}
    onSettingsClick={() => (showDialog = true)}
  />

  <div class="scales-section">
    <ScalePractice
      {completionData}
      on:scale-selected={handleScaleSelected}
      on:view-mode-change={handleViewModeChange}
    />
  </div>
</div>

{#if showDialog}
  <MetronomeDialog
    {bpm}
    {timeSignature}
    {soundType}
    {countdown}
    {speedProgression}
    on:close={() => (showDialog = false)}
    on:settings-change={handleSettingsChange}
  />
{/if}

<style lang="scss">
  .page-container {
    padding: 2rem;
    max-width: 1600px;
    margin: 0 auto;
    position: relative;
  }

  .header {
    margin-bottom: 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 2rem;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .title-wrapper {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .title-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      flex-shrink: 0;
      color: #77d2ff;
      transition: transform 0.25s ease;

      :global(svg) {
        width: 100%;
        height: 100%;
      }

      &:hover {
        transform: scale(1.1);
        color: #fde72d;
      }
    }

    .title {
      font-size: 3rem;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(45deg, #77d2ff 0%, #fde72d 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.7);
    }
  }
</style>
