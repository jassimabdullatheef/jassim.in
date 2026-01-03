<script>
  import { createEventDispatcher, onMount } from "svelte";
  import Button from "$lib/components/Button.svelte";

  import CheckIcon from "$lib/icons/check.svelte";
  import SquareIcon from "$lib/icons/square.svelte";
  import SkipForwardIcon from "$lib/icons/skip-forward.svelte";

  /** @type {string | null} */
  export let selectedKey = null;
  /** @type {{ name: string; alternateNames: string[]; intervals: string[]; description: string } | null} */
  export let selectedScale = null;
  export let isCompleted = false;

  const dispatch = createEventDispatcher();

  /**
   * @param {string} key
   * @param {string[]} intervals
   */
  function generateNotes(key, intervals) {
    const notes = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const keyIndex = notes.indexOf(key);

    if (keyIndex === -1) {
      // Handle enharmonic equivalents
      /** @type {{ [key: string]: string }} */
      const enharmonicMap = {
        Db: "C#",
        Eb: "D#",
        Gb: "F#",
        Ab: "G#",
        Bb: "A#",
      };
      const mappedKey = enharmonicMap[key] || key;
      const mappedIndex = notes.indexOf(mappedKey);
      if (mappedIndex === -1) return [];
      return generateNotesFromIndex(mappedIndex, intervals, notes);
    }

    return generateNotesFromIndex(keyIndex, intervals, notes);
  }

  /**
   * @param {number} startIndex
   * @param {string[]} intervals
   * @param {string[]} notes
   */
  function generateNotesFromIndex(startIndex, intervals, notes) {
    const result = [notes[startIndex]];
    let currentIndex = startIndex;

    for (const interval of intervals) {
      let steps = 0;
      if (interval === "H") {
        steps = 1;
      } else if (interval === "W") {
        steps = 2;
      } else if (interval === "W+H") {
        steps = 3;
      }

      currentIndex = (currentIndex + steps) % 12;
      result.push(notes[currentIndex]);
    }

    return result;
  }

  function handleToggleCompletion() {
    if (selectedKey && selectedScale) {
      dispatch("toggle-completion", {
        key: selectedKey,
        scale: selectedScale.name,
      });
    }
  }

  function handleNext() {
    dispatch("next");
  }

  /** @type {string[]} */
  let scaleNotes = [];

  /**
   * @param {string[]} notes
   */
  function generatePianoKeys(notes) {
    // Normalize notes to sharps for consistency and create a Set for fast lookup
    /** @type {{ [key: string]: string }} */
    const enharmonicMap = {
      Db: "C#",
      Eb: "D#",
      Gb: "F#",
      Ab: "G#",
      Bb: "A#",
    };

    // Create normalized note set
    const noteSet = new Set();
    notes.forEach((note) => {
      // Add original note
      noteSet.add(note);
      // Add normalized version if it's different
      const normalized = enharmonicMap[note];
      if (normalized) {
        noteSet.add(normalized);
      }
    });

    // Piano layout: 2 octaves starting from C
    const whiteKeys = [
      "C",
      "D",
      "E",
      "F",
      "G",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "A",
      "B",
    ];
    /** @type {(string | null)[]} */
    const blackKeys = [
      "C#",
      "D#",
      null,
      "F#",
      "G#",
      "A#",
      null,
      "C#",
      "D#",
      null,
      "F#",
      "G#",
      "A#",
      null,
    ];

    /** @type {Array<{ type: 'white' | 'black'; note: string; isInScale: boolean; position: number }>} */
    const whiteKeyList = [];
    /** @type {Array<{ type: 'white' | 'black'; note: string; isInScale: boolean; position: number }>} */
    const blackKeyList = [];

    for (let i = 0; i < whiteKeys.length; i++) {
      // Add white key
      const whiteNote = whiteKeys[i];
      // Check if note is in scale (exact match or normalized match)
      const isInScale = noteSet.has(whiteNote);
      whiteKeyList.push({
        type: "white",
        note: whiteNote,
        isInScale,
        position: i,
      });

      // Add black key if it exists
      const blackNote = blackKeys[i];
      if (blackNote !== null) {
        // Check if note is in scale (exact match or normalized match)
        const isBlackInScale = noteSet.has(blackNote);
        blackKeyList.push({
          type: "black",
          note: blackNote,
          isInScale: isBlackInScale,
          position: i,
        });
      }
    }

    return { whiteKeys: whiteKeyList, blackKeys: blackKeyList };
  }

  /** @type {{ whiteKeys: Array<{ type: 'white' | 'black'; note: string; isInScale: boolean; position: number }>; blackKeys: Array<{ type: 'white' | 'black'; note: string; isInScale: boolean; position: number }> } | null} */
  let pianoKeys = null;

  // Reactive statement that depends on selectedKey and selectedScale
  $: {
    if (selectedKey && selectedScale) {
      const notes = generateNotes(selectedKey, selectedScale.intervals);
      scaleNotes = [...notes]; // Create new array to trigger reactivity
      // Create new object to ensure reactivity - deep copy to force re-render
      const keys = generatePianoKeys(notes);
      pianoKeys = {
        whiteKeys: keys.whiteKeys.map((k) => ({ ...k })),
        blackKeys: keys.blackKeys.map((k) => ({ ...k })),
      };
    } else {
      scaleNotes = [];
      pianoKeys = null;
    }
  }
</script>

