/**
 * Piano Drills Library
 * 
 * Scale-degree based notation system that can be transposed to any key + scale/mode.
 * 
 * FORMAT:
 * - Pattern values are SCALE DEGREES (0-indexed): 0=root, 1=2nd, 2=3rd, 3=4th, 4=5th, 5=6th, 6=7th
 * - Degrees >= 7 span into the next octave (7=root+octave, 8=2nd+octave, etc.)
 * - Chord: array of degrees [0, 2, 4] = root-3rd-5th triad
 * - Duration: note value (1=whole, 2=half, 4=quarter, 8=eighth, 16=sixteenth)
 * 
 * TYPES:
 * - "explicit": notes array contains the full exercise
 * - "scale-sequence": pattern repeats, shifting by 'step' scale degrees each time
 * - "hanon-style": ascending pattern (8 reps, +1 each), then descending inverted pattern (8 reps, -1 each)
 */

import basicExercises from './basic-exercises.json';
import chordProgressions from './chord-progressions.json';
import arpeggios from './arpeggios.json';

// Note names for display
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Keys that conventionally use flats
const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];

/**
 * Convert interval notation (W, H, W+H) to semitones
 */
function intervalToSemitones(interval) {
  switch (interval) {
    case 'H': return 1;
    case 'W': return 2;
    case 'W+H': return 3;
    default: return parseInt(interval) || 0;
  }
}

/**
 * Get the semitone index of a note name (0-11)
 * @param {string} noteName - e.g., "C", "F#", "Bb"
 * @returns {number}
 */
export function getNoteIndex(noteName) {
  const normalized = noteName.charAt(0).toUpperCase() + noteName.slice(1).toLowerCase();
  let index = NOTE_NAMES.indexOf(normalized);
  if (index === -1) {
    index = NOTE_NAMES_FLAT.indexOf(normalized);
  }
  return index;
}

/**
 * Build the actual scale notes (as semitone offsets from root) from interval pattern
 * @param {string[]} intervals - e.g., ["W", "W", "H", "W", "W", "W", "H"]
 * @returns {number[]} - semitone offsets for each scale degree [0, 2, 4, 5, 7, 9, 11]
 */
export function buildScaleOffsets(intervals) {
  const offsets = [0];
  let current = 0;
  
  for (let i = 0; i < intervals.length - 1; i++) {
    current += intervalToSemitones(intervals[i]);
    offsets.push(current);
  }
  
  return offsets;
}

/**
 * Convert a scale degree to semitone offset, handling octave overflow
 * @param {number} degree - 0-indexed scale degree (can be >= 7 for higher octaves, or negative)
 * @param {number[]} scaleOffsets - semitone offsets for scale degrees [0, 2, 4, 5, 7, 9, 11]
 * @returns {number} - semitone offset from root
 */
export function degreeToSemitones(degree, scaleOffsets) {
  const scaleLength = scaleOffsets.length;
  
  if (degree >= 0) {
    const octaveOffset = Math.floor(degree / scaleLength) * 12;
    const degreeInOctave = degree % scaleLength;
    return scaleOffsets[degreeInOctave] + octaveOffset;
  } else {
    // Handle negative degrees (going below root)
    const octaveOffset = Math.floor(degree / scaleLength) * 12;
    const degreeInOctave = ((degree % scaleLength) + scaleLength) % scaleLength;
    return scaleOffsets[degreeInOctave] + octaveOffset;
  }
}

/**
 * Get note name from semitone offset
 * @param {number} semitones - semitone offset from root
 * @param {string} rootKey - root key name
 * @param {number} baseOctave
 * @param {boolean} useFlats 
 * @returns {{ name: string, octave: number, midi: number }}
 */
