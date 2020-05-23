import { TempoUnit } from '@app/model/tempo-unit';
import { RANDOM_METHOD } from './generator.service';

export class NotationConstant {

  public static readonly TIME_SIGNATURES: Array<number> = [2, 4];
  public static readonly CHORD_DURATION_UNITS: Map<TempoUnit, string> = new Map([
    [TempoUnit.BPM, 'BPM'], [TempoUnit.TRIPLET, 'Triplet'], [TempoUnit.DUPLE, 'Duple'], [TempoUnit.MEASURE, 'Measure']
  ]);
  public static readonly GENERATE_METHODS: Map<RANDOM_METHOD, string> = new Map([
    [RANDOM_METHOD.BASE, 'Base'], [RANDOM_METHOD.BONUS_TABLE, 'Bonus table']
  ]);

}
