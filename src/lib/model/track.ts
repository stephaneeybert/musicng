import { Control } from './control';
import { Instrument } from './instrument';
import { Measure } from 'lib/model/measure/measure';

export class Track {

  measures: Array<Measure>;
  name: string;
  channel: number;
  instrument: Instrument;
  controls: Array<Control>;

  constructor() {
    this.measures = new Array<Measure>();
  }

  public hasMeasures(): boolean {
    if (this.measures != null && this.measures.length > 0) {
      return true;
    } else {
      return false;
    }
  }

}
