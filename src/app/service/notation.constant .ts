import { TempoUnit } from '@app/model/tempo-unit';
import { Tonality } from '@app/model/note/tonality';

export const DEFAULT_VELOCITY_SOFT: number = 45;
export const DEFAULT_VELOCITY_MEDIUM: number = 50;
export const DEFAULT_VELOCITY_LOUD: number = 100;
export const DEFAULT_TIME_SIGNATURES: Array<number> = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const DEFAULT_TEMPO_BPM: number = 90;
export const DEFAULT_CHORD_WIDTH: number = 3;
export const DEFAULT_CHORD_DURATION: number = 4;
export const DEFAULT_NOTE_OCTAVE: number = 4;
export const DEFAULT_NB_CHORDS: number = 40;
export const NOTE_NEAR_MAX: number = 4;
export const DEFAULT_BONUS_MIN: number = 3;
export const DEFAULT_BONUS_RANDOM: number = 0;
export const DEFAULT_TIME_SIGNATURE_DENOMINATOR: number = 4;
export const DEFAULT_TIME_SIGNATURE_NUMERATOR: number = 4;
export const DEFAULT_RANDOM_INPASSING: number = 50;
export const DEFAULT_RANDOM_MODULATION: number = 100;

export const OCTAVE_SEPARATOR: string = '/';

export const NOTE_REST: string = 'rest';
export const NOTE_END_OF_TRACK: string = 'end';
export const META_CHROMAS: Array<string> = [NOTE_REST, NOTE_END_OF_TRACK];

export const CHORD_DURATION_UNITS: Map<TempoUnit, string> = new Map([
  [TempoUnit.NOTE, 'n'],
  [TempoUnit.HERTZ, 'hz'],
  [TempoUnit.TICK, 't'],
  [TempoUnit.SECOND, 's'],
  [TempoUnit.NOTE, 'n'],
  [TempoUnit.TRIPLET, 't'],
  [TempoUnit.MEASURE, 'm']
]);

export const CHORD_DURATION_DOTTED: string = '.';

// Tonality rules:

// Use all of the letter names in natural, sharp or flat, but only use each letter once.
// For example, even though Db major can be written Gb or F# with both having the same sound,
// the correct name is Gb (not F#) because the letter F has already been used.
// So use a sharp # except when that re-uses a chroma then use the enharmonic chroma with a flat.

// For major and minor scales there is never a mixture of sharps and flats in the same octave.
// D major = D E F# G A B C# (D) (no flat names used)
// Db major = Db Eb F Gb Ab Bb C (Db) (no sharp names used)

export const CHROMA_ENHARMONICS: Map<string, string> = new Map([
  ['C', 'B#'],
  ['C#', 'Db'],
  ['C##', 'D'],
  ['Eb', 'D#'],
  ['E', 'Fb'],
  ['F', 'E#'],
  ['Gb', 'F#'],
  ['G', 'F##'],
  ['Ab', 'G#'],
  ['A', 'G##'],
  ['Bb', 'A#'],
  ['B', 'Cb']
]);

