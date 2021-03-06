import * as vexflow from 'vexflow';
import { Note } from './note';
import { Duration } from './duration/duration';
import { TempoUnitType } from '../tempo-unit';
import { Tonality } from './tonality';

export class PlacedChord {

  index: number;
  notes: Array<Note>;
  duration: Duration;
  velocity: number;
  tonality: Tonality;
  dottedAll: boolean; // TODO Use it in the synth ?
  staveNote?: vexflow.Flow.StaveNote;

  constructor(index: number, duration: Duration, velocity: number, tonality: Tonality) {
    this.index = index;
    this.notes = new Array<Note>();
    this.duration = duration;
    this.velocity = velocity;
    this.tonality = tonality;
    this.dottedAll = false;
  }

  public addNote(note: Note): void {
    if (note) {
      this.notes.push(note);
    }
  }

  public isFirst(): boolean {
    return this.index === 0;
  }

  public hasNotes(): boolean {
    if (this.notes != null && this.notes.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  public getNotesSortedByIndex(): Array<Note> {
    return this.notes.sort((noteA: Note, noteB: Note) => {
      return noteA.index - noteB.index;
    });
  }

  public getSortedNotesChromas(): Array<string> {
    return this.getNotesSortedByIndex()
    .map((note: Note) => {
      return note.renderChroma();
    });
  }

  public renderIntlChromaOctave(): Array<string> {
    const sortedNotes: Array<string> = this.getNotesSortedByIndex()
    .map((note: Note) => {
      return note.renderIntlChromaOctave();
    });
    return sortedNotes;
  }

  public getDuration(): number {
    return this.duration.renderValue();
  }

  public getUnit(): TempoUnitType {
    return this.duration.renderUnit();
  }

  public renderDuration(): string {
    return this.duration.renderValueInUnit();
  }
}
