import { TempoUnit } from '@app/model/tempo-unit';

export enum RANDOM_METHOD {
  BASE = 0,
  BONUS_TABLE = 1
}

export class NotationConstant {

  public static readonly TIME_SIGNATURES: Array<number> = [2, 4];
  public static readonly CHORD_DURATION_UNITS: Map<TempoUnit, string> = new Map([
    [TempoUnit.BPM, 'BPM'], [TempoUnit.TRIPLET, 'Triplet'], [TempoUnit.DUPLE, 'Duple'], [TempoUnit.MEASURE, 'Measure']
  ]);
  public static readonly GENERATE_METHODS: Map<RANDOM_METHOD, string> = new Map([
    [RANDOM_METHOD.BASE, 'Base'], [RANDOM_METHOD.BONUS_TABLE, 'Bonus table']
  ]);

  public static readonly DEFAUT_TEMPO_BPM: number = 128;
  public static readonly DEFAUT_CHORD_WIDTH: number = 3;
  public static readonly DEFAUT_CHORD_DURATION: number = 4;
  public static readonly DEFAUT_NOTE_OCTAVE: number = 5;
  public static readonly DEFAUT_NB_CHORDS: number = 120;
  public static readonly DEFAUT_TIME_SIGNATURE_DENOMINATOR: number = 4;
  public static readonly DEFAUT_TIME_SIGNATURE_NUMERATOR: number = 4;
  public static readonly DEFAUT_RANDOM_METHOD: RANDOM_METHOD = RANDOM_METHOD.BONUS_TABLE;
}
