import { Note } from 'lib/model';
import { Cursor } from 'lib/model';

export class PlacedNote {

  note: Note;
  cursor: Cursor;

  constructor(note: Note, cursor: Cursor) {
    this.note = note;
    this.cursor = cursor;
  }

}