export function semitonesToNote(semitones, rootKey, baseOctave = 4, useFlats = false) {
  const rootIndex = getNoteIndex(rootKey);
  const absoluteSemitone = rootIndex + semitones;
  const noteIndex = ((absoluteSemitone % 12) + 12) % 12;
  const octaveShift = Math.floor(absoluteSemitone / 12);
  
  const noteNames = useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES;
  
  return {
    name: noteNames[noteIndex],
    octave: baseOctave + octaveShift,
    midi: (baseOctave + 1) * 12 + rootIndex + semitones
  };
}

/**
 * Transpose a scale degree to actual note
 * @param {number|number[]} degreeOrChord - scale degree or array of degrees
 * @param {string} rootKey - e.g., "C", "F#"
 * @param {number[]} scaleOffsets - from buildScaleOffsets()
 * @param {number} baseOctave 
 * @param {boolean} useFlats 
 */
export function transposeDegree(degreeOrChord, rootKey, scaleOffsets, baseOctave = 4, useFlats = false) {
  if (Array.isArray(degreeOrChord)) {
    return degreeOrChord.map(d => transposeDegree(d, rootKey, scaleOffsets, baseOctave, useFlats));
  }
  
  const semitones = degreeToSemitones(degreeOrChord, scaleOffsets);
  return semitonesToNote(semitones, rootKey, baseOctave, useFlats);
}

/**
 * Expand a hanon-style drill into full scale degrees
 * 
 * Standard: ascending (8 reps shifting up), then descending (8 reps shifting down)
 * Reverse: descending first (8 reps shifting down), then ascending (8 reps shifting up)
 * 
 * @param {object} drill 
 * @param {number} [barsToShow] - Optional limit on number of bars to generate
 * @returns {number[]}
 */
export function expandHanonStyle(drill, barsToShow) {
  const { pattern, repeats = 8, reverse = false } = drill;
  const degrees = [];
  
  const maxPatternDegree = Math.max(...pattern);
  const minPatternDegree = Math.min(...pattern);
  
  // If barsToShow is specified, limit the output
  const totalBars = barsToShow ?? (repeats * 2); // Full exercise is 2x repeats (ascending + descending)
  const ascendingBars = Math.min(repeats, totalBars);
  const descendingBars = Math.max(0, totalBars - repeats);
  
  if (reverse) {
    // REVERSE: Descending first, then ascending
    // Start high, go down by -1 each rep, then back up
    
    const startDegree = (repeats - 1); // Start offset for descending
    
    // DESCENDING: pattern shifts down by 1 each repetition
    for (let rep = 0; rep < ascendingBars; rep++) {
      pattern.forEach(degree => {
        degrees.push(degree + startDegree - rep);
      });
    }
    
    // ASCENDING: inverted pattern, shifts up by 1 each repetition
    const invertedPattern = pattern.map(d => -d);
    const lowestPoint = minPatternDegree; // Where descending ends
    
    for (let rep = 0; rep < descendingBars; rep++) {
      invertedPattern.forEach(offset => {
        degrees.push(lowestPoint + rep + offset);
      });
    }
  } else {
    // STANDARD: Ascending first, then descending
    
    // Calculate the peak degree (where ascending ends)
    const peakStartDegree = (repeats - 1) + maxPatternDegree;
    
    // ASCENDING: pattern shifts up by 1 each repetition
    for (let rep = 0; rep < ascendingBars; rep++) {
      pattern.forEach(degree => {
        degrees.push(degree + rep);
      });
    }
    
    // DESCENDING: inverted pattern, shifts down by 1 each repetition
    const invertedPattern = pattern.map(d => -d);
    
    for (let rep = 0; rep < descendingBars; rep++) {
      const startDegree = peakStartDegree - rep;
      invertedPattern.forEach(offset => {
        degrees.push(startDegree + offset);
      });
    }
  }
  
  return degrees;
}

/**
 * Expand a scale-sequence type drill into full scale degrees
 * @param {object} drill 
 * @returns {number[]}
 */
