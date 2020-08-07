import { Subdivision } from './subdivision';
import { TempoUnitType } from '@app/model/tempo-unit';

export class Duration {

  subdivision: Subdivision;
  unit: TempoUnitType;

  constructor(subdivision: Subdivision, tempoUnit: TempoUnitType) {
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

  public renderUnit(): TempoUnitType {
    return this.unit;
  }

  public renderValueInUnit(): string {
    if (this.unit) {
      return this.renderValue() + this.unit;
    } else {
      return String(this.renderValue());
    }
  }

}
