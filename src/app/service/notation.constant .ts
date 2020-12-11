import { TempoUnit } from '@app/model/tempo-unit';
import { Tonality } from '@app/model/note/tonality';

export const DEFAULT_VELOCITY_SOFTER: number = 10;
export const DEFAULT_VELOCITY_MEDIUM: number = 50;
export const DEFAULT_VELOCITY_LOUDER: number = 100;
export const DEFAULT_TIME_SIGNATURES: Array<number> = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const DEFAULT_TEMPO_BPM: number = 60;
export const DEFAULT_CHORD_WIDTH: number = 3;
export const DEFAULT_CHORD_DURATION: number = 4;
export const DEFAULT_NOTE_OCTAVE: number = 5;
export const DEFAULT_NB_CHORDS: number = 60;
export const DEFAULT_TIME_SIGNATURE_DENOMINATOR: number = 4;
export const DEFAULT_TIME_SIGNATURE_NUMERATOR: number = 4;
export const DEFAULT_RANDOM_INPASSING: number = 50;
export const DEFAULT_RANDOM_MODULATION: number = 50;

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

// An interval represents the distance between two notes
// The interval between two notes is a half-tone
// The # sign raises the note by a half-tone and the b lowers it by a half-tone
// There are 2 half-tones between the C and D notes and the C# sounds exactly like the Db note
// Do       Ré       Mi  Fa       Sol      La       Si
// C   C#   D   D#   E   F   F#   G   G#   A   A#   B
//     Db       Eb           Gb       Ab       Bb   Cb
export const HALF_TONE: number = 0.5;

// export const HALF_TONE_CHROMAS: Array<string> = [ 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B' ];
export const HALF_TONE_SHARP_CHROMAS: Array<string> = [ 'B#', 'C#', 'C##', 'D#', 'E', 'E#', 'F#', 'F##', 'G#', 'G##', 'A#', 'B' ];
export const HALF_TONE_FLAT_CHROMAS: Array<string> = [ 'C', 'Db', 'D', 'Eb', 'Fb', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'Cb' ];
export const HALF_TONE_CHROMAS: Array<string> = HALF_TONE_SHARP_CHROMAS
.concat(HALF_TONE_FLAT_CHROMAS);
export const ALLOWED_CHROMAS: Array<string> = META_CHROMAS
.concat(HALF_TONE_CHROMAS);
export const CHORD_CHROMAS_SYLLABIC: Map<string, string> = new Map([
  ['rest', 'rest'],
  ['B#', 'Do'], ['C#', 'Do#'], ['C##', 'Rém'], ['D#', 'Ré#m'], ['E', 'Mim'], ['E#', 'Fa'], ['F#', 'Fa#'], ['F##', 'Sol'], ['G#', 'Sol#'], ['G##', 'Lam'], ['A#', 'La#m'], ['B', 'Si-'],
  ['C', 'Do'], ['Db', 'Dom'], ['D', 'Rém'], ['Eb', 'Ré#m'], ['Fb', 'Mim'], ['F', 'Fa'], ['Gb', 'Fa#'], ['G', 'Sol'], ['Ab', 'Sol#'], ['A', 'Lam'], ['Bb', 'La#m'], ['Cb', 'Si-']
]);
export const NOTE_CHROMAS_SYLLABIC: Map<string, string> = new Map([
  ['rest', 'rest'],
  ['B#', 'do'], ['C#', 'do#'], ['C##', 'ré'], ['D#', 'ré#'], ['E', 'mi'], ['E#', 'fa'], ['F#', 'fa#'], ['F##', 'sol'], ['G#', 'sol#'], ['G##', 'la'], ['A#', 'la#'], ['B', 'si'],
  ['C', 'Do'], ['Db', 'Dom'], ['D', 'Rém'], ['Eb', 'Ré#m'], ['Fb', 'Mim'], ['F', 'Fa'], ['Gb', 'Fa#'], ['G', 'Sol'], ['Ab', 'Sol#'], ['A', 'Lam'], ['Bb', 'La#m'], ['Cb', 'Si-']
]);

export enum TRACK_TYPES {
  MELODY = 'melody',
  HARMONY = 'harmony',
  DRUMS = 'drums',
  BASS = 'bass'
}

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

export const DEFAULT_TONALITY_C_MAJOR: Tonality = new Tonality(NOTE_RANGE.MAJOR, 'C');

export const MIDI_FILE_SUFFIX: string = 'mid';
