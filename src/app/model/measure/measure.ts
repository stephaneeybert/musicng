import { TimeSignature } from './time-signature';
import { PlacedChord } from '../note/placed-chord';
import { Duration } from '../note/duration/duration';

export class Measure {

  // The tempo is the speed usually expressed as the number of beats in a minute
  tempo: Duration;
  timeSignature: TimeSignature;
  placedChords?: Array<PlacedChord>;

  constructor(tempo: Duration, timeSignature: TimeSignature) {
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

  public getTempo(): number {
    return this.tempo.renderValue();
  }

  public getNbBeats(): number {
    return this.timeSignature.numerator;
  }

  public getPlacedChordsNbBeats(): number {
    let totalNbBeats: number = 0;
    if (this.placedChords) {
      for (const placedChord of this.placedChords) {
        // The beat value for a chord
        const placedChordNbBeats = (this.timeSignature.denominator / placedChord.getDuration());
        totalNbBeats += placedChordNbBeats;
      }
    }
    return totalNbBeats;
  }

  public createWithNewTimeSignature(numerator: number, denominator: number): Measure {
    return new Measure(new Duration(this.tempo.subdivision, this.tempo.unit), new TimeSignature(numerator, denominator));
  }

  public createWithNewNumerator(numerator: number): Measure {
    return this.createWithNewTimeSignature(numerator, this.timeSignature.denominator);
  }

  public createWithNewDenominator(denominator: number): Measure {
    return this.createWithNewTimeSignature(this.timeSignature.numerator, denominator);
  }

}
