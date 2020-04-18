import { TimeSignature } from './time-signature';
import { PlacedChord } from '../note/placed-chord';
import { Duration } from '../note/duration/duration';

export class Measure {

  index: number;
  // The tempo is the speed usually expressed as the number of beats in a minute
  tempo: Duration;
  timeSignature: TimeSignature;
  placedChords: Array<PlacedChord>;
  sheetStaveGroup?: any;
  sheetVoiceGroup?: any;

  constructor(index: number, tempo: Duration, timeSignature: TimeSignature) {
    this.index = index;
    this.tempo = tempo;
    this.timeSignature = timeSignature;
    this.placedChords = new Array(); // TODO Pass in the chords
  }

  public hasChords(): boolean {
    if (this.placedChords != null && this.placedChords.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  public getSortedChords(): Array<PlacedChord> {
    return this.placedChords.sort((chordA: PlacedChord, chordB: PlacedChord) => {
      return chordA.index - chordB.index;
    });
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

  public createWithNewTimeSignature(index: number, numerator: number, denominator: number): Measure {
    return new Measure(index, new Duration(this.tempo.subdivision, this.tempo.unit), new TimeSignature(numerator, denominator));
  }

  public createWithNewNumerator(index: number, numerator: number): Measure {
    return this.createWithNewTimeSignature(index, numerator, this.timeSignature.denominator);
  }

  public createWithNewDenominator(index: number, denominator: number): Measure {
    return this.createWithNewTimeSignature(index, this.timeSignature.numerator, denominator);
  }

}