// Do not start any major tonality with these chromas: G#, D#, A#, E#, B# and Fb
// They are illegal root chromas for major scales and thus cannot be used as starting chromas for major scales
// This is due to overly complex resulting note names, giving double sharps or double flats
// Instead use the following enharmonic keys respectively: Ab, Eb, Bb, F, C, E
export const CHROMAS_MAJOR: Array<string> = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
export const CHROMAS_MINOR: Array<string> = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
export const CHROMAS_ALPHABETICAL: Array<string> = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const CHORD_CHROMAS_SYLLABIC: Map<string, string> = new Map([
  ['B#', 'Si#'], ['C#', 'Do#'], ['C##', 'Ré'], ['D', 'Ré'], ['D#', 'Ré#'], ['E', 'Mi'], ['E#', 'Mi#'], ['F#', 'Fa#'], ['F##', 'Sol'], ['G', 'Sol'], ['G#', 'Sol#'], ['G##', 'La'], ['A', 'La'], ['A#', 'La#'], ['B', 'Si'],
  ['C', 'Do'], ['Db', 'Réb'], ['D', 'Ré'], ['E', 'Mi'], ['Eb', 'Mib'], ['Fb', 'Mi'], ['F', 'Fa'], ['Gb', 'Solb'], ['G', 'Sol'], ['Ab', 'Lab'], ['A', 'La'], ['Bb', 'Sib'], ['Cb', 'Si-']
]);
export const NOTE_CHROMAS_SYLLABIC: Map<string, string> = new Map([
  ['B#', 'si#'], ['C#', 'do#'], ['C##', 'ré'], ['D', 'ré'], ['D#', 'ré#'], ['E', 'mi'], ['E#', 'mi#'], ['F#', 'fa#'], ['F##', 'sol'], ['G', 'Sol'], ['G#', 'sol#'], ['G##', 'la'], ['A', 'La'], ['A#', 'la#'], ['B', 'si'],
  ['C', 'do'], ['Db', 'réb'], ['D', 'ré'], ['E', 'mi'], ['Eb', 'mib'], ['Fb', 'mi'], ['F', 'fa'], ['Gb', 'Solb'], ['G', 'sol'], ['Ab', 'Lab'], ['A', 'la'], ['Bb', 'Sib'], ['Cb', 'si-']
]);

// An interval represents the distance between two notes
// The interval between two notes is a half-tone
// The # sign raises the note by a half-tone and the b lowers it by a half-tone
// There are 2 half-tones between the C and D notes and the C# sounds exactly like the Db note
// Do       Ré       Mi  Fa       Sol      La       Si
// C   C#   D   D#   E   F   F#   G   G#   A   A#   B
//     Db       Eb           Gb       Ab       Bb   Cb

export enum TRACK_TYPES {
  MELODY = 'melody',
  HARMONY = 'harmony',
  DRUMS = 'drums',
  BASS = 'bass'
}

export const TRACK_INDEX_MELODY: number = 0;
export const TRACK_INDEX_HARMONY: number = 1;
export const TRACK_INDEX_DRUMS: number = 2;
export const TRACK_INDEX_BASS: number = 3;

// A range is an ordered sequence of intervals, from a lower note to an higher note
export enum NOTE_RANGE {
  MAJOR = 0,
  MINOR_NATURAL = 1,
  MINOR_HARMONIC = 2,
  MINOR_MELODIC = 3,
  BLUES = 4
}

export const NOTE_RANGE_INTERVALS: Map<NOTE_RANGE, Array<number>> = new Map([
  [NOTE_RANGE.MAJOR, [1, 1, 0.5, 1, 1, 1, 0.5]],
  [NOTE_RANGE.MINOR_NATURAL, [1, 0.5, 1, 1, 0.5, 1, 1]],
  [NOTE_RANGE.MINOR_HARMONIC, [1, 0.5, 1, 1, 0.5, 1.5, 0.5]],
  [NOTE_RANGE.MINOR_MELODIC, [1, 0.5, 1, 1, 1, 1, 0.5]],
  [NOTE_RANGE.BLUES, [1.5, 1, 0.5, 0.5, 1.5, 1]]
]);

export const NB_HALF_TONES_MAJOR: number = 4;
export const NB_HALF_TONES_MINOR: number = 3;
export const NB_HALF_TONES_DISSONANCE: number = 2;

export const NOTE_CHROMA_C: string = 'C';
export const NOTE_ACCIDENTAL_MINOR: string = 'm';
export const NOTE_ACCIDENTAL_DIMINISHED: string = '-';

export const DEFAULT_TONALITY_C_MAJOR: Tonality = new Tonality(NOTE_RANGE.MAJOR, NOTE_CHROMA_C);

export const MIDI_FILE_SUFFIX: string = 'mid';
