import { TimeSignature } from './time-signature';
import { PlacedChord } from '../note/placed-chord';
import { Tempo } from '../tempo';

export class Measure {

  tempo: Tempo;
  timeSignature: TimeSignature;
  placedChords?: Array<PlacedChord>;

  constructor(tempo: Tempo, timeSignature: TimeSignature) {
    this.tempo = tempo;
    this.timeSignature = timeSignature;
    this.placedChords;
  }

  public hasChords(): boolean {
    if (this.placedChords != null && this.placedChords.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  public withNewTimeSignature(numerator: number, denominator: number): Measure { // TODO
    return new Measure(new Tempo(this.tempo.value, this.tempo.unit), new TimeSignature(numerator, denominator));
  }

  public changeNumerator(numerator: number): Measure { // TODO
    return this.withNewTimeSignature(numerator, this.timeSignature.denominator);
  }

  public changeDenominator(denominator: number): Measure { // TODO
    return this.withNewTimeSignature(this.timeSignature.numerator, denominator);
  }

}
