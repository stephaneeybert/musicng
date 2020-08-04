import { Control } from './control';
import { Instrument } from './instrument';
import { Measure } from './measure/measure';

export class Track {

  index: number;
  measures: Array<Measure>;
  name?: string;
  displayChordNames: boolean;
  playingComplete: boolean;
  channel?: number; // TODO Used ?
  instrument?: Instrument; // TODO Used ?
  controls?: Array<Control>; // TODO Used ?

  constructor(index: number) {
    this.index = index;
    this.measures = new Array<Measure>();
    this.displayChordNames = false;
    this.playingComplete = false;
  }

  public isFirst(): boolean {
    return this.index === 0;
  }

  public hasMeasures(): boolean {
    if (this.measures != null && this.measures.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  public getSortedMeasures(): Array<Measure> {
    if (this.hasMeasures()) {
      return this.measures.sort((measureA: Measure, measureB: Measure) => {
        return measureA.index - measureB.index;
      });
    } else {
      throw new Error('The track has no measures');
    }
  }

}
