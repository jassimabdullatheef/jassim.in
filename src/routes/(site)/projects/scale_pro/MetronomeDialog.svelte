<script>
  import { createEventDispatcher } from "svelte";
  import Button from "$lib/components/Button.svelte";

  export let bpm = 120;
  export let timeSignature = { numerator: 4, denominator: 4 };
  export let soundType = "tick";
  export let countdown = { enabled: true, bars: 1 }; // bars: 0 (off), 1, or 2
  export let speedProgression = {
    enabled: true,
    startBpm: 60,
    finalBpm: 120,
    increment: 10,
    barsPerSpeed: 4,
    endBehavior: "continue", // 'continue', 'stop', 'loop', 'reverse'
  };

  const dispatch = createEventDispatcher();

  let localBpm = bpm;
  let localTimeSignature = { ...timeSignature };
  let localSoundType = soundType;
  let selectedTimeSignature = `${timeSignature.numerator}/${timeSignature.denominator}`;
  let localSpeedProgression = { ...speedProgression };
  let localCountdown = { ...countdown };
  let activeTab = speedProgression.enabled ? "progressive" : "fixed";
  
  // Convert countdown to dropdown value: "off", "1", or "2"
  $: countdownValue = localCountdown.enabled ? String(localCountdown.bars) : "off";
  
  function handleCountdownChange(event) {
    const value = /** @type {HTMLSelectElement} */ (event.target).value;
    if (value === "off") {
      localCountdown.enabled = false;
      localCountdown.bars = 0;
    } else {
      localCountdown.enabled = true;
      localCountdown.bars = parseInt(value);
    }
  }

  const timeSignatureOptions = [
    { numerator: 2, denominator: 4 },
    { numerator: 3, denominator: 4 },
    { numerator: 4, denominator: 4 },
    { numerator: 5, denominator: 4 },
    { numerator: 6, denominator: 8 },
    { numerator: 7, denominator: 8 },
    { numerator: 9, denominator: 8 },
    { numerator: 12, denominator: 8 },
  ];

  const soundOptions = [
    { value: "tick", label: "Tick" },
    { value: "click", label: "Click" },
    { value: "beep", label: "Beep" },
    { value: "wood", label: "Wood" },
  ];

  /**
   * @param {Event} event
   */
  function handleBpmChange(event) {
    const value = parseInt(
      /** @type {HTMLInputElement} */ (event.target).value
    );
    if (value >= 30 && value <= 300) {
      localBpm = value;
    }
  }

  /**
   * @param {Event} event
   */
  function handleTimeSignatureChange(event) {
    const value = /** @type {HTMLSelectElement} */ (event.target).value;
    const [num, den] = value.split("/").map(Number);
    localTimeSignature = { numerator: num, denominator: den };
    selectedTimeSignature = value;
  }

  /**
   * @param {Event} event
   */
  function handleSoundTypeChange(event) {
    localSoundType = /** @type {HTMLInputElement} */ (event.target).value;
  }

  function handleSave() {
    // Update enabled state based on active tab
    localSpeedProgression.enabled = activeTab === "progressive";

    dispatch("settings-change", {
      bpm: localBpm,
      timeSignature: localTimeSignature,
      soundType: localSoundType,
      countdown: localCountdown,
      speedProgression: localSpeedProgression,
    });
    dispatch("close");
  }

  function handleCancel() {
    // Reset to original values
    localBpm = bpm;
    localTimeSignature = { ...timeSignature };
    localSoundType = soundType;
    selectedTimeSignature = `${timeSignature.numerator}/${timeSignature.denominator}`;
    localSpeedProgression = { ...speedProgression };
    localCountdown = { ...countdown };
    activeTab = speedProgression.enabled ? "progressive" : "fixed";
    dispatch("close");
  }

  /**
   * @param {Event} event
   */
  function handleBpmInput(event) {
    const value = /** @type {HTMLInputElement} */ (event.target).value;
    if (value === "") {
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 30 && numValue <= 300) {
      localBpm = numValue;
    }
  }
</script>

<div
  class="dialog-overlay"
  on:click={handleCancel}
  on:keydown={(e) => e.key === "Escape" && handleCancel()}
