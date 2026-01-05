<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { getDrillsByCategory, drillToAbc, patternToAbc, formatNoteNames, getDrillPattern, getDrillNotesForBothHands, categories } from "./drills";
  import { pianoSampler } from "./PianoSampler.js";
  import Button from "$lib/components/Button.svelte";
  import PlayIcon from "$lib/icons/play.svelte";
  import StopIcon from "$lib/icons/stop.svelte";
  import MusicIcon from "$lib/icons/music.svelte";
  
  const dispatch = createEventDispatcher();
  
  /** @type {string | null} */
  export let selectedKey = null;
  /** @type {{ name: string; alternateNames: string[]; intervals: string[]; description: string } | null} */
  export let selectedScale = null;
  export let bpm = 120;
  export let timeSignature = { numerator: 4, denominator: 4 };
  export let speedProgression = {
    enabled: true,
    startBpm: 60,
    finalBpm: 200,
    increment: 10,
    barsPerSpeed: 4,
    endBehavior: "continue",
  };
  export let soundType = "tick";
  
  // Props for metronome integration
  export let isPracticing = false;
  export let isCountdown = false;
  
  /** @type {AudioContext | null} */
  let audioContext = null;
  
  // Calculate the playback BPM: use startBpm if progressive, otherwise fixed bpm
  $: playbackBpm = speedProgression.enabled ? speedProgression.startBpm : bpm;
  
  let selectedCategory = 'basic-exercises';
  
  /** @type {any[]} */
  $: drills = getDrillsByCategory(selectedCategory);
  
  /** @type {any} */
  let selectedDrill = getDrillsByCategory('basic-exercises')[0] || null;
  
  // Reset selected drill when category changes and notify parent
  $: if (selectedCategory && drills.length > 0) {
    // Check if current drill is still in the category
    const drillStillExists = drills.some(d => d.id === selectedDrill?.id);
    if (!drillStillExists) {
      selectedDrill = drills[0];
    }
    // Notify parent of category change
    dispatch('category-change', { category: selectedCategory });
  }
  /** @type {HTMLDivElement} */
  let notationContainer;
  /** @type {any} */
  let abcjs = null;
  let showFullExercise = false;
  let barsToShow = 4;
  
  // Playback state
  let isPlaying = false;
  let currentNoteIndex = 0;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let playbackTimeoutId = null;
  let samplerLoaded = false;
  let currentBeat = 0; // Track current beat for metronome (0-indexed within bar)
  
  onMount(async () => {
    // Dynamically import abcjs (it's a browser-only library)
    const abcModule = await import('abcjs');
    abcjs = abcModule.default;
    renderNotation();
    
    // Initialize or wait for piano sampler
    if (pianoSampler.isLoaded) {
      samplerLoaded = true;
    } else {
      if (!pianoSampler.isLoading) {
        await pianoSampler.init();
      } else {
        await pianoSampler.whenLoaded();
      }
      samplerLoaded = pianoSampler.isLoaded;
    }
  });
  
  onDestroy(() => {
    stopPlayback();
  });
  
  /**
   * Get notes for playback based on current view settings (both hands)
   * @returns {{ rightHand: Array, leftHand: Array }}
   */
  function getPlaybackNotes() {
    if (!selectedDrill || !selectedKey || !selectedScale) return { rightHand: [], leftHand: [] };
    
    // Pass barsToShow to get proper ascending + descending pattern when limited
    const options = { 
      octave: 4,
      barsToShow: showFullExercise ? undefined : barsToShow
    };
    
    return getDrillNotesForBothHands(selectedDrill, selectedKey, selectedScale.intervals, options);
  }
  
  /**
   * Calculate the interval between notes based on BPM and note duration
   * @param {number} duration - note duration (4=quarter, 8=eighth, etc.)
   */
  function calculateNoteInterval(duration) {
    // BPM is beats per minute where 1 beat = 1 quarter note
    // interval = (60000ms / BPM) * (4 / duration)
    // For eighth notes (duration=8): interval = (60000/BPM) * 0.5
    const quarterNoteMs = 60000 / playbackBpm;
    return quarterNoteMs * (4 / duration);
  }
  
  /**
   * Initialize audio context for metronome
   */
  function initAudioContext() {
    if (!audioContext) {
      // @ts-ignore - webkitAudioContext is a legacy API
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
  }
  
  /**
   * Create a metronome sound
   * @param {number} frequency - Sound frequency in Hz
   * @param {number} duration - Sound duration in seconds
   * @param {OscillatorType} type - Oscillator type
   */
  function createSound(frequency, duration, type) {
    const ctx = initAudioContext();
    if (!ctx) return;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }
  
  /**
   * Play a metronome beat
   * @param {boolean} isAccent - Whether this is an accented beat
   */
  function playMetronomeBeat(isAccent = false) {
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
        createSound(isAccent ? 200 : 150, 0.08, "sawtooth");
        break;
      default:
        createSound(isAccent ? 800 : 600, 0.05, "sine");
    }
  }
  
  /**
   * Start playing the drill
   */
  function startPlayback() {
    if (!samplerLoaded || isPlaying) return;
    
    const { rightHand, leftHand } = getPlaybackNotes();
    if (rightHand.length === 0) return;
    
    // Initialize audio context for metronome
    initAudioContext();
    
    isPlaying = true;
    currentNoteIndex = 0;
    currentBeat = 0;
    
    playNextNote(rightHand, leftHand);
  }
  
  /**
   * Play the next note in sequence (both hands simultaneously)
   * @param {Array} rightHand - Right hand notes
   * @param {Array} leftHand - Left hand notes
   */
  function playNextNote(rightHand, leftHand) {
    if (!isPlaying || currentNoteIndex >= rightHand.length) {
      stopPlayback();
      return;
    }
    
    const rhNote = rightHand[currentNoteIndex];
    const lhNote = leftHand[currentNoteIndex];
    const duration = rhNote.duration || selectedDrill.duration || 8;
    const intervalMs = calculateNoteInterval(duration);
    
    // Calculate how many notes per beat (8th notes = 2 per beat, 16th = 4 per beat, quarter = 1)
    const notesPerBeat = duration / 4;
    
    // Play metronome click on beat boundaries (every notesPerBeat notes)
    if (currentNoteIndex % notesPerBeat === 0) {
      // Determine if this is beat 1 of the bar (accented)
      const beatsPerBar = timeSignature.numerator;
      const isAccent = currentBeat % beatsPerBar === 0;
      playMetronomeBeat(isAccent);
      currentBeat++;
    }
    
    // Play the note (with a short duration so notes don't overlap)
    const noteDurationSec = (intervalMs / 1000) * 0.9; // 90% of interval
    
    // Build a chord with both hands
    const chordNotes = [];
    
    // Add right hand note(s)
    if (rhNote.notes) {
      // It's already a chord
      rhNote.notes.forEach((n) => chordNotes.push({ note: n.name, octave: n.octave }));
    } else {
      chordNotes.push({ note: rhNote.name, octave: rhNote.octave });
    }
    
    // Add left hand note(s)
    if (lhNote) {
      if (lhNote.notes) {
        lhNote.notes.forEach((n) => chordNotes.push({ note: n.name, octave: n.octave }));
      } else {
        chordNotes.push({ note: lhNote.name, octave: lhNote.octave });
      }
    }
    
    // Play all notes together as a chord
    pianoSampler.playChord(chordNotes, 0.7, noteDurationSec);
    
    currentNoteIndex++;
    
    // Schedule next note
    playbackTimeoutId = setTimeout(() => {
      playNextNote(rightHand, leftHand);
    }, intervalMs);
  }
  
  /**
   * Stop playback
   */
  function stopPlayback() {
    isPlaying = false;
    currentNoteIndex = 0;
    currentBeat = 0;
    
    if (playbackTimeoutId) {
      clearTimeout(playbackTimeoutId);
      playbackTimeoutId = null;
    }
    
    pianoSampler.stopAll();
  }
  
  /**
   * Toggle playback
   */
  function togglePlayback() {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }
  
  function renderNotation() {
    if (!abcjs || !notationContainer || !selectedDrill || !selectedKey || !selectedScale) {
      return;
    }
    
    try {
      const abc = drillToAbc(
        selectedDrill, 
        selectedKey, 
        selectedScale.intervals,
        { 
          octave: 4, 
          showFullExercise,
          barsToShow 
        }
      );
      
      abcjs.renderAbc(notationContainer, abc, {
        responsive: 'resize',
        add_classes: true,
        staffwidth: 800,
        wrap: {
          minSpacing: 1.5,
          maxSpacing: 2.5,
          preferredMeasuresPerLine: 4
        }
      });
    } catch (error) {
      console.error('Error rendering notation:', error);
    }
  }
  
  // Re-render when dependencies change
  $: if (abcjs && selectedDrill && selectedKey && selectedScale) {
    renderNotation();
  }
  
  $: if (abcjs && (showFullExercise !== undefined || barsToShow)) {
    renderNotation();
  }
  
  // Get preview text
  $: patternPreview = (() => {
    if (!selectedDrill || !selectedKey || !selectedScale) return '';
    
    const pattern = getDrillPattern(selectedDrill, selectedKey, selectedScale.intervals);
    
    // Chord progressions have a different structure
    if (selectedDrill.type === 'chord-progression') {
      return pattern.map(chord => {
        const noteNames = chord.notes.map(n => n.name).join('');
        return noteNames;
      }).join(' → ');
    }
    
    return formatNoteNames(pattern);
  })();
  
  // Stop playback when drill, key, or scale ACTUALLY changes (not just on re-renders)
  // Use a derived value to detect changes
  $: playbackKey = `${selectedDrill?.name}-${selectedKey}-${selectedScale?.name}`;
  
  let lastPlaybackKey = '';
  $: if (playbackKey !== lastPlaybackKey) {
    // Only stop if we were actually playing and something changed
    if (lastPlaybackKey !== '' && isPlaying) {
      stopPlayback();
    }
    lastPlaybackKey = playbackKey;
  }