export function expandScaleSequence(drill) {
  const { pattern, step = 1, repeats } = drill;
  const degrees = [];
  
  // Ascending
  for (let i = 0; i < repeats; i++) {
    const offset = i * step;
    pattern.forEach(degree => {
      degrees.push(degree + offset);
    });
  }
  
  // Descending (reverse pattern, go back down)
  for (let i = repeats - 1; i >= 0; i--) {
    const offset = i * step;
    const reversedPattern = [...pattern].reverse();
    reversedPattern.forEach(degree => {
      degrees.push(degree + offset);
    });
  }
  
  return degrees;
}

/**
 * Expand a chord progression into individual chord events
 * @param {object} drill - chord progression drill
 * @param {number} [barsToShow] - Optional limit on number of bars
 * @returns {Array<{ bass: number[], voicing: number[] }>}
 */
export function expandChordProgression(drill, barsToShow) {
  const { chords, repeats = 1 } = drill;
  const result = [];
  
  const totalChords = barsToShow ?? (chords.length * repeats);
  let chordsAdded = 0;
  
  for (let rep = 0; rep < repeats && chordsAdded < totalChords; rep++) {
    for (let i = 0; i < chords.length && chordsAdded < totalChords; i++) {
      result.push({
        bass: chords[i].bass,
        voicing: chords[i].voicing
      });
      chordsAdded++;
    }
  }
  
  return result;
}

/**
 * Transpose a chromatic semitone offset to actual note
 * Used for chord progressions which are stored as chromatic offsets (0-11)
 * @param {number} semitoneOffset - chromatic semitone offset from root (0-11, can exceed for higher octaves)
 * @param {string} rootKey - target key (e.g., "C", "F#")
 * @param {number} baseOctave - base octave
 * @param {boolean} useFlats - whether to use flat notation
 * @returns {{ name: string, octave: number, midi: number }}
 */
export function transposeChromaticSemitone(semitoneOffset, rootKey, baseOctave = 4, useFlats = false) {
  const rootIndex = getNoteIndex(rootKey);
  const absoluteSemitone = rootIndex + semitoneOffset;
  const noteIndex = ((absoluteSemitone % 12) + 12) % 12;
  const octaveShift = Math.floor(absoluteSemitone / 12);
  
  const noteNames = useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES;
  
  return {
    name: noteNames[noteIndex],
    octave: baseOctave + octaveShift,
    midi: (baseOctave + 1) * 12 + rootIndex + semitoneOffset
  };
}

/**
 * Get chord progression notes for both hands
 * Chord progressions use chromatic semitone offsets (not scale degrees)
 * so they transpose correctly to all 12 keys
 * @param {object} drill - chord progression drill
 * @param {string} key - target key
 * @param {string[]} scaleIntervals - scale intervals (not used for chord progressions)
 * @param {object} options - { octave, barsToShow }
 * @returns {{ rightHand: Array, leftHand: Array }}
 */
export function getChordProgressionNotes(drill, key, scaleIntervals, options = {}) {
  const { octave = 4, barsToShow } = options;
  const useFlats = FLAT_KEYS.includes(key);
  const duration = drill.duration || 4;
  
  const chordEvents = expandChordProgression(drill, barsToShow);
  
  const rightHand = [];
  const leftHand = [];
  
  for (const event of chordEvents) {
    // Right hand: chord voicing (octave 4)
    // Voicings are chromatic semitone offsets from root
    const rhNotes = event.voicing.map(semitone => 
      transposeChromaticSemitone(semitone, key, octave, useFlats)
    );
    rightHand.push({ notes: rhNotes, duration });
    
    // Left hand: bass notes (octave 2-3)
    const lhNotes = event.bass.map(semitone => 
      transposeChromaticSemitone(semitone, key, octave - 2, useFlats)
    );
    leftHand.push({ notes: lhNotes, duration });
  }
  
  return { rightHand, leftHand };
}

