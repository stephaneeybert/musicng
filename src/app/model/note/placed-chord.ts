// import * as vexflow from 'vexflow';
import { Note } from './note';
import { Cursor } from './cursor';

export class PlacedChord {

  notes: Array<Note>;
  cursor: Cursor;
  // TODO This causes an error
  // https://stackoverflow.com/q/60805037/958373
  staveNote: any;
  // staveNote: vexflow.Flow.StaveNote;
  dottedAll: boolean;

  constructor(cursor: Cursor) {
    this.notes =  new Array<Note>();
    this.cursor = cursor;
    this.dottedAll = false;
  }

  public addNote(note: Note): void {
    if (note) {
      this.notes.push(note);
    }
  }

  public hasNotes(): boolean {
    if (this.notes != null && this.notes.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  public renderFirstNote(): string {
    let abc: string = '';
    if (this.notes.length > 0) {
      const sortedNotes: Array<Note> = this.notes.sort((a, b) => a.index - b.index);
      abc = sortedNotes[0].renderAbc();
    }
    return abc;
  }

  public renderAbc(): string {
    let abc: string = '';
    const sortedNotes: Array<Note> = this.notes.sort((a, b) => a.index - b.index);
    for (const note of sortedNotes) {
      if (abc) {
        abc += ' ';
      }
      abc += note.renderAbc();
    }
    return abc;
  }

  public renderDuration(): string {
    return this.cursor.render();
  }
}
