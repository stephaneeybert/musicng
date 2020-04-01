import { Injectable } from '@angular/core';
import { Chroma } from '../../model/note/pitch/chroma';
import { Octave } from '../../model/note/pitch/octave';
import { Cursor } from '../../model/note/cursor';
import { Subdivision } from '../../model/note/duration/subdivision';
import { Duration } from '../../model/note/duration/duration';
import { Note } from '../../model/note/note';
import { Pitch } from '../../model/note/pitch/pitch';
import { PlacedChord } from '../../model/note/placed-chord';
import { Measure } from '../../model/measure/measure';
import { TimeSignature } from '../../model/measure/time-signature';
import { Tempo } from '../../model/tempo';
import { TempoUnit } from '../../model/tempo-unit';

const CHORD_SEPARATOR = ' ';
const CHORD_DURATION_SEPARATOR = '/';
const NOTE_SEPARATOR = '|';
const NOTE_REST = 'rest';
const NOTE_END_OF_TRACK: string = 'rest';
const NOTE_END_OF_TRACK_OCTAVE: number = 9;
const NOTE_END_OF_TRACK_DURATION: string = '4';

const DEFAULT_TEMPO_BPM_VALUE = '128';
const DEFAULT_TIME_SIGNATURE_NUMERATOR = 2;
const DEFAULT_TIME_SIGNATURE_DENOMINATOR = 4;

@Injectable({
  providedIn: 'root'
})
export class ParseService {

  constructor() { }

  public parseMeasures(textMeasures: Array<string>): Array<Measure> {
    const measures: Array<Measure> = new Array<Measure>();
    for (const textMeasure of textMeasures) {
      const placedChords: Array<PlacedChord> = this.parseTextMeasure(textMeasure);
      const measure: Measure = this.createMeasureWithDefaultTempo();
      measure.placedChords = placedChords;
      measures.push(measure);
    }
    return measures;
  }

  public createMeasureWithDefaultTempo(): Measure {
    return this.createMeasure(DEFAULT_TEMPO_BPM_VALUE, DEFAULT_TIME_SIGNATURE_NUMERATOR, DEFAULT_TIME_SIGNATURE_DENOMINATOR);
  }

  private createMeasure(tempo: string, timeSignatureNumerator: number, timeSignatureDenominator: number): Measure {
    const timeSignature: TimeSignature = this.timeSignature(timeSignatureNumerator, timeSignatureDenominator);
    const measure: Measure = new Measure(this.tempo(tempo, TempoUnit.BPM), timeSignature);
    return measure;
  }

  private parseTextMeasure(textMeasure: string): Array<PlacedChord> {
    return textMeasure.split(CHORD_SEPARATOR)
      .filter(textChord => !!textChord)
      .map((textChord: string) => {
        return this.parseTextChord(textChord);
      });
  }

  private parseTextNote(textNote: string): Note {
    let chroma: string;
    let octave: number;
    if (this.abcNoteIsNotRest(textNote)) {
      const chromaAndOctave: Array<string> = this.noteToChromaOctave(textNote);
      chroma = chromaAndOctave[0];
      if (chromaAndOctave.length > 1) {
        octave = parseInt(chromaAndOctave[1], 10);
      } else {
        throw new Error('Unspecified octave for the note: ' + textNote + ' with chroma: ' + chroma);
      }
    } else {
      chroma = textNote;
      octave = 0; // TODO What is the octave of a rest note ?
    }
    const note: Note = this.createNote(chroma, octave);
    return note;
  }

  private parseTextNotes(textNotes: string): Array<Note> {
    return textNotes.split(NOTE_SEPARATOR)
      .filter(textNote => !!textNote)
      .map((textNote: string) => {
        return this.parseTextNote(textNote);
      });
  }

  private parseTextChord(textChord: string): PlacedChord {
    const chordAndDuration: Array<string> = textChord.split(CHORD_DURATION_SEPARATOR);
    const chordNotes: string = chordAndDuration[0];
    const chordDuration: string = chordAndDuration[1];
    const notes: Array<Note> = this.parseTextNotes(chordNotes);
    const placedChord: PlacedChord = this.createPlacedChord(chordDuration, notes);
    return placedChord;
  }

  private addNotes(placedChord: PlacedChord, notes: Array<Note>): void {
    notes.forEach((note: Note) => {
      placedChord.addNote(note);
    });
  }

  public createPlacedChord(chordDuration: string, notes: Array<Note>): PlacedChord {
    const duration: Duration = this.duration(chordDuration, TempoUnit.DUPLE);
    const cursor: Cursor = new Cursor(duration);
    const placedChord: PlacedChord = this.createEmptyChord(cursor);
    this.addNotes(placedChord, notes);
    return placedChord;
  }

