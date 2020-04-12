import { TimeSignature } from './time-signature';
import { PlacedChord } from '../note/placed-chord';
import { Duration } from '../note/duration/duration';

export class Measure {

  duration: Duration;
  timeSignature: TimeSignature;
  placedChords?: Array<PlacedChord>;

  constructor(duration: Duration, timeSignature: TimeSignature) {
    this.duration = duration;
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

  public getDuration(): number {
    return this.duration.calculate();
  }
  }

  public createWithNewTimeSignature(numerator: number, denominator: number): Measure {
    return new Measure(new Duration(this.duration.subdivision, this.duration.unit), new TimeSignature(numerator, denominator));
  }

  public createWithNewNumerator(numerator: number): Measure {
    return this.createWithNewTimeSignature(numerator, this.timeSignature.denominator);
  }

  public createWithNewDenominator(denominator: number): Measure {
    return this.createWithNewTimeSignature(this.timeSignature.numerator, denominator);
  }

}
