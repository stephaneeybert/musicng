import { Note } from './note';
import { Cursor } from './cursor';

export class PlacedNote {

  note: Note;
  cursor: Cursor;

  constructor(note: Note, cursor: Cursor) {
    this.note = note;
    this.cursor = cursor;
  }

}
