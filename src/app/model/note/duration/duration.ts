import { Subdivision } from './subdivision';
import { TempoUnitType } from '@app/model/tempo-unit';
import { CHORD_DURATION_DOTTED } from '@app/service/notation.constant';

export class Duration {

  value: number;
  dotted: boolean;
  unit: TempoUnitType;

  constructor(value: number, tempoUnit: TempoUnitType) {
    this.value = value;
    this.unit = tempoUnit;
    this.dotted = false;
  }

  public renderValue(): number {
    return this.value;
  }

  public renderUnit(): TempoUnitType {
    return this.unit;
  }

  public renderValueInUnit(): string {
    let duration: string = String(this.renderValue());
    if (this.unit) {
      duration += this.unit;
    }
    // ToneJS considers a dotted note as having the dot after the unit '8n.'
    if (this.dotted) {
      duration += CHORD_DURATION_DOTTED;
    }
    return duration;
  }

}
