import { Subdivision } from './subdivision';
import { TempoUnit } from '../../tempo-unit';

export class Duration {

  subdivision: Subdivision;
  unit: TempoUnit;

  constructor(subdivision: Subdivision, tempoUnit: TempoUnit) {
    this.subdivision = subdivision;
    this.unit = tempoUnit;
  }

  public renderValue(): number {
    return (this.subdivision.left + this.subdivision.right);
  }

  public renderValueWithUnit(): string {
    return this.renderValue() + this.unit;
  }

}
