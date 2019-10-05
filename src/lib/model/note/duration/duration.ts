import Tone from 'tone';
import { Subdivisions } from './subdivisions';
import { Subdivision } from './subdivision';
import { TempoUnit } from 'lib/model/tempo-unit';

export class Duration {

  subdivision: Subdivision;
  unit: TempoUnit;

  constructor(subdivision: Subdivision, tempoUnit: TempoUnit) {
    this.subdivision = subdivision;
    this.unit = tempoUnit;
  }

  private withUnit(value: number): string {
    return value + this.unit;
  }

  public toTime(): string {
      return this.subdivision.left
        + (this.subdivision.left === Subdivisions.NONE ? 0 : Tone.TimeBase(this.withUnit(this.subdivision.right)).valueOf());
  }

}
