import { NOTE_RANGE } from '@app/service/notation.constant ';

export class Tonality {

  range: NOTE_RANGE;
  firstChroma: string;

  constructor(range: NOTE_RANGE, firstChroma: string) {
    this.range = range;
    this.firstChroma = firstChroma;
  }

}