/**
 * Get the notes for a drill, transposed to a specific key and scale
 * @param {object} drill - drill object
 * @param {string} key - target key (e.g., "C", "F#")
 * @param {string[]} scaleIntervals - e.g., ["W", "W", "H", "W", "W", "W", "H"]
 * @param {object} options - { octave, hand, barsToShow }
 * @returns {Array<{ name: string, octave: number, midi: number, duration: number }>}
 */
export function getDrillNotes(drill, key, scaleIntervals, options = {}) {
  const { octave = 4, hand = 'right', barsToShow } = options;
  const scaleOffsets = buildScaleOffsets(scaleIntervals);
  const useFlats = FLAT_KEYS.includes(key);
  
  // Handle chord progressions separately
  if (drill.type === 'chord-progression') {
    const { rightHand, leftHand } = getChordProgressionNotes(drill, key, scaleIntervals, { octave, barsToShow });
    return hand === 'left' ? leftHand : rightHand;
  }
  
  let degrees;
  if (drill.type === 'hanon-style') {
    // Pass barsToShow to get proper ascending + descending pattern
    degrees = expandHanonStyle(drill, barsToShow);
  } else if (drill.type === 'scale-sequence') {
    degrees = expandScaleSequence(drill);
    if (barsToShow) {
      const patternLength = drill.pattern.length;
      degrees = degrees.slice(0, patternLength * barsToShow);
    }
  } else {
    degrees = drill.notes || drill.pattern;
    if (barsToShow) {
      const patternLength = (drill.pattern || drill.notes).length;
      degrees = degrees.slice(0, patternLength * barsToShow);
    }
  }
  
  const duration = drill.duration || 8;
  
  // Left hand plays one octave lower
  const baseOctave = hand === 'left' ? octave - 1 : octave;
  
  return degrees.map(degree => {
    const note = transposeDegree(degree, key, scaleOffsets, baseOctave, useFlats);
    
    if (Array.isArray(note)) {
      return { notes: note, duration };
    }
    
    return { ...note, duration };
  });
}

/**
 * Get both hands' notes for a drill
 * @param {object} drill 
 * @param {string} key 
 * @param {string[]} scaleIntervals 
 * @param {object} options - { octave, barsToShow }
 * @returns {{ rightHand: Array, leftHand: Array }}
 */
export function getDrillNotesForBothHands(drill, key, scaleIntervals, options = {}) {
  const { octave = 4, barsToShow } = options;
  
  // Chord progressions have different voicings for each hand
  if (drill.type === 'chord-progression') {
    return getChordProgressionNotes(drill, key, scaleIntervals, { octave, barsToShow });
  }
  
  return {
    rightHand: getDrillNotes(drill, key, scaleIntervals, { octave, hand: 'right', barsToShow }),
    leftHand: getDrillNotes(drill, key, scaleIntervals, { octave, hand: 'left', barsToShow })
  };
}

/**
 * Get just the base pattern transposed (without expanding sequences)
 * @param {object} drill 
 * @param {string} key 
 * @param {string[]} scaleIntervals
 * @param {number} octave 
 */
export function getDrillPattern(drill, key, scaleIntervals, octave = 4) {
  const scaleOffsets = buildScaleOffsets(scaleIntervals);
  const useFlats = FLAT_KEYS.includes(key);
  
  // Chord progressions use chromatic transposition
  if (drill.type === 'chord-progression') {
    return drill.chords.map(chord => {
      // Use chromatic transposition for chord progressions
      const notes = chord.voicing.map(semitone => 
        transposeChromaticSemitone(semitone, key, octave, useFlats)
      );
      // Build chord name from root note + quality
      const rootNote = transposeChromaticSemitone(chord.bass[0], key, octave, useFlats);
      const chordName = rootNote.name + (chord.quality === 'minor' ? 'm' : '');
      return { notes, chordName, numeral: chord.numeral };
    });
  }
  
  const pattern = drill.pattern || drill.notes;
  return pattern.map(degree => transposeDegree(degree, key, scaleOffsets, octave, useFlats));
}

