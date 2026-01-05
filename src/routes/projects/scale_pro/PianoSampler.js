/**
 * Polyphonic Piano Sampler using Web Audio API
 * Uses freely available piano samples from a CDN
 */

// Note to MIDI number mapping (C4 = 60)
const NOTE_TO_MIDI = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11
};

// Sample URLs - Using free piano samples from a CDN
// These are from the Salamander Grand Piano (public domain)
const SAMPLE_BASE_URL = 'https://tonejs.github.io/audio/salamander/';

// We'll load samples for every 3rd note and pitch shift for in-between notes
const SAMPLE_NOTES = ['A0', 'C1', 'D#1', 'F#1', 'A1', 'C2', 'D#2', 'F#2', 'A2', 'C3', 'D#3', 'F#3', 'A3', 'C4', 'D#4', 'F#4', 'A4', 'C5', 'D#5', 'F#5', 'A5', 'C6', 'D#6', 'F#6', 'A6', 'C7', 'D#7', 'F#7', 'A7', 'C8'];

/**
 * Parse note name to get note and octave
 * @param {string} noteName - e.g., 'C4', 'F#3', 'Bb5'
 * @returns {{ note: string, octave: number }}
 */
function parseNoteName(noteName) {
  const match = noteName.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid note name: ${noteName}`);
  }
  return { note: match[1], octave: parseInt(match[2], 10) };
}

/**
 * Convert note name to MIDI number
 * @param {string} noteName - e.g., 'C4', 'F#3'
 * @returns {number} MIDI number
 */
function noteNameToMidi(noteName) {
  const { note, octave } = parseNoteName(noteName);
  const semitone = NOTE_TO_MIDI[note];
  if (semitone === undefined) {
    throw new Error(`Unknown note: ${note}`);
  }
  return (octave + 1) * 12 + semitone;
}

/**
 * Get sample URL for a note
 * @param {string} noteName
 * @returns {string}
 */
function getSampleUrl(noteName) {
  return `${SAMPLE_BASE_URL}${noteName.replace('#', 's')}.mp3`;
}

/**
 * @typedef {Object} Voice
 * @property {AudioBufferSourceNode} source
 * @property {GainNode} gainNode
 * @property {number} startTime
 */

export class PianoSampler {
  constructor() {
    /** @type {AudioContext | null} */
    this.audioContext = null;
    /** @type {Map<string, AudioBuffer>} */
    this.samples = new Map();
    /** @type {Map<string, Voice[]>} */
    this.activeVoices = new Map();
    this.isLoaded = false;
    this.isLoading = false;
    /** @type {((loaded: boolean) => void)[]} */
    this.loadCallbacks = [];
    this.masterGain = null;
    this.volume = 0.7;
    
    // ADSR envelope parameters (in seconds)
    this.envelope = {
      attack: 0.005,   // Quick attack for piano-like response
      decay: 0.15,     // Short decay to sustain level
      sustain: 0.7,    // Sustain level (0-1, relative to velocity)
      release: 0.25    // Release time when note ends
    };
  }

  /**
   * Initialize the audio context and load samples
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isLoaded || this.isLoading) {
      return;
    }

    this.isLoading = true;

    try {
      // Create audio context (must be triggered by user interaction in some browsers)
      this.audioContext = new (window.AudioContext || /** @type {any} */ (window).webkitAudioContext)();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);

      // Load all samples in parallel
      const loadPromises = SAMPLE_NOTES.map(async (noteName) => {
        try {
          const url = getSampleUrl(noteName);
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          this.samples.set(noteName, audioBuffer);
        } catch (error) {
          console.warn(`Failed to load sample for ${noteName}:`, error);
        }
      });

      await Promise.all(loadPromises);
      this.isLoaded = true;
      this.isLoading = false;
      
      // Notify all callbacks
      this.loadCallbacks.forEach(cb => cb(true));
      this.loadCallbacks = [];
    } catch (error) {
      console.error('Failed to initialize piano sampler:', error);
      this.isLoading = false;
      this.loadCallbacks.forEach(cb => cb(false));
      this.loadCallbacks = [];
    }
  }

  /**
   * Wait for the sampler to be loaded
   * @returns {Promise<boolean>}
   */
  whenLoaded() {
    if (this.isLoaded) {
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      this.loadCallbacks.push(resolve);
    });
  }

  /**
   * Find the closest sample to pitch shift from
   * @param {number} targetMidi
   * @returns {{ sampleName: string, semitoneShift: number } | null}
   */
  findClosestSample(targetMidi) {
    let closest = null;
    let minDistance = Infinity;

    for (const sampleName of this.samples.keys()) {
      const sampleMidi = noteNameToMidi(sampleName);
      const distance = Math.abs(targetMidi - sampleMidi);
      if (distance < minDistance) {
        minDistance = distance;
        closest = { sampleName, semitoneShift: targetMidi - sampleMidi };
      }
    }

    return closest;
  }

  /**
   * Play a note
   * @param {string} note - Note name without octave (e.g., 'C', 'F#')
   * @param {number} [octave=4] - Octave number
   * @param {number} [velocity=0.8] - Velocity (0-1)
   * @param {number} [duration=1] - Duration in seconds (0 for sustained until release)
   * @returns {string} Voice ID for stopping the note
   */
  playNote(note, octave = 4, velocity = 0.8, duration = 0) {
    if (!this.isLoaded || !this.audioContext || !this.masterGain) {
      console.warn('Piano sampler not loaded yet');
      return '';
    }

    // Resume context if suspended (required for some browsers)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const noteName = `${note}${octave}`;
    const targetMidi = noteNameToMidi(noteName);
    const closest = this.findClosestSample(targetMidi);

    if (!closest) {
      console.warn(`No sample found for ${noteName}`);
      return '';
    }

    const sample = this.samples.get(closest.sampleName);
    if (!sample) {
      console.warn(`Sample not loaded for ${closest.sampleName}`);
      return '';
    }

    // Create source node
    const source = this.audioContext.createBufferSource();
    source.buffer = sample;
    
    // Apply pitch shift using detune (100 cents = 1 semitone)
    source.detune.value = closest.semitoneShift * 100;

    // Create gain node for this voice
    const gainNode = this.audioContext.createGain();
    
    // Apply ADSR envelope
    const { attack, decay, sustain, release } = this.envelope;
    const currentTime = this.audioContext.currentTime;
    const sustainLevel = velocity * sustain;
    
    // Start at 0
    gainNode.gain.setValueAtTime(0.001, currentTime);
    // Attack: ramp up to full velocity
    gainNode.gain.exponentialRampToValueAtTime(velocity, currentTime + attack);
    // Decay: ramp down to sustain level
    gainNode.gain.exponentialRampToValueAtTime(Math.max(sustainLevel, 0.001), currentTime + attack + decay);

    // Connect the chain
    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Generate unique voice ID
    const voiceId = `${noteName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Track active voice
    const voice = { source, gainNode, startTime: currentTime };
    if (!this.activeVoices.has(noteName)) {
      this.activeVoices.set(noteName, []);
    }
    this.activeVoices.get(noteName)?.push(voice);

    // Start playback
    source.start();

    // Handle duration
    if (duration > 0) {
      // Calculate when to start the release phase
      const releaseStartTime = currentTime + duration;
      
      // Hold at sustain level until release, then release
      gainNode.gain.setValueAtTime(Math.max(sustainLevel, 0.001), releaseStartTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, releaseStartTime + release);
      source.stop(releaseStartTime + release + 0.05);
      
      // Clean up after stop
      source.onended = () => {
        const voices = this.activeVoices.get(noteName);
        if (voices) {
          const index = voices.indexOf(voice);
          if (index > -1) {
            voices.splice(index, 1);
          }
        }
      };
    }

    return voiceId;
  }

  /**
   * Stop a specific note
   * @param {string} note - Note name without octave
   * @param {number} [octave=4] - Octave number
   * @param {number} [releaseTime] - Release time in seconds (defaults to envelope release)
   */
  stopNote(note, octave = 4, releaseTime) {
    if (!this.audioContext) return;

    const noteName = `${note}${octave}`;
    const voices = this.activeVoices.get(noteName);
    
    if (!voices || voices.length === 0) return;

    const currentTime = this.audioContext.currentTime;
    const actualReleaseTime = releaseTime ?? this.envelope.release;
    
    // Release all voices for this note
    voices.forEach(voice => {
      try {
        voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, currentTime);
        voice.gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + actualReleaseTime);
        voice.source.stop(currentTime + actualReleaseTime + 0.05);
      } catch (e) {
        // Voice may have already stopped
      }
    });

    // Clear voices
    this.activeVoices.set(noteName, []);
  }

  /**
   * Play a chord (multiple notes simultaneously)
   * @param {Array<{ note: string, octave?: number }>} notes
   * @param {number} [velocity=0.7]
   * @param {number} [duration=1]
   */
  playChord(notes, velocity = 0.7, duration = 1) {
    notes.forEach(({ note, octave = 4 }) => {
      this.playNote(note, octave, velocity, duration);
    });
  }

  /**
   * Play a sequence of notes with timing
   * @param {Array<{ note: string, octave?: number, duration?: number, delay?: number }>} sequence
   * @param {number} [velocity=0.8]
   */
  async playSequence(sequence, velocity = 0.8) {
    for (const { note, octave = 4, duration = 0.5, delay = 0 } of sequence) {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
      }
      this.playNote(note, octave, velocity, duration);
      await new Promise(resolve => setTimeout(resolve, duration * 1000));
    }
  }

  /**
   * Set master volume
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /**
   * Stop all currently playing notes
   */
  stopAll() {
    if (!this.audioContext) return;

    const currentTime = this.audioContext.currentTime;
    const quickRelease = Math.min(this.envelope.release, 0.15); // Use quick release for stop all
    
    this.activeVoices.forEach((voices, noteName) => {
      voices.forEach(voice => {
        try {
          voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, currentTime);
          voice.gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + quickRelease);
          voice.source.stop(currentTime + quickRelease + 0.05);
        } catch (e) {
          // Voice may have already stopped
        }
      });
    });

    this.activeVoices.clear();
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stopAll();
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.samples.clear();
    this.isLoaded = false;
  }
}

// Export a singleton instance for shared use across components
export const pianoSampler = new PianoSampler();

