import { TempoUnit } from '@app/model/tempo-unit';
import { Subdivisions } from '@app/model/note/duration/subdivisions';
import { Subdivision } from '@app/model/note/duration/subdivision';

export enum RANDOM_METHOD {
  BASE = 0,
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
  [RANDOM_METHOD.BASE, '1. Base'],
  [RANDOM_METHOD.BONUS_TABLE, '2. Bonus table'],
  [RANDOM_METHOD.HARMONY_BASE, '3. Harmony base']
]);

export const C_TONALITY_CHROMAS: Array<string> = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

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