/**
 * Get the full exercise broken into bars/measures
 * @param {object} drill 
 * @param {string} key 
 * @param {string[]} scaleIntervals 
 * @param {number} octave 
 * @returns {Array<Array>} - array of bars, each bar is array of notes
 */
export function getDrillBars(drill, key, scaleIntervals, octave = 4) {
  const notes = getDrillNotes(drill, key, scaleIntervals, { octave });
  const patternLength = drill.pattern.length;
  
  const bars = [];
  for (let i = 0; i < notes.length; i += patternLength) {
    bars.push(notes.slice(i, i + patternLength));
  }
  
  return bars;
}

/**
 * Format notes as a readable string
 * @param {Array} notes 
 * @returns {string}
 */
export function formatNotesAsString(notes) {
  return notes.map(n => {
    if (n.notes) {
      return `[${n.notes.map(note => `${note.name}${note.octave}`).join(' ')}]`;
    }
    return `${n.name}${n.octave}`;
  }).join(' ');
}

/**
 * Format just note names (without octave)
 * @param {Array} notes 
 * @returns {string}
 */
export function formatNoteNames(notes) {
  return notes.map(n => {
    if (n.notes) {
      return `[${n.notes.map(note => note.name).join(' ')}]`;
    }
    return n.name;
  }).join(' ');
}

// Export all drills
export const drills = {
  basicExercises,
  chordProgressions,
  arpeggios
};

// Get drills by category
export function getDrillsByCategory(category) {
  const allDrills = [...basicExercises, ...chordProgressions, ...arpeggios];
  if (category) {
    return allDrills.filter(d => d.category === category);
  }
  return allDrills;
}

// Categories
export const categories = [
  { id: 'basic-exercises', name: 'Basic Exercises', description: 'Finger independence and strength (Hanon, etc.)' },
  { id: 'chord-progressions', name: 'Chord Progressions', description: 'Common chord progressions in all keys' },
  { id: 'arpeggios', name: 'Arpeggios', description: 'Broken chord patterns and arpeggio exercises' },
];

export { NOTE_NAMES, NOTE_NAMES_FLAT, FLAT_KEYS };

/**
 * Convert MIDI note to ABC notation
 * @param {number} midi - MIDI note number
 * @param {boolean} useFlats
 * @returns {string}
 */
function midiToAbc(midi, useFlats = false) {
  const noteNames = useFlats 
    ? ['C', '_D', 'D', '_E', 'E', 'F', '_G', 'G', '_A', 'A', '_B', 'B']
    : ['C', '^C', 'D', '^D', 'E', 'F', '^F', 'G', '^G', 'A', '^A', 'B'];
  
  const noteIndex = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  let noteName = noteNames[noteIndex];
  
  // ABC octave notation:
  // C,, = C1, C, = C2, C = C3, c = C4, c' = C5, c'' = C6
  if (octave <= 2) {
    noteName = noteName.toUpperCase();
    if (octave === 2) noteName += ',';
    if (octave === 1) noteName += ',,';
    if (octave === 0) noteName += ',,,';
  } else if (octave === 3) {
    noteName = noteName.toUpperCase();
  } else if (octave === 4) {
    noteName = noteName.toLowerCase();
  } else if (octave >= 5) {
    noteName = noteName.toLowerCase();
    noteName += "'".repeat(octave - 4);
  }
  
  return noteName;
}

/**
 * Convert duration value to ABC notation
 * @param {number} duration - 1=whole, 2=half, 4=quarter, 8=eighth, 16=sixteenth
 * @returns {string}
 */
function durationToAbc(duration) {
  // Default unit length is 1/8 in our ABC
  switch (duration) {
    case 1: return '8';   // whole note = 8 eighth notes
    case 2: return '4';   // half note = 4 eighth notes
    case 4: return '2';   // quarter note = 2 eighth notes
    case 8: return '';    // eighth note = 1 (default)
    case 16: return '/2'; // sixteenth = half of eighth
    case 32: return '/4'; // thirty-second
    default: return '';
  }
}

