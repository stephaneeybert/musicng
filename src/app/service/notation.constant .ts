import { TempoUnit } from '@app/model/tempo-unit';
import { Subdivisions } from '@app/model/note/duration/subdivisions';
import { Subdivision } from '@app/model/note/duration/subdivision';

export enum RANDOM_METHOD {
  BONUS_TABLE = 1,
  HARMONY_BASE = 2
}

export const DEFAULT_VELOCITY_SOFTER: number = 1;
export const DEFAULT_VELOCITY_MEDIUM: number = 50;
export const DEFAULT_VELOCITY_LOUDER: number = 100;
export const DEFAULT_TIME_SIGNATURES: Array<number> = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const DEFAULT_TEMPO_BPM: number = 128;
export const DEFAULT_CHORD_WIDTH: number = 3;
export const DEFAULT_CHORD_DURATION: number = 4;
export const DEFAULT_NOTE_OCTAVE: number = 5;
export const DEFAULT_NB_CHORDS: number = 120;
export const DEFAULT_TIME_SIGNATURE_DENOMINATOR: number = 4;
export const DEFAULT_TIME_SIGNATURE_NUMERATOR: number = 4;
export const DEFAULT_RANDOM_METHOD: RANDOM_METHOD = RANDOM_METHOD.HARMONY_BASE;
export const DEFAULT_RANDOM_INPASSING: number = 50;
export const DEFAULT_RANDOM_MODULATION: number = 50;

export const CHORD_DURATION_UNITS: Map<TempoUnit, string> = new Map([
  [TempoUnit.DUPLE, 'n'],
  [TempoUnit.HERTZ, 'hz'],
  [TempoUnit.TICK, 't'],
  [TempoUnit.SECOND, 's'],
  [TempoUnit.DUPLE, 'n'],
  [TempoUnit.TRIPLET, 't'],
  [TempoUnit.MEASURE, 'm']
]);
export const GENERATE_METHODS: Map<RANDOM_METHOD, string> = new Map([
  [RANDOM_METHOD.BONUS_TABLE, '1. Bonus table'],
  [RANDOM_METHOD.HARMONY_BASE, '2. Harmony base']
]);

// An interval represents the distance between two notes
// The interval between two notes is a half-tone
// The # sign raises the note by a half-tone and the b lowers it by a half-tone
// There are 2 half-tones between the C and D notes and the C# sounds exactly like the Db note
// Do       Ré       Mi  Fa       Sol      La       Si
// C   C#   D   D#   E   F   F#   G   G#   A   A#   B
//     Db       Eb           Gb       Ab       Bb
export const HALF_TONE_INTERVAL_NOTES: Array<string> = [ 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B' ];

export const HALF_TONE: number = 0.5;

// A range is an ordered sequence of intervals, from a lower note to an higher note
export enum NOTE_RANGE {
  MAJOR = 0,
  MINOR_NATURAL = 1,
  MINOR_HARMONIC = 2,
  MINOR_MELODIC = 3,
  BLUES = 4
}
export const NOTE_RANGE_INTERVALS: Map<NOTE_RANGE, Array<number>> = new Map([
  [ NOTE_RANGE.MAJOR, [ 1, 1, 0.5, 1, 1, 1, 0.5 ] ],
  [ NOTE_RANGE.MINOR_NATURAL, [ 1, 0.5, 1, 1, 0.5, 1, 1 ] ],
  [ NOTE_RANGE.MINOR_HARMONIC, [ 1, 0.5, 1, 1, 0.5, 1.5, 0.5 ] ],
  [ NOTE_RANGE.MINOR_MELODIC, [ 1, 0.5, 1, 1, 1, 1, 0.5 ] ],
  [ NOTE_RANGE.BLUES, [ 1.5, 1, 0.5, 0.5, 1.5, 1 ] ]
]);

export const MIDI_FILE_SUFFIX: string = 'mid';

export const TEMPO_SUBDIVISIONS: Map<number, Subdivision> = new Map([
  [Subdivisions.HUNDERD_TWENTY_EIGHTH + Subdivisions.TWO_HUNDRED_FIFTY_SIXTH, Subdivision.DOTTED_HUNDERD_TWENTY_EIGHTH],
  [Subdivisions.HUNDERD_TWENTY_EIGHTH, Subdivision.HUNDERD_TWENTY_EIGHTH],
  [Subdivisions.SIXTY_FOURTH + Subdivisions.HUNDERD_TWENTY_EIGHTH, Subdivision.DOTTED_SIXTY_FOURTH],
  [Subdivisions.SIXTY_FOURTH, Subdivision.SIXTY_FOURTH],
  [Subdivisions.THIRTY_SECONDTH + Subdivisions.SIXTY_FOURTH, Subdivision.DOTTED_THIRTY_SECOND],
  [Subdivisions.THIRTY_SECONDTH, Subdivision.THIRTY_SECONDTH],
  [Subdivisions.SIXTEENTH + Subdivisions.THIRTY_SECONDTH, Subdivision.DOTTED_SIXTEENTH],
  [Subdivisions.SIXTEENTH, Subdivision.SIXTEENTH],
  [Subdivisions.EIGHTH + Subdivisions.SIXTEENTH, Subdivision.DOTTED_EIGHTH],
  [Subdivisions.EIGHTH, Subdivision.EIGHTH],
  [Subdivisions.QUARTER + Subdivisions.EIGHTH, Subdivision.DOTTED_QUARTER],
  [Subdivisions.QUARTER, Subdivision.QUARTER],
  [Subdivisions.HALF + Subdivisions.QUARTER, Subdivision.DOTTED_HALF],
  [Subdivisions.HALF, Subdivision.HALF],
  [Subdivisions.WHOLE, Subdivision.WHOLE],
  [Subdivisions.NONE, Subdivision.NONE]
]);
