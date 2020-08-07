import * as vexflow from 'vexflow';
import { Note } from './note';
import { Duration } from './duration/duration';
import { TempoUnitType } from '../tempo-unit';

export class PlacedChord {

  index: number;
  notes: Array<Note>;
  duration: Duration;
  velocity: number;
  dottedAll: boolean;
  staveNote?: vexflow.Flow.StaveNote;

  constructor(index: number, duration: Duration, velocity: number) {
    this.index = index;
    this.notes = new Array<Note>();
    this.duration = duration;
    this.velocity = velocity;
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

  public getSortedNotes(): Array<Note> {
    return this.notes.sort((noteA: Note, noteB: Note) => {
      return noteA.index - noteB.index;
    });
  }

  public renderFirstNoteChroma(): string {
    let abc: string = '';
    if (this.notes != null && this.notes.length > 0) {
      const sortedNotes: Array<Note> = this.getSortedNotes();
      abc = sortedNotes[0].renderChroma();
    }
    return abc;
  }

  public getNotesChromas(): Array<string> {
    return this.getSortedNotes()
    .map((note: Note) => {
      return note.renderChroma();
    });
  }

  public renderAbc(): Array<string> {
    const sortedNotes: Array<string> = this.getSortedNotes()
    .map((note: Note) => {
      return note.renderAbc();
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