/**
 * Convert a chord progression to ABC notation string with grand staff
 * @param {object} drill - chord progression drill
 * @param {string} key - target key
 * @param {string[]} scaleIntervals - scale intervals
 * @param {object} options
 * @returns {string} - ABC notation string
 */
export function chordProgressionToAbc(drill, key, scaleIntervals, options = {}) {
  const { 
    octave = 4, 
    showFullExercise = false,
    barsToShow = 4 
  } = options;
  
  const useFlats = FLAT_KEYS.includes(key);
  // Chord progressions use chromatic transposition, not scale intervals
  const rootIndex = getNoteIndex(key);
  
  const chordEvents = expandChordProgression(drill, showFullExercise ? undefined : barsToShow);
  const duration = drill.duration || 4;
  const durationAbc = durationToAbcInternal(duration);
  
  // Build ABC header
  const abcKey = useFlats ? key.replace('#', '') : key.replace('b', '');
  let abc = `X:1\n`;
  abc += `T:${drill.name}\n`;
  abc += `M:4/4\n`;
  abc += `L:1/4\n`;
  abc += `%%staves {RH LH}\n`;
  abc += `V:RH clef=treble name="R.H."\n`;
  abc += `V:LH clef=bass name="L.H."\n`;
  abc += `K:${abcKey}\n`;
  
  // Right hand (chord voicings)
  abc += `[V:RH] `;
  chordEvents.forEach((event, i) => {
    // Build chord notation [CEG] using chromatic semitone offsets
    const notes = event.voicing.map(semitoneOffset => {
      // Chromatic transposition: just add root key offset to semitone offset
      const midi = (octave + 1) * 12 + rootIndex + semitoneOffset;
      return midiToAbcInternal(midi, useFlats);
    });
    abc += `[${notes.join('')}]${durationAbc}`;
    
    // Add bar line every 4 beats in 4/4 time (1 chord per bar for quarter notes)
    const chordsPerBar = 4 / duration * 4; // duration 4 = 1 chord per bar, duration 2 = 0.5 chords per bar, etc.
    if ((i + 1) % chordsPerBar === 0 && i < chordEvents.length - 1) {
      abc += ' | ';
    } else {
      abc += ' ';
    }
  });
  abc += '|]\n';
  
  // Left hand (bass notes)
  const lhOctave = octave - 2;
  abc += `[V:LH] `;
  chordEvents.forEach((event, i) => {
    // Build bass note(s) using chromatic semitone offsets
    if (event.bass.length === 1) {
      const midi = (lhOctave + 1) * 12 + rootIndex + event.bass[0];
      abc += midiToAbcInternal(midi, useFlats) + durationAbc;
    } else {
      const notes = event.bass.map(semitoneOffset => {
        const midi = (lhOctave + 1) * 12 + rootIndex + semitoneOffset;
        return midiToAbcInternal(midi, useFlats);
      });
      abc += `[${notes.join('')}]${durationAbc}`;
    }
    
    const chordsPerBar = 4 / duration * 4;
    if ((i + 1) % chordsPerBar === 0 && i < chordEvents.length - 1) {
      abc += ' | ';
    } else {
      abc += ' ';
    }
  });
  abc += '|]';
  
  return abc;
}

/**
 * Internal helper - Convert MIDI note to ABC notation
 * @param {number} midi - MIDI note number
 * @param {boolean} useFlats
 * @returns {string}
 */
