import { Control } from './control';
import { Instrument } from './instrument';
import { Measure } from './measure/measure';

export class Track {

  index: number;
  measures: Array<Measure>;
  name?: string;
  channel?: number;
  instrument?: Instrument;
  controls?: Array<Control>;

  constructor(index: number) {
    this.index = index;
    this.measures = new Array<Measure>();
  }

  public hasMeasures(): boolean {
    if (this.measures != null && this.measures.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  public getSortedMeasures(): Array<Measure> {
    return this.measures.sort((measureA: Measure, measureB: Measure) => {
      return measureA.index - measureB.index;
    });
  }

}
