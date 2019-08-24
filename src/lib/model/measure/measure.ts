import { TimeSignature } from 'lib/model';
import { Note } from 'lib/model';
import { Cursor } from 'lib/model';
import { PlacedNote } from 'lib/model';
import { Tempo } from 'lib/model';

export class Measure {

  tempo: Tempo;
  timeSignature: TimeSignature;
  placedNotes: Array<PlacedNote>;

  constructor(tempo: Tempo, timeSignature: TimeSignature) {
    this.tempo = tempo;
    this.timeSignature = timeSignature;
  }

  public hasNotes(): boolean {
    if (this.placedNotes != null && this.placedNotes.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  public withAddedNote(note: Note, cursor: Cursor): Measure { // TODO
    const measure = new Measure(
      new Tempo(this.tempo.value, this.tempo.unit),
      new TimeSignature(this.timeSignature.numerator, this.timeSignature.denominator));
    measure.placedNotes.push(new PlacedNote(note, cursor));
    measure.placedNotes = this.placedNotes.slice();
    return measure;
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