function midiToAbcInternal(midi, useFlats = false) {
  const noteNames = useFlats 
    ? ['C', '_D', 'D', '_E', 'E', 'F', '_G', 'G', '_A', 'A', '_B', 'B']
    : ['C', '^C', 'D', '^D', 'E', 'F', '^F', 'G', '^G', 'A', '^A', 'B'];
  
  const noteIndex = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  let noteName = noteNames[noteIndex];
  
  // ABC octave notation:
  // C,, = C1, C, = C2, C = C3, c = C4, c' = C5, c'' = C6
  if (octave <= 2) {
    noteName = noteName.toUpperCase();
    if (octave === 2) noteName += ',';
    if (octave === 1) noteName += ',,';
    if (octave === 0) noteName += ',,,';
  } else if (octave === 3) {
    noteName = noteName.toUpperCase();
  } else if (octave === 4) {
    noteName = noteName.toLowerCase();
  } else if (octave >= 5) {
    noteName = noteName.toLowerCase();
    noteName += "'".repeat(octave - 4);
  }
  
  return noteName;
}

/**
 * Internal helper - Convert duration value to ABC notation
 * @param {number} duration - 1=whole, 2=half, 4=quarter, 8=eighth, 16=sixteenth
 * @returns {string}
 */
function durationToAbcInternal(duration) {
  // Default unit length is 1/4 for chord progressions
  switch (duration) {
    case 1: return '4';   // whole note = 4 quarter notes
    case 2: return '2';   // half note = 2 quarter notes
    case 4: return '';    // quarter note = 1 (default)
    case 8: return '/2';  // eighth note = half of quarter
    case 16: return '/4'; // sixteenth
    default: return '';
  }
}

/**
 * Convert a drill to ABC notation string with grand staff (both hands)
 * @param {object} drill - drill object
 * @param {string} key - target key
 * @param {string[]} scaleIntervals - scale intervals
 * @param {object} options
 * @returns {string} - ABC notation string
 */
export function drillToAbc(drill, key, scaleIntervals, options = {}) {
  // Delegate to specialized function for chord progressions
  if (drill.type === 'chord-progression') {
    return chordProgressionToAbc(drill, key, scaleIntervals, options);
  }
  const { 
    octave = 4, 
    showFullExercise = false,
    barsToShow = 4 
  } = options;
  
  const useFlats = FLAT_KEYS.includes(key);
  const scaleOffsets = buildScaleOffsets(scaleIntervals);
  
  // Get the pattern or expanded notes
  let degrees;
  if (showFullExercise) {
    if (drill.type === 'hanon-style') {
      degrees = expandHanonStyle(drill);
    } else if (drill.type === 'scale-sequence') {
      degrees = expandScaleSequence(drill);
    } else {
      degrees = drill.notes || drill.pattern;
    }
  } else {
    // Just show specified number of bars
    if (drill.type === 'hanon-style') {
      // Use expandHanonStyle with barsToShow to get proper ascending + descending
      degrees = expandHanonStyle(drill, barsToShow);
    } else if (drill.type === 'scale-sequence') {
      degrees = expandScaleSequence(drill);
      const patternLength = drill.pattern.length;
      degrees = degrees.slice(0, patternLength * barsToShow);
    } else {
      const pattern = drill.pattern || drill.notes;
      const patternLength = pattern.length;
      degrees = pattern.slice(0, patternLength * barsToShow);
    }
  }
  
  const duration = drill.duration || 8;
  const durationAbc = durationToAbc(duration);
  
  // Build ABC header with grand staff
  const abcKey = useFlats ? key.replace('#', '') : key.replace('b', '');
  let abc = `X:1\n`;
  abc += `T:${drill.name}\n`;
  abc += `M:2/4\n`;
  abc += `L:1/8\n`;
  abc += `%%staves {RH LH}\n`;
  abc += `V:RH clef=treble name="R.H."\n`;
  abc += `V:LH clef=bass name="L.H."\n`;
  abc += `K:${abcKey}\n`;
  
  // Build right hand notes (octave 4)
  const patternLength = drill.pattern?.length || 8;
  const beamGroup = 4; // Beam 16th notes in groups of 4 (one beat in 2/4)
  
  abc += `[V:RH] `;
  let noteCount = 0;
  degrees.forEach((degree, i) => {
    const semitones = degreeToSemitones(degree, scaleOffsets);
    const midi = (octave + 1) * 12 + getNoteIndex(key) + semitones;
    const abcNote = midiToAbc(midi, useFlats);
    
    abc += abcNote + durationAbc;
    noteCount++;
    
    // Add bar line every patternLength notes (8 for Hanon = one bar in 2/4)
    if (noteCount % patternLength === 0 && i < degrees.length - 1) {
      abc += ' | ';
    } else if (noteCount % beamGroup === 0) {
      // Add space between beam groups (every 4 notes = one beat)
      abc += ' ';
    }
    // No space within beam group - notes will be beamed together
  });
  abc += '|]\n';
  
  // Build left hand notes (one octave lower)
  const leftOctave = octave - 1;
  abc += `[V:LH] `;
  noteCount = 0;
  degrees.forEach((degree, i) => {
    const semitones = degreeToSemitones(degree, scaleOffsets);
    const midi = (leftOctave + 1) * 12 + getNoteIndex(key) + semitones;
    const abcNote = midiToAbc(midi, useFlats);
    
    abc += abcNote + durationAbc;
    noteCount++;
    
    if (noteCount % patternLength === 0 && i < degrees.length - 1) {
      abc += ' | ';
    } else if (noteCount % beamGroup === 0) {
      abc += ' ';
    }
  });
  abc += '|]';
  
  return abc;
}