</script>

<div class="drill-notation">
  <div class="notation-header">
    <div class="controls">
      <div class="select-wrapper">
        <label for="category-select">Category:</label>
        <select 
          id="category-select" 
          bind:value={selectedCategory}
          disabled={!selectedKey || !selectedScale}
        >
          {#each categories as category}
            <option value={category.id}>{category.name}</option>
          {/each}
        </select>
      </div>
      
      <div class="select-wrapper">
        <label for="drill-select">Drill:</label>
        <select 
          id="drill-select" 
          bind:value={selectedDrill}
          disabled={!selectedKey || !selectedScale}
        >
          {#each drills as drill}
            <option value={drill}>{drill.name}</option>
          {/each}
        </select>
      </div>
      
      <div class="view-options">
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={showFullExercise} />
          Full exercise
        </label>
        
        {#if !showFullExercise}
          <div class="bars-control">
            <label for="bars-select">Bars:</label>
            <select id="bars-select" bind:value={barsToShow}>
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={16}>16</option>
            </select>
          </div>
        {/if}
      </div>
    </div>
    
    <div class="action-buttons">
      <Button
        onClick={togglePlayback}
        variant={isPlaying ? "danger" : "default"}
        icon={isPlaying ? StopIcon : MusicIcon}
        disabled={!samplerLoaded || !selectedKey || !selectedScale}
      >
        {isPlaying ? "Stop" : "Listen"}
      </Button>
      <Button
        onClick={() => dispatch('toggle-practice')}
        variant={isPracticing || isCountdown ? "danger" : "primary"}
        icon={isPracticing || isCountdown ? StopIcon : PlayIcon}
        disabled={!selectedKey || !selectedScale}
      >
        {isPracticing || isCountdown ? "Stop" : "Practice"}
      </Button>
      {#if isPlaying}
        <span class="tempo-display">{playbackBpm} BPM</span>
      {/if}
    </div>
  </div>
  
  {#if !selectedKey || !selectedScale}
    <p class="no-selection">Select a key and scale to view drill notation</p>
  {:else}
    <div class="pattern-preview">
      {#if selectedDrill?.type === 'chord-progression'}
        <div class="chord-progression-info">
          <span class="label">Progression:</span>
          <span class="numerals">{selectedDrill.numerals?.join(' – ') || ''}</span>
          <span class="separator">|</span>
          <span class="notes">{patternPreview}</span>
        </div>
        {#if selectedDrill.description}
          <p class="drill-description">{selectedDrill.description}</p>
        {/if}
      {:else}
        <span class="label">Pattern in {selectedKey} {selectedScale.name}:</span>
        <span class="notes">{patternPreview}</span>
      {/if}
    </div>
    
    <div class="notation-wrapper">
      <div bind:this={notationContainer} class="notation-display"></div>
    </div>
  {/if}
</div>

<style lang="scss">
  .drill-notation {
    margin-top: 2rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
  }
  
  .notation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .controls {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }
  
  .select-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
    }
    
    select {
      padding: 0.4rem 0.75rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
      cursor: pointer;
      min-width: 150px;
      
      &:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.25);
      }
      
      &:focus {
        outline: none;
        border-color: rgba(119, 210, 255, 0.5);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      option {
        background: #1a1a2e;
        color: rgba(255, 255, 255, 0.9);
      }
    }
  }
  
  .view-options {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    
    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: #77d2ff;
    }
  }
  
  .bars-control {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    
    label {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
    }
    
    select {
      padding: 0.3rem 0.5rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.85rem;
      cursor: pointer;
      
      option {
        background: #1a1a2e;
      }
    }
  }
  
  .action-buttons {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .tempo-display {
    font-size: 0.85rem;
    color: rgba(119, 210, 255, 0.9);
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    background: rgba(119, 210, 255, 0.1);
    border-radius: 4px;
  }
  
  .no-selection {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.5);
    font-style: italic;
    margin: 0;
    padding: 2rem;
    text-align: center;
  }
  
  .pattern-preview {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    background: rgba(119, 210, 255, 0.08);
    border-radius: 8px;
    
    .chord-progression-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    
    .label {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
    }
    
    .numerals {
      font-size: 1rem;
      font-weight: 600;
      color: rgba(253, 231, 45, 1);
    }
    
    .separator {
      color: rgba(255, 255, 255, 0.3);
    }
    
    .notes {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.95rem;
      color: rgba(119, 210, 255, 1);
      letter-spacing: 0.5px;
    }
    
    .drill-description {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
      font-style: italic;
      margin: 0;
    }
  }
  
  .notation-wrapper {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
  }
  
  .notation-display {
    min-height: 120px;
    
    :global(svg) {
      max-width: 100%;
      height: auto;
    }
    
    :global(.abcjs-note) {
      fill: #1a1a2e;
    }
    
    :global(.abcjs-staff) {
      stroke: #333;
    }
  }
</style>

