import { PlacedChord } from '@app/model/note/placed-chord';
import { Stave, Voice } from 'vexflow';
import { TimeSignature } from './time-signature';

export class Measure {

  index: number;
  // The tempo is the speed usually expressed as the number of beats in a minute
  tempo: number;
  timeSignature: TimeSignature;
  placedChords?: Array<PlacedChord>;
  sheetStave?: Stave;
  sheetVoice?: Voice;

  constructor(index: number, tempo: number, timeSignature: TimeSignature) {
    this.index = index;
    this.tempo = tempo;
    this.timeSignature = timeSignature;
  }

  public isFirst(): boolean {
    return this.index === 0;
  }

  public hasChords(): boolean {
    if (this.placedChords != null && this.placedChords.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  public getSortedChords(): Array<PlacedChord> {
    if (this.placedChords) {
      return this.placedChords.sort((chordA: PlacedChord, chordB: PlacedChord) => {
        return chordA.index - chordB.index;
      });
    } else {
      throw new Error('The measure contained no placed chords.');
    }
  }

  public getTempo(): number {
    return this.tempo;
  }

  public getNbBeats(): number {
    return this.timeSignature.numerator;
  }

  public getPlacedChordsNbBeats(): number {
    let totalNbBeats: number = 0;
    if (this.placedChords) {
      this.placedChords.forEach((placedChord: PlacedChord) => {
        // The beat value for a chord
        const placedChordNbBeats: number = (this.timeSignature.denominator / placedChord.getDuration());
        totalNbBeats += placedChordNbBeats;
      });
    }
    return totalNbBeats;
  }

  public createWithNewTimeSignature(index: number, numerator: number, denominator: number): Measure {
    return new Measure(index, this.tempo, new TimeSignature(numerator, denominator));
  }

  public createWithNewNumerator(index: number, numerator: number): Measure {
    return this.createWithNewTimeSignature(index, numerator, this.timeSignature.denominator);
  }

  public createWithNewDenominator(index: number, denominator: number): Measure {
    return this.createWithNewTimeSignature(index, this.timeSignature.numerator, denominator);
  }

}