/**
 * Get ABC for just the base pattern (one bar) with grand staff
 * @param {object} drill 
 * @param {string} key 
 * @param {string[]} scaleIntervals 
 * @param {number} octave 
 * @returns {string}
 */
export function patternToAbc(drill, key, scaleIntervals, octave = 4) {
  const useFlats = FLAT_KEYS.includes(key);
  const scaleOffsets = buildScaleOffsets(scaleIntervals);
  const pattern = drill.pattern || drill.notes;
  const duration = drill.duration || 8;
  const durationAbc = durationToAbc(duration);
  
  const abcKey = useFlats ? key.replace('#', '') : key.replace('b', '');
  let abc = `X:1\n`;
  abc += `T:${drill.name} - Pattern\n`;
  abc += `M:2/4\n`;
  abc += `L:1/8\n`;
  abc += `%%staves {RH LH}\n`;
  abc += `V:RH clef=treble name="R.H."\n`;
  abc += `V:LH clef=bass name="L.H."\n`;
  abc += `K:${abcKey}\n`;
  
  // Right hand - beam in groups of 4
  const beamGroup = 4;
  abc += `[V:RH] `;
  pattern.forEach((degree, i) => {
    const semitones = degreeToSemitones(degree, scaleOffsets);
    const midi = (octave + 1) * 12 + getNoteIndex(key) + semitones;
    const abcNote = midiToAbc(midi, useFlats);
    abc += abcNote + durationAbc;
    if ((i + 1) % beamGroup === 0 && i < pattern.length - 1) {
      abc += ' ';
    }
  });
  abc += '|]\n';
  
  // Left hand (one octave lower)
  const leftOctave = octave - 1;
  abc += `[V:LH] `;
  pattern.forEach((degree, i) => {
    const semitones = degreeToSemitones(degree, scaleOffsets);
    const midi = (leftOctave + 1) * 12 + getNoteIndex(key) + semitones;
    const abcNote = midiToAbc(midi, useFlats);
    abc += abcNote + durationAbc;
    if ((i + 1) % beamGroup === 0 && i < pattern.length - 1) {
      abc += ' ';
    }
  });
  abc += '|]';
  
  return abc;
}

export default {
  drills,
  categories,
  getDrillsByCategory,
  getDrillNotes,
  getDrillNotesForBothHands,
  getDrillPattern,
  getDrillBars,
  buildScaleOffsets,
  transposeDegree,
  formatNotesAsString,
  formatNoteNames,
  expandHanonStyle,
  expandChordProgression,
  getChordProgressionNotes,
  drillToAbc,
  chordProgressionToAbc,
  patternToAbc
};