>
  <div class="dialog-content" on:click|stopPropagation>
    <div class="dialog-header">
      <h2>Metronome Settings</h2>
    </div>

    <div class="dialog-body">
      <div class="setting-group">
        <label for="time-signature">Time Signature</label>
        <select
          id="time-signature"
          bind:value={selectedTimeSignature}
          on:change={handleTimeSignatureChange}
          class="time-signature-select"
        >
          {#each timeSignatureOptions as option}
            <option value={`${option.numerator}/${option.denominator}`}>
              {option.numerator}/{option.denominator}
            </option>
          {/each}
        </select>
      </div>

      <div class="setting-group">
        <label for="sound-type">Sound Type</label>
        <div class="sound-options">
          {#each soundOptions as option}
            <label class="sound-option">
              <input
                type="radio"
                name="sound-type"
                value={option.value}
                bind:group={localSoundType}
                on:change={handleSoundTypeChange}
              />
              <span>{option.label}</span>
            </label>
          {/each}
        </div>
      </div>

      <div class="setting-group">
        <label for="countdown">Countdown</label>
        <select
          id="countdown"
          value={countdownValue}
          on:change={handleCountdownChange}
          class="countdown-select"
        >
          <option value="off">Off</option>
          <option value="1">1 bar</option>
          <option value="2">2 bars</option>
        </select>
      </div>

      <div class="setting-group speed-progression-group">
        <div class="tab-container">
          <button
            class="tab-button"
            class:active={activeTab === "progressive"}
            on:click={() => (activeTab = "progressive")}
            type="button"
          >
            Progressive BPM
          </button>
          <button
            class="tab-button"
            class:active={activeTab === "fixed"}
            on:click={() => (activeTab = "fixed")}
            type="button"
          >
            Fixed
          </button>
        </div>

        {#if activeTab === "fixed"}
          <div class="tab-content">
            <div class="setting-group">
              <label for="bpm">BPM (Beats Per Minute)</label>
              <div class="bpm-control">
                <input
                  type="range"
                  id="bpm"
                  min="30"
                  max="300"
                  bind:value={localBpm}
                  on:input={handleBpmChange}
                  class="bpm-slider"
                />
                <input
                  type="number"
                  min="30"
                  max="300"
                  bind:value={localBpm}
                  on:input={handleBpmInput}
                  class="bpm-input"
                />
              </div>
              <div class="bpm-range">
                <span>30</span>
                <span>300</span>
              </div>
            </div>
          </div>
        {:else}
          <div class="tab-content">
            <div class="speed-progression-settings">
              <div class="speed-progression-row">
                <label for="start-bpm">Starting BPM</label>
                <input
                  type="number"
                  id="start-bpm"
                  min="30"
                  max="300"
                  bind:value={localSpeedProgression.startBpm}
                  class="speed-input"
                />
              </div>

              <div class="speed-progression-row">
                <label for="final-bpm">Final BPM</label>
                <input
                  type="number"
                  id="final-bpm"
                  min="30"
                  max="300"
                  bind:value={localSpeedProgression.finalBpm}
                  class="speed-input"
                />
              </div>

              <div class="speed-progression-row">
                <label for="increment">Increment (BPM per step)</label>
                <input
                  type="number"
                  id="increment"
                  min="1"
                  max="50"
                  bind:value={localSpeedProgression.increment}
                  class="speed-input"
                />
              </div>

              <div class="speed-progression-row">
                <label for="bars-per-speed">Bars per Speed</label>
                <input
                  type="number"
                  id="bars-per-speed"
                  min="1"
                  max="32"
                  bind:value={localSpeedProgression.barsPerSpeed}
                  class="speed-input"
                />
              </div>

              <div class="speed-progression-row">
                <label for="end-behavior">After Final Speed</label>
                <select
                  id="end-behavior"
                  bind:value={localSpeedProgression.endBehavior}
                  class="end-behavior-select"
                >
                  <option value="continue">Continue at Final Speed</option>
                  <option value="stop">Stop After Full Cycle</option>
                  <option value="loop">Loop from Beginning</option>
                  <option value="reverse">Reverse (Go Back)</option>
                </select>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="dialog-footer">
      <Button onClick={handleCancel} variant="default">Cancel</Button>
      <Button onClick={handleSave} variant="default">Save</Button>
    </div>
  </div>
</div>

<style lang="scss">
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .dialog-content {
    background: rgba(20, 20, 25, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .dialog-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h2 {
      margin: 0;
      font-size: 1.5rem;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 600;
    }
  }

  .dialog-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    label {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }
  }

  .bpm-control {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .bpm-slider {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
    appearance: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      background: rgba(119, 210, 255, 0.9);
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(119, 210, 255, 1);
        transform: scale(1.2);
      }
    }

    &::-moz-range-thumb {
      width: 18px;
      height: 18px;
      background: rgba(119, 210, 255, 0.9);
      border-radius: 50%;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(119, 210, 255, 1);
        transform: scale(1.2);
      }
    }
  }

  .bpm-input {
    width: 80px;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    text-align: center;
    font-weight: 600;

    &:focus {
      outline: none;
      border-color: rgba(119, 210, 255, 0.5);
      background: rgba(255, 255, 255, 0.08);
    }
  }

  .bpm-range {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .time-signature-select {
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: rgba(119, 210, 255, 0.5);
      background: rgba(255, 255, 255, 0.08);
    }

    option {
      background: rgba(20, 20, 25, 0.95);
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .sound-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .sound-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }

    input[type="radio"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: rgba(119, 210, 255, 0.9);
    }

    span {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.95rem;
    }

    input[type="radio"]:checked + span {
      color: rgba(119, 210, 255, 1);
      font-weight: 600;
    }
  }

  .countdown-select {
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: rgba(119, 210, 255, 0.5);
      background: rgba(255, 255, 255, 0.08);
    }

    option {
      background: rgba(20, 20, 25, 0.95);
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .dialog-footer {
    padding: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  .speed-progression-group {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 1.5rem;
    margin-top: 0.5rem;
  }

  .tab-container {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 0.25rem;
  }

  .tab-button {
    flex: 1;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.9);
    }

    &.active {
      background: rgba(119, 210, 255, 0.2);
      color: rgba(119, 210, 255, 1);
      font-weight: 600;
    }
  }

  .tab-content {
    margin-top: 0;
  }

  .speed-progression-settings {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .speed-progression-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;

    label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
      flex: 1;
    }
  }

  .speed-input {
    width: 100px;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.95rem;
    text-align: center;
    font-weight: 600;

    &:focus {
      outline: none;
      border-color: rgba(119, 210, 255, 0.5);
      background: rgba(255, 255, 255, 0.08);
    }
  }

  .end-behavior-select {
    width: 100px;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: rgba(119, 210, 255, 0.5);
      background: rgba(255, 255, 255, 0.08);
    }

    option {
      background: rgba(20, 20, 25, 0.95);
      color: rgba(255, 255, 255, 0.9);
    }
  }
</style>
