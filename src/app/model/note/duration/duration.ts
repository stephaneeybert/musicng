import { Subdivision } from './subdivision';
import { TempoUnit } from '@app/model/tempo-unit';

export class Duration {

  subdivision: Subdivision;
  unit: TempoUnit;

  constructor(subdivision: Subdivision, tempoUnit: TempoUnit) {
    this.subdivision = subdivision;
    this.unit = tempoUnit;
  }

  public renderValue(): number {
    if (this.subdivision.left > 0) {
      return (this.subdivision.left + this.subdivision.right);
    } else {
      throw new Error('The subdivision left value was not defined.');
    }
  }

  public renderValueInUnit(): string {
    return this.renderValue() + this.unit;
  }

}
