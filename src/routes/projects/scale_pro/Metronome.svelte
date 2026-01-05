<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import Button from "$lib/components/Button.svelte";
  import SettingsIcon from "$lib/icons/settings.svelte";
  
  const dispatch = createEventDispatcher();

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
    endBehavior: "continue",
  };
  export let showSettingsButton = true;
  export let onSettingsClick = () => {};

  let isPlaying = false;
  let isCountdown = false;
  
  // Expose toggle function for external control
  export function toggle() {
    toggleMetronome();
  }
  
  // Dispatch state changes
  $: dispatch('state-change', { isPlaying, isCountdown });
  let beatCount = 0;
  let barCount = 0;
  let currentSpeedIndex = 0;
  let isReversing = false;
  let barsUntilNextChange = 0;
  let barsAtCurrentSpeed = 0; // Track bars at current speed for progress
  let countdownBarCount = 0;
  let countdownBeatCount = 0;
  /** @type {number | null} */
  let nextBpm = null;
  /** @type {AudioContext | null} */
  let audioContext = null;
  /** @type {ReturnType<typeof setInterval> | null} */
  let intervalId = null;

  let isStuck = false;
  /** @type {HTMLElement | undefined} */
  let containerElement;
  let initialTop = 0;

  onMount(() => {
    // Initialize AudioContext
    // @ts-ignore - webkitAudioContext is a legacy API
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Store initial position - this is the element's position from the top of the document
    const updateInitialTop = () => {
      if (containerElement && !isStuck) {
        initialTop = containerElement.getBoundingClientRect().top + window.scrollY;
      }
    };
    updateInitialTop();

    // Use scroll listener to detect when sticky element is stuck
    // We use initialTop (the element's original position) instead of checking rect.top === 0
    // This prevents a feedback loop where height changes from the stuck class cause scroll position shifts
    const handleScroll = () => {
      // Recalculate initialTop if it hasn't been set yet (in case layout wasn't ready on mount)
      if (initialTop === 0 && containerElement) {
        updateInitialTop();
      }
      
      if (initialTop > 0) {
        const scrollY = window.scrollY || window.pageYOffset;
        // Use a small threshold (5px) to add hysteresis and prevent oscillation at the boundary
        if (isStuck) {
          // To "unstick", require scrolling back above the original position minus threshold
          isStuck = scrollY >= initialTop - 5;
        } else {
          // To "stick", require scrolling past the original position
          isStuck = scrollY >= initialTop;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state

    // Add keyboard event listener for spacebar
    /**
     * @param {KeyboardEvent} event
     */
    const handleKeyDown = (event) => {
      // Check if spacebar is pressed and not typing in an input/textarea
      if (
        event.key === " " ||
        event.key === "Spacebar" ||
        event.keyCode === 32
      ) {
        const target = /** @type {HTMLElement} */ (event.target);
        // Don't trigger if user is typing in an input, textarea, or other editable element
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
        event.preventDefault();
        toggleMetronome();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  onDestroy(() => {
    stopMetronome();
    if (audioContext) {
      audioContext.close();
    }
  });

  /**
   * @param {number} frequency
   * @param {number} duration
   * @param {OscillatorType} type
   */
  function createSound(frequency, duration, type = "sine") {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    // Create envelope for click sound
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  function playBeat(isAccent = false) {
    if (!audioContext) return;

    switch (soundType) {
      case "tick":
        createSound(isAccent ? 800 : 600, 0.05, "sine");
        break;
      case "click":
        createSound(isAccent ? 1000 : 800, 0.02, "square");
        break;
      case "beep":
        createSound(isAccent ? 600 : 400, 0.1, "sine");
        break;
      case "wood":
        // Lower frequency for wood-like sound
        createSound(isAccent ? 200 : 150, 0.08, "sawtooth");
        break;
      default:
        createSound(isAccent ? 800 : 600, 0.05, "sine");
    }
  }

  function calculateSpeedSteps() {
    if (!speedProgression.enabled) return [];

    const steps = [];
    const start = speedProgression.startBpm;
    const end = speedProgression.finalBpm;
    const increment = speedProgression.increment;

    if (start <= end) {
      for (let bpm = start; bpm <= end; bpm += increment) {
        steps.push(bpm);
      }
    } else {
      for (let bpm = start; bpm >= end; bpm -= increment) {
        steps.push(bpm);
      }
    }

    return steps;
  }

  function getCurrentBpm() {
    if (!speedProgression.enabled) {
      return bpm;
    }

    const steps = calculateSpeedSteps();
    if (steps.length === 0) return bpm;

    const index = currentSpeedIndex % steps.length;
    return steps[index];
  }

  function getNextBpm() {
    if (!speedProgression.enabled) {
      return null;
    }

    const steps = calculateSpeedSteps();
    if (steps.length === 0) return null;

    if (isReversing) {
      if (currentSpeedIndex > 0) {
        return steps[currentSpeedIndex - 1];
      } else {
        // At start, reverse direction
        return steps[1] || null;
      }
    } else {
      if (currentSpeedIndex < steps.length - 1) {
        return steps[currentSpeedIndex + 1];
      } else {
        // At end, check behavior
        if (speedProgression.endBehavior === "loop") {
          return steps[0];
        } else if (speedProgression.endBehavior === "reverse") {
          return steps[steps.length - 2] || null;
        }
      }
    }

    return null;
  }

  function updateSpeedProgression() {
    if (!speedProgression.enabled) return;

    const steps = calculateSpeedSteps();
    if (steps.length === 0) return;

    const currentBpmValue = getCurrentBpm();

    if (isPlaying && bpm !== currentBpmValue) {
      // Update BPM and restart interval with new timing
      bpm = currentBpmValue;
      const interval = (60 / bpm) * 1000;

      if (intervalId) {
        clearInterval(intervalId);
      }

      intervalId = setInterval(() => {
        beatCount = (beatCount + 1) % timeSignature.numerator;
        const isAccent = beatCount === 0;
        playBeat(isAccent);

        // Check if we completed a bar
        if (beatCount === 0) {
          handleBarComplete();
        }
      }, interval);
    } else {
      bpm = currentBpmValue;
    }

    barsUntilNextChange =
      speedProgression.barsPerSpeed -
      (barCount % speedProgression.barsPerSpeed);
    nextBpm = getNextBpm();
  }

  function handleBarComplete() {
    if (!speedProgression.enabled) {
      return;
    }

    barCount++;
    barsUntilNextChange--;
    barsAtCurrentSpeed++;

    if (barsUntilNextChange <= 0) {
      const steps = calculateSpeedSteps();
      if (steps.length === 0) return;

      barsAtCurrentSpeed = 0; // Reset when speed changes

      if (isReversing) {
        if (currentSpeedIndex > 0) {
          currentSpeedIndex--;
        } else {
          // Reached start, switch direction
          isReversing = false;
          currentSpeedIndex = 1;
        }
      } else {
        if (currentSpeedIndex < steps.length - 1) {
          currentSpeedIndex++;
        } else {
          // Reached final speed
          if (speedProgression.endBehavior === "stop") {
            stopMetronome();
            return;
          } else if (speedProgression.endBehavior === "loop") {
            currentSpeedIndex = 0;
            barCount = 0;
            barsAtCurrentSpeed = 0;
          } else if (speedProgression.endBehavior === "reverse") {
            isReversing = true;
            currentSpeedIndex = steps.length - 2;
          }
          // 'continue' behavior: stay at final speed, no change
        }
      }

      updateSpeedProgression();
    }
  }

  function startCountdown() {
    if (!countdown.enabled || countdown.bars <= 0) {
      startMetronome();
      return;
    }

    isCountdown = true;
    countdownBarCount = 0;
    countdownBeatCount = 0;

    // Use starting BPM from progressive settings if enabled, otherwise use regular BPM
    const countdownBpm = speedProgression.enabled
      ? speedProgression.startBpm
      : bpm;
    const interval = (60 / countdownBpm) * 1000; // Convert BPM to milliseconds

    playBeat(true); // Play first beat as accent

    intervalId = setInterval(() => {
      countdownBeatCount = (countdownBeatCount + 1) % timeSignature.numerator;
      const isAccent = countdownBeatCount === 0;
      playBeat(isAccent);

      // Check if we completed a bar
      if (countdownBeatCount === 0) {
        countdownBarCount++;
        if (countdownBarCount >= countdown.bars) {
          // Countdown complete, start actual metronome
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          isCountdown = false;
          startMetronome();
          return;
        }
      }
    }, interval);
  }

  function startMetronome() {
    if (isPlaying) return;

    if (speedProgression.enabled) {
      barCount = 0;
      currentSpeedIndex = 0;
      isReversing = false;
      barsAtCurrentSpeed = 0;
      bpm = speedProgression.startBpm;
      barsUntilNextChange = speedProgression.barsPerSpeed;
      nextBpm = getNextBpm() ?? null;
    } else {
      nextBpm = null;
      barsAtCurrentSpeed = 0;
    }

    isPlaying = true;
    const interval = (60 / bpm) * 1000; // Convert BPM to milliseconds

    beatCount = 0;
    playBeat(true); // Play first beat as accent

    intervalId = setInterval(() => {
      beatCount = (beatCount + 1) % timeSignature.numerator;
      const isAccent = beatCount === 0;
      playBeat(isAccent);

      // Check if we completed a bar
      if (beatCount === 0) {
        handleBarComplete();
      }
    }, interval);
  }

  function stopMetronome() {
    isPlaying = false;
    isCountdown = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    beatCount = 0;
    barCount = 0;
    barsAtCurrentSpeed = 0;
    countdownBarCount = 0;
    countdownBeatCount = 0;
    if (speedProgression.enabled) {
      barsUntilNextChange = speedProgression.barsPerSpeed;
      nextBpm = getNextBpm() ?? null;
    } else {
      nextBpm = null;
    }
  }

  function toggleMetronome() {
    if (isPlaying || isCountdown) {
      stopMetronome();
    } else {
      startCountdown();
    }
  }

  // Update when props change
  $: {
    if (speedProgression.enabled && isPlaying) {
      updateSpeedProgression();
    }
  }
</script>

<div
  class="metronome-container"
  class:playing={isPlaying || isCountdown}
  class:stuck={isStuck && (isPlaying || isCountdown)}
  bind:this={containerElement}
>
  <div class="metronome-content">
    <div class="metronome-display">
      <div
        class="is-flex is-justify-content-space-between is-align-items-top"
        style="width: 100%;"
      >
        <div
          class="is-flex is-justify-content-flex-start is-align-items-center"
        >
          <div class="bpm-display">
            <span class="bpm-value"
              >{speedProgression.enabled ? getCurrentBpm() : bpm}</span
            >
            <span class="bpm-label">BPM</span>
          </div>
        </div>
        <div>
          {#if isCountdown}
            <div class="countdown-indicator">
              <span class="countdown-label">Countdown</span>
              <div class="countdown-progress">
                Bar {countdownBarCount + 1} / {countdown.bars}
              </div>
            </div>
          {/if}
          <div class="beat-indicator">
            {#each Array(timeSignature.numerator) as _, i}
              <div
                class="beat-dot"
                class:active={(isPlaying && beatCount === i) ||
                  (isCountdown && countdownBeatCount === i)}
                class:accent={i === 0}
                class:countdown={isCountdown}
              ></div>
            {/each}
          </div>
          <div class="time-signature-display">
            {timeSignature.numerator}/{timeSignature.denominator}
          </div>
        </div>
        {#if showSettingsButton}
          <div class="controls">
            <Button onClick={onSettingsClick} variant="default">
              <span style="width: 1em;"><SettingsIcon /></span>
            </Button>
          </div>
        {/if}
      </div>

      {#if speedProgression.enabled}
        <div class="speed-progression-indicator">
          <div
            class="is-flex is-justify-content-space-between is-align-items-center"
          >
            <div class="upcoming-speed">
              {#if nextBpm !== null && barsUntilNextChange > 0}
                <span class="upcoming-label">Next: {nextBpm} BPM</span>
              {/if}
            </div>
            <div class="progress-label">
              <span
                >Bar {barsAtCurrentSpeed + 1} / {speedProgression.barsPerSpeed}</span
              >
            </div>
          </div>
          <div class="progress-container">
            <div class="progress-bar-wrapper">
              <div
                class="progress-bar"
                style="width: {((barsAtCurrentSpeed + 1) /
                  speedProgression.barsPerSpeed) *
                  100}%"
              ></div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  .metronome-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    background: rgba(119, 210, 255, 0.1);
    border: 1px solid rgba(119, 210, 255, 0.3);
    border-radius: 12px;
    animation: pulse 2s ease-in-out infinite;
    transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, border-radius 0.3s ease;
    // Not sticky by default - only sticky when playing
    z-index: 10;

    // Only make sticky when playing
    &.playing {
      position: sticky;
      top: 0;
    }

    // When stuck (and playing), only change visual properties - NO layout changes to prevent scroll jank
    &.stuck {
      border-radius: 0 0 12px 12px;
      background: rgba(39, 45, 48, 0.98);
      border-color: rgba(119, 210, 255, 0.2);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: none;
    }
  }

  .metronome-content {
    text-align: center;
    width: 100%;
  }

  .metronome-display {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .bpm-display {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    gap: 0.2rem;
  }

  .bpm-value {
    font-size: 5rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.95);
    line-height: 1;
    text-shadow: 0 0 20px rgba(119, 210, 255, 0.3);
  }

  .bpm-label {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .time-signature-display {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    max-width: 50%;
    margin: 0 auto;
  }

  .beat-indicator {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .beat-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    transition: all 0.2s ease;

    &.active {
      background: rgba(119, 210, 255, 0.8);
      border-color: rgba(119, 210, 255, 1);
      transform: scale(1.3);
      box-shadow: 0 0 15px rgba(119, 210, 255, 0.6);
    }

    &.accent.active {
      background: rgba(253, 231, 45, 0.9);
      border-color: rgba(253, 231, 45, 1);
      box-shadow: 0 0 20px rgba(253, 231, 45, 0.7);
    }

    &.countdown.active {
      background: rgba(255, 165, 0, 0.8);
      border-color: rgba(255, 165, 0, 1);
      box-shadow: 0 0 15px rgba(255, 165, 0, 0.6);
    }

    &.countdown.accent.active {
      background: rgba(255, 140, 0, 0.9);
      border-color: rgba(255, 140, 0, 1);
      box-shadow: 0 0 20px rgba(255, 140, 0, 0.7);
    }
  }

  .countdown-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .countdown-label {
    font-size: 0.9rem;
    color: rgba(255, 165, 0, 0.9);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .countdown-progress {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }

  .controls {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .speed-progression-indicator {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }

  .upcoming-speed {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .upcoming-label {
    font-size: 1rem;
    color: rgba(119, 210, 255, 0.9);
    font-weight: 600;
  }

  .countdown {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }

  .progress-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .progress-label {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
    text-align: center;
  }

  .progress-bar-wrapper {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(119, 210, 255, 0.8),
      rgba(119, 210, 255, 1)
    );
    border-radius: 4px;
    transition: width 0.3s ease;
    box-shadow: 0 0 10px rgba(119, 210, 255, 0.5);
  }
</style>
