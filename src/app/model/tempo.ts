import { TempoUnit } from './tempo-unit';

export class Tempo {

  value: string;
  unit: TempoUnit;

  constructor(value: string, unit: TempoUnit) {
    this.value = value;
    this.unit = unit;
  }

}