{#if selectedKey && selectedScale}
  <div class="selected-scale">
    <div class="scale-info">
      <div class="columns">
        <div class="column">
          <div class="scale-title">
            <span class="key-name">{selectedKey}</span>
            <span class="scale-name">{selectedScale.name}</span>
            {#if selectedScale.alternateNames.length > 0}
              <span class="alternate-names"
                >({selectedScale.alternateNames.join(", ")})</span
              >
            {/if}
          </div>
          <p class="description">{selectedScale.description}</p>
          <div class="intervals-list">
            {#each selectedScale.intervals as interval}
              <span class="interval">{interval}</span>
            {/each}
          </div>
        </div>
        <div
          class="column is-flex is-justify-content-flex-end is-align-items-center"
        >
          <Button
            type="button"
            variant="default"
            onClick={handleToggleCompletion}
            icon={isCompleted ? CheckIcon : SquareIcon}
            iconPosition="left"
          >
            <span class="completion-label"
              >{isCompleted ? "Completed" : "Complete"}</span
            >
          </Button>
          <div class="button-separator" style="width: 10px"></div>
          <Button
            type="button"
            variant="default"
            icon={SkipForwardIcon}
            iconPosition="right"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </div>

      <div class="piano-section">
        {#if pianoKeys}
          <div class="piano-keyboard">
            {#each pianoKeys.whiteKeys as keyItem (keyItem.note + keyItem.position)}
              <button
                type="button"
                class="piano-key white"
                class:active={keyItem.isInScale}
                aria-label={keyItem.note}
                title={keyItem.isInScale
                  ? `${keyItem.note} is in scale`
                  : `${keyItem.note} is not in scale`}
              >
                <span class="key-label">{keyItem.note}</span>
              </button>
            {/each}
            {#each pianoKeys.blackKeys as keyItem (keyItem.note + keyItem.position)}
              <button
                type="button"
                class="piano-key black"
                class:active={keyItem.isInScale}
                aria-label={keyItem.note}
                style="left: {keyItem.position * 40 + 26}px;"
                title={keyItem.isInScale
                  ? `${keyItem.note} is in scale`
                  : `${keyItem.note} is not in scale`}
              >
                <span class="key-label">{keyItem.note}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
      <div class="notes-section">
        <div class="notes-list">
          {#each scaleNotes as note}
            <span class="note">{note}</span>
          {/each}
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="selected-scale empty">
    <div class="empty-state">
      <p>
        Select a scale from the list below to view details and mark as completed
      </p>
    </div>
  </div>
{/if}

<style lang="scss">
  .selected-scale {
    min-height: 300px;
    display: flex;
    flex-direction: column;

    &.empty {
      justify-content: center;
      align-items: center;
    }
  }

  .header {
    margin-bottom: 1.5rem;

    h3 {
      font-size: 1.5rem;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 600;
      margin: 0;
    }
  }

  .scale-info {
    flex: 1;
  }

  .scale-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .key-name {
    font-size: 2rem;
    font-weight: 700;
    color: rgba(119, 210, 255, 1);
  }

  .scale-name {
    font-size: 1.5rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }

  .alternate-names {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 400;
  }

  .description {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
    font-style: italic;
  }

  .piano-section,
  .notes-section,
  .intervals-section {
    margin-bottom: 1.5rem;

    h4 {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
  }

  .notes-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }

  .note {
    padding: 0.5rem 1rem;
    background: rgba(119, 210, 255, 0.15);
    border: 1px solid rgba(119, 210, 255, 0.3);
    border-radius: 8px;
    color: rgba(119, 210, 255, 1);
    font-weight: 600;
    font-size: 1rem;
  }

  .piano-keyboard {
    display: flex;
    position: relative;
    height: 200px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 0.5rem;
    overflow-x: auto;
    overflow-y: hidden;
    align-items: flex-start;
    width: 564px;
    margin: 0 auto;
  }

  .piano-key {
    position: relative;
    border: none;
    cursor: default;
    transition: all 0.2s ease;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 0.5rem;
    font-family: inherit;
    user-select: none;

    &.white {
      width: 40px;
      min-width: 40px;
      height: 100%;
      background: rgba(255, 255, 255, 0.3);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 0 0 4px 4px;
      z-index: 1;
      margin-right: -1px;
      transition:
        background 0.2s ease,
        border-color 0.2s ease,
        opacity 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.4);
      }

      &.active {
        background: #fff !important;
        border-color: rgba(0, 0, 0, 0.2) !important;
        opacity: 1 !important;

        &:hover {
          background: #f5f5f5 !important;
        }

        .key-label {
          color: rgba(0, 0, 0, 0.9) !important;
          font-weight: 700;
        }
      }
    }

    &.black {
      width: 28px;
      min-width: 28px;
      height: 60%;
      background: rgba(26, 26, 26, 0.3);
      border: 1px solid rgba(0, 0, 0, 0.3);
      border-radius: 0 0 3px 3px;
      z-index: 2;
      position: absolute;
      top: 0;
      transition:
        background 0.2s ease,
        border-color 0.2s ease,
        opacity 0.2s ease;

      &:hover {
        background: rgba(26, 26, 26, 0.4);
      }

      &.active {
        background: #1a1a1a !important;
        border-color: rgba(0, 0, 0, 0.5) !important;
        opacity: 1 !important;

        .key-label {
          color: rgba(255, 255, 255, 1) !important;
          font-weight: 700;
        }

        &:hover {
          background: #2a2a2a !important;
        }
      }
    }

    .key-label {
      font-size: 0.65rem;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.3);
      pointer-events: none;
    }

    .piano-key.black .key-label {
      color: rgba(255, 255, 255, 0.3);
      font-size: 0.6rem;
    }
  }

  .intervals-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .interval {
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
    font-size: 0.9rem;
  }

  .actions {
    margin-top: auto;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .completion-toggle {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }
  }

  .completion-checkbox {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: rgba(119, 210, 255, 0.9);
    flex-shrink: 0;
  }

  .completion-label {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    font-weight: 500;
  }

  .empty-state {
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.95rem;
    padding: 2rem;
  }
</style>
