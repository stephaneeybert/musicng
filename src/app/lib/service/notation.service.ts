import { Injectable } from '@angular/core';
import { Chroma } from '../../model/note/pitch/chroma';
import { Octave } from '../../model/note/pitch/octave';
import { Subdivision } from '../../model/note/duration/subdivision';
import { Duration } from '../../model/note/duration/duration';
import { Note } from '../../model/note/note';
import { Pitch } from '../../model/note/pitch/pitch';
import { PlacedChord } from '../../model/note/placed-chord';
import { Measure } from '../../model/measure/measure';
import { TimeSignature } from '../../model/measure/time-signature';
import { TempoUnit } from '../../model/tempo-unit';
import { Subdivisions } from '@app/model/note/duration/subdivisions';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

const CHORD_SEPARATOR: string = ' ';
const CHORD_DURATION_SEPARATOR: string = '/';
const NOTE_SEPARATOR: string = '|';
const NOTE_REST: string = 'rest';
const NOTE_END_OF_TRACK: string = 'end';
const NOTE_END_OF_TRACK_OCTAVE: number = 0;
const NOTE_END_OF_TRACK_DURATION: number = 8;
const CHROMA_OCTAVE_PATTERN: RegExp = /[a-z#]+|[^a-z#]+/gi;

const DEFAULT_TEMPO_BPM_VALUE: number = 128;
const DEFAULT_TIME_SIGNATURE_NUMERATOR: number = 4;
const DEFAULT_TIME_SIGNATURE_DENOMINATOR: number = 4;

const VELOCITY_MIDI_MAX: number = 127;
const CHROMAS_ALPHABETICAL: Array<string> = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const CHROMAS_GERMAN_ALPHABETICAL: Array<string> = ['C', 'D', 'E', 'F', 'G', 'A', 'H'];
const CHROMAS_SYLLABIC: Map<string, string> = new Map([ ['rest', 'rest'], ['C', 'Do'], ['C#', '???'], ['D', 'Re.m'], ['D#', '???'], ['E', 'Mi.m'], ['F', 'Fa'], ['F#', '???'], ['G', 'Sol'], ['G#', '???'], ['A', 'La.m'], ['A#', '???'], ['B', 'Si-'] ]); // TODO Replace the ???
const OCTAVES: Array<number> = [ 1, 2, 3, 4, 5, 6 ];

@Injectable({
  providedIn: 'root'
})
export class NotationService {

  constructor(
  ) { }

  public parseMeasures(textMeasures: Array<string>, tempo: number, timeSignatureNumerator: number, timeSignatureDenominator: number): Array<Measure> {
    const measures: Array<Measure> = new Array<Measure>();
    let measureIndex: number = 0;
    for (const textMeasure of textMeasures) {
      const placedChords: Array<PlacedChord> = this.parseTextMeasure(textMeasure);
      const measure: Measure = this.createMeasure(measureIndex, tempo, timeSignatureNumerator, timeSignatureDenominator);
      measure.placedChords = placedChords;
      measureIndex++;
      measures.push(measure);
    }
    return measures;
  }

  public createMeasure(index: number, tempo: number, timeSignatureNumerator: number, timeSignatureDenominator: number): Measure {
    const timeSignature: TimeSignature = this.createTimeSignature(timeSignatureNumerator, timeSignatureDenominator);
    const measure: Measure = new Measure(index, this.createDuration(tempo, TempoUnit.BPM), timeSignature);
    return measure;
  }

  private parseTextMeasure(textMeasure: string): Array<PlacedChord> {
    let index: number = 0;
    return textMeasure.split(CHORD_SEPARATOR)
      .map((textChord: string) => {
        return this.parseTextChord(index, textChord);
        index++;
      });
  }

  private parseTextNote(index: number, textNote: string): Note {
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
      octave = 0;
    }
    const note: Note = this.createNote(index, chroma, octave);
    return note;
  }

  private parseTextNotes(textNotes: string): Array<Note> {
    let index: number = 0;
    return textNotes.split(NOTE_SEPARATOR)
      .map((textNote: string) => {
        return this.parseTextNote(index, textNote);
        index++;
      });
  }

  private parseTextChord(index: number, textChord: string): PlacedChord {
    const chordAndDuration: Array<string> = textChord.split(CHORD_DURATION_SEPARATOR);
    const chordNotes: string = chordAndDuration[0];
    const chordDuration: number = parseInt(chordAndDuration[1], 10);
    const notes: Array<Note> = this.parseTextNotes(chordNotes);
    const placedChord: PlacedChord = this.createPlacedChord(index, chordDuration, TempoUnit.DUPLE, notes);
    return placedChord;
  }

  private addNotes(placedChord: PlacedChord, notes: Array<Note>): void {
    notes.forEach((note: Note) => {
      placedChord.addNote(note);
    });
  }

  public chromasAlphabetical(): Array<string> {
    return CHROMAS_ALPHABETICAL;
  }

  public chromaLetterToChromaSyllabic(chroma: string): string {
    if (CHROMAS_SYLLABIC.has(chroma)) {
      const latinChroma: string | undefined = CHROMAS_SYLLABIC.get(chroma);
      if (latinChroma) {
        return latinChroma;
      } else {
        throw new Error('The alphabetical chromas array has not been instantiated.');
      }
    } else {
      throw new Error('No alphabetical chroma could be found for the chroma letter ' + chroma);
    }
  }

  public createPlacedChord(index: number, chordDuration: number, tempoUnit: TempoUnit, notes: Array<Note>): PlacedChord {
    const duration: Duration = this.createDuration(chordDuration, tempoUnit);
    const placedChord: PlacedChord = this.createEmptyChord(index, duration);
    this.addNotes(placedChord, notes);
    return placedChord;
  }

  public createNote(index: number, chroma: string, octave: number): Note {
    const pitch: Pitch = this.createPitch(this.createChroma(chroma), this.createOctave(octave));
    const note: Note = new Note(index, pitch);
    return note;
  }

  public velocityMidiToTonejs(midiVelocity: number): number {
    if (midiVelocity > VELOCITY_MIDI_MAX) {
      throw new Error('The MIDI velocity ' + midiVelocity + ' is greater than the maximum MIDI velocity ' + VELOCITY_MIDI_MAX);
    }
    return midiVelocity / VELOCITY_MIDI_MAX;
  }

  public velocityTonejsToMidi(tonejsVelocity: number): number {
    return tonejsVelocity * VELOCITY_MIDI_MAX;
  }

  public noteToChromaOctave(note: string): Array<string> {
    const chromaOctave: Array<string> | null = note.match(CHROMA_OCTAVE_PATTERN);
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

  public abcNoteIsNotRest(abcNote: string): boolean {
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

  public isOnlyEndOfTrackChords(placedChords: Array<PlacedChord>): boolean {
    let onlyEndOfTrackNotes: boolean = true;
    for (const placedChord of placedChords) {
      for (const note of placedChord.notes) {
        if (!this.isEndOfTrackNote(note)) {
          onlyEndOfTrackNotes = false;
          break;
        }
      }
      if (!onlyEndOfTrackNotes) {
        break;
      }
    }
    return onlyEndOfTrackNotes;
  }

  public addEndOfTrackNote(chords: Array<PlacedChord>): void {
    if (chords.length > 0) {
      // Have a few end of track notes as a note may not be played by an unreliable synth
      chords[chords.length] = this.createLastOfTrackPlacedChord(chords.length);
      chords[chords.length] = this.createLastOfTrackPlacedChord(chords.length);
      chords[chords.length] = this.createLastOfTrackPlacedChord(chords.length);
    }
  }

  public createLastOfTrackPlacedChord(index: number): PlacedChord {
    const endNote: Note = this.createNote(index, NOTE_END_OF_TRACK, NOTE_END_OF_TRACK_OCTAVE);
    return this.createPlacedChord(index, NOTE_END_OF_TRACK_DURATION, TempoUnit.DUPLE, [endNote]);
  }

  public buildEndOfTrackNote(): string {
    return NOTE_END_OF_TRACK + NOTE_END_OF_TRACK_OCTAVE + CHORD_DURATION_SEPARATOR + NOTE_END_OF_TRACK_DURATION;
  }

  public createDefaultTempo(): Duration {
    return this.createDuration(DEFAULT_TEMPO_BPM_VALUE, TempoUnit.BPM);
  }

  public createDefaultTimeSignature(): TimeSignature {
    return new TimeSignature(DEFAULT_TIME_SIGNATURE_NUMERATOR, DEFAULT_TIME_SIGNATURE_DENOMINATOR);
  }

  public isBpmTempoUnit(duration: Duration) {
    return duration && duration.unit === TempoUnit.BPM;
  }

  public buildNoteWithTicks(abc: string, octave: number, velocity: number): Note {
    const index: number = 0;
    const note: Note = this.createNote(index, abc, octave);
    note.velocity = velocity;
    return note;
  }

  private createChroma(value: string): Chroma {
    return new Chroma(value);
  }

  private createOctave(value: number): Octave {
    return new Octave(value);
  }

  private createSubdivision(duration: number): Subdivision {
    if (duration === Subdivisions.HUNDERD_TWENTY_EIGHTH) {
      return Subdivision.HUNDERD_TWENTY_EIGHTH;
    } else if (duration === (Subdivisions.HUNDERD_TWENTY_EIGHTH + Subdivisions.TWO_HUNDRED_FIFTY_SIXTH)) {
      return Subdivision.DOTTED_HUNDERD_TWENTY_EIGHTH;
    } else if (duration === Subdivisions.SIXTY_FOURTH) {
      return Subdivision.SIXTY_FOURTH;
    } else if (duration === (Subdivisions.SIXTY_FOURTH + Subdivisions.HUNDERD_TWENTY_EIGHTH)) {
      return Subdivision.DOTTED_SIXTY_FOURTH;
    } else if (duration === Subdivisions.THIRTY_SECONDTH) {
      return Subdivision.THIRTY_SECONDTH;
    } else if (duration === (Subdivisions.THIRTY_SECONDTH + Subdivisions.SIXTY_FOURTH)) {
      return Subdivision.DOTTED_THIRTY_SECOND;
    } else if (duration === Subdivisions.SIXTEENTH) {
      return Subdivision.SIXTEENTH;
    } else if (duration === (Subdivisions.SIXTEENTH + Subdivisions.THIRTY_SECONDTH)) {
      return Subdivision.DOTTED_SIXTEENTH;
    } else if (duration === Subdivisions.EIGHTH) {
      return Subdivision.EIGHTH;
    } else if (duration === (Subdivisions.EIGHTH + Subdivisions.SIXTEENTH)) {
      return Subdivision.DOTTED_EIGHTH;
    } else if (duration === Subdivisions.QUARTER) {
      return Subdivision.QUARTER;
    } else if (duration === (Subdivisions.QUARTER + Subdivisions.EIGHTH)) {
      return Subdivision.DOTTED_QUARTER;
    } else if (duration === Subdivisions.HALF) {
      return Subdivision.HALF;
    } else if (duration === (Subdivisions.HALF + Subdivisions.QUARTER)) {
      return Subdivision.DOTTED_HALF;
    } else if (duration === Subdivisions.WHOLE) {
      return Subdivision.WHOLE;
    } else if (duration === Subdivisions.NONE) {
      return Subdivision.NONE;
    } else {
      throw new Error('Unknown subdivision for duration: ' + duration);
    }
  }

  public createDuration(duration: number, tempoUnit: TempoUnit) {
    return new Duration(this.createSubdivision(duration), tempoUnit);
  }

  private createPitch(chroma: Chroma, octave: Octave): Pitch {
    return new Pitch(chroma, octave);
  }

  public createEmptyChord(index: number, duration: Duration): PlacedChord {
    const placedChod: PlacedChord = new PlacedChord(index, duration);
    return placedChod;
  }

  public createTimeSignature(numerator: number, denominator: number): TimeSignature {
    return new TimeSignature(numerator, denominator);
  }

}