  public createNote(chroma: string, octave: number): Note {
    const pitch: Pitch = this.pitch(this.toChroma(chroma), this.toOctave(octave));
    const note: Note = new Note(pitch);
    return note;
  }

  public noteToChromaOctave(note: string): Array<string> {
    const chromaOctave: Array<string> | null = note.match(/[a-z#]+|[^a-z#]+/gi);
    if (chromaOctave != null) {
      return chromaOctave;
    } else {
      return [];
    }
  }

  public placedChordIsNotRest(placedChord: PlacedChord): boolean {
    if (placedChord.hasNotes()) {
      return this.noteIsNotRest(placedChord.notes[0]);
    } else {
      return false;
    }
  }

  public noteIsNotRest(note: Note): boolean {
    return this.abcNoteIsNotRest(note.render());
  }

  private abcNoteIsNotRest(abcNote: string): boolean {
    return !abcNote.includes(NOTE_REST);
  }

  public isEndOfTrackPlacedChord(placedChord: PlacedChord): boolean {
    if (placedChord.hasNotes()) {
      return this.isEndOfTrackNote(placedChord.notes[0]);
    } else {
      return false;
    }
  }

  public isEndOfTrackNote(note: Note): boolean {
    return this.isEndOfTrackAbcNote(note.render());
  }

  private isEndOfTrackAbcNote(abcNote: string): boolean {
    return abcNote.includes(NOTE_END_OF_TRACK) && abcNote.includes(String(NOTE_END_OF_TRACK_OCTAVE));
  }

  public createLastInTrackPlacedChord(): PlacedChord {
    const endNote: Note = this.createNote(NOTE_REST, NOTE_END_OF_TRACK_OCTAVE);
    return this.createPlacedChord(NOTE_END_OF_TRACK_DURATION, [ endNote ]);
  }

  public buildDefaultTempo(): Tempo {
    return new Tempo(DEFAULT_TEMPO_BPM_VALUE, TempoUnit.BPM);
  }

  public buildDefaultTimeSignature(): TimeSignature {
    return new TimeSignature(DEFAULT_TIME_SIGNATURE_NUMERATOR, DEFAULT_TIME_SIGNATURE_DENOMINATOR);
  }

  public isBpmTempoUnit(tempo: Tempo) {
    return tempo && tempo.unit === TempoUnit.BPM;
  }

  public buildNoteWithDuration(abc: string, octave: number, velocity: number, duration: string): Note {
    return new Note(this.pitch(this.toChroma(abc), this.toOctave(octave)), velocity);
  }

  public buildNoteWithTicks(abc: string, octave: number, velocity: number, ticks: number): Note {
    return new Note(this.pitch(this.toChroma(abc), this.toOctave(octave)), velocity);
  }

  public placeEmptyChord(noteDuration: Duration): PlacedChord {
    return this.createEmptyChord(new Cursor(noteDuration));
  }

  private toChroma(value: string): Chroma {
    return new Chroma(value);
  }

  private toOctave(value: number): Octave {
    return new Octave(value);
  }

  // TODO See https://music.stackexchange.com/questions/96150/how-to-express-a-duration-in-bpm-into-a-duration-in-division-subdivision
  private subdivision(duration: string): Subdivision {
    const intValue: number = parseInt(duration, 10);
    if (intValue === Subdivision.EIGHTH.left) { // TODO Add more if cases
      return Subdivision.EIGHTH;
    } else if (intValue === Subdivision.QUARTER.left) {
      return Subdivision.QUARTER;
    } else if (intValue === Subdivision.SIXTEENTH.left) {
      return Subdivision.SIXTEENTH;
    } else if (intValue === Subdivision.HALF.left) {
      return Subdivision.HALF;
    } else if (intValue === Subdivision.THIRTY_SECOND.left) {
      return Subdivision.THIRTY_SECOND;
    } else {
      throw new Error('Unknown subdivision for duration: ' + duration);
    }
  }

  private duration(duration: string, tempoUnit: TempoUnit) {
    return new Duration(this.subdivision(duration), tempoUnit);
  }

  private pitch(chroma: Chroma, octave: Octave): Pitch {
    return new Pitch(chroma, octave);
  }

  private createEmptyChord(cursor: Cursor): PlacedChord {
    const placedChod: PlacedChord = new PlacedChord(cursor);
    return placedChod;
  }

  public timeSignature(numerator: number, denominator: number): TimeSignature {
    return new TimeSignature(numerator, denominator);
  }

  public tempo(tempo: string, unit: string): Tempo {
    return new Tempo(tempo, unit);
  }

}
