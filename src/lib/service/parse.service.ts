import { Injectable } from '@angular/core';
import { Chroma } from 'lib/model/note/pitch/chroma';
import { Octave } from 'lib/model/note/pitch/octave';
import { Clef } from 'lib/model/clef';
import { Cursor } from 'lib/model/note/cursor';
import { Subdivision } from 'lib/model/note/duration/subdivision';
import { Duration } from 'lib/model/note/duration/duration';
import { Note } from 'lib/model/note/note';
import { Pitch } from 'lib/model/note/pitch/pitch';
import { PlacedNote } from 'lib/model/note/placed-note';
import { Measure } from 'lib/model/measure/measure';
import { TimeSignature } from 'lib/model/measure/time-signature';
import { Tempo } from 'lib/model/tempo';
import { TempoUnit } from 'lib/model/tempo-unit';

const NOTE_SEPARATOR = ' ';
const NOTE_DURATION_SEPARATOR = '/';
const NOTE_REST = 'rest';

const DEFAULT_TEMPO_BPM_VALUE = '128';
const DEFAULT_TIME_SIGNATURE_NUMERATOR = 2;
const DEFAULT_TIME_SIGNATURE_DENOMINATOR = 4;

@Injectable({
  providedIn: 'root'
})
export class ParseService {

  constructor() { }

  public parseMeasuresDefaultTempo(textMeasures: Array<string>): Array<Measure> {
    return this.parseMeasures(textMeasures, DEFAULT_TEMPO_BPM_VALUE, DEFAULT_TIME_SIGNATURE_NUMERATOR, DEFAULT_TIME_SIGNATURE_DENOMINATOR);
  }

  public parseMeasures(
    textMeasures: Array<string>, tempo: string,
    timeSignatureNumerator: number, timeSignatureDenominator: number): Array<Measure> {
    const measures: Array<Measure> = new Array<Measure>();
    for (const textMeasure of textMeasures) {
      const placedNotes: Array<PlacedNote> = this.parseTextMeasure(textMeasure);
      const timeSignature: TimeSignature = this.timeSignature(timeSignatureNumerator, timeSignatureDenominator);
      const measure: Measure = new Measure(this.tempo(tempo), timeSignature);
      measure.placedNotes = placedNotes;
      measures.push(measure);
    }
    return measures;
  }

  private parseTextMeasure(textMeasure: string): Array<PlacedNote> {
    return textMeasure.split(NOTE_SEPARATOR)
      .filter(textNote => !!textNote)
      .map((textNote: string) => {
        return this.parseTextNote(textNote);
      });
  }

  private parseTextNote(textNote: string): PlacedNote {
    const chromaOctaveAndDuration: Array<string> = textNote.split(NOTE_DURATION_SEPARATOR);
    let chroma: Chroma = null;
    let octave: Octave = null;
    if (this.isNote(chromaOctaveAndDuration[0])) {
      const chromaAndOctave: Array<string> = this.noteToPitchOctave(chromaOctaveAndDuration[0]);
      chroma = this.toChroma(chromaAndOctave[0]);
      if (chromaAndOctave.length > 1) {
        octave = this.toOctave(parseInt(chromaAndOctave[1], 10));
      } else {
        throw new Error('Unspecified octave for the note: ' + chroma);
      }
    } else {
      chroma = this.toChroma(chromaOctaveAndDuration[0]);
    }
    const pitch: Pitch = this.pitch(chroma, octave);
    const duration: Duration = this.duration(chromaOctaveAndDuration[1], TempoUnit.MEASURE);
    const noteTransportTime = null;
    const note: Note = this.noteWithDuration(pitch, null, chromaOctaveAndDuration[1]);
    const cursor: Cursor = this.cursor(DEFAULT_TIME_SIGNATURE_NUMERATOR, DEFAULT_TIME_SIGNATURE_DENOMINATOR, noteTransportTime);
    const placedNote: PlacedNote = this.placedNote(note, cursor);
    return placedNote;
  }

  public noteToPitchOctave(note: string): Array<string> {
    return note.match(/[a-z#]+|[^a-z#]+/gi);
  }

  public isNote(abcNote: string): boolean {
    return !abcNote.includes(NOTE_REST);
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
    return this.noteWithDuration(
      this.pitch(this.toChroma(abc), this.toOctave(octave)),
      velocity,
      duration
    );
  }

  public buildNoteWithTicks(abc: string, octave: number, velocity: number, ticks: number): Note {
    return this.noteWithTicks(
      this.pitch(this.toChroma(abc), this.toOctave(octave)),
      velocity,
      ticks
    );
  }

  public placeNote(note: Note, noteTransportTime: Duration): PlacedNote {
    return this.placedNote(note, this.cursor(DEFAULT_TIME_SIGNATURE_NUMERATOR, DEFAULT_TIME_SIGNATURE_DENOMINATOR, noteTransportTime));
  }

  private toChroma(value: string): Chroma {
    return new Chroma(value);
  }

  private toOctave(value: number): Octave {
    return new Octave(value);
  }

  private toClef(value: string): Clef {
    return Clef[value];
  }

  private subdivision(duration: string): Subdivision {
    console.log('Get subdivision for duration: ' + duration);
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

  private cursor(measureNb: number, beatNb: number, duration: Duration): Cursor {
    return new Cursor(measureNb, beatNb, duration);
  }

  private pitch(chroma: Chroma, octave: Octave): Pitch {
    return new Pitch(chroma, octave);
  }

  private noteWithDuration(pitch: Pitch, velocity: number, duration: string): Note {
    const note: Note = new Note(pitch, velocity);
    note.duration = duration;
    return note;
  }

  private noteWithTicks(pitch: Pitch, velocity: number, ticks: number): Note {
    const note: Note = new Note(pitch, velocity);
    note.ticks = ticks;
    return note;
  }

  private placedNote(note: Note, cursor: Cursor): PlacedNote {
    return new PlacedNote(note, cursor);
  }

  public timeSignature(numerator: number, denominator: number): TimeSignature {
    return new TimeSignature(numerator, denominator);
  }

  public tempo(tempo: string): Tempo {
    return new Tempo(tempo, TempoUnit.BPM);
  }

}
