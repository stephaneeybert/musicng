import { Injectable } from '@angular/core';
import * as Tone from 'tone';
import { Chroma } from '@app/model/note/pitch/chroma';
import { Octave } from '@app/model/note/pitch/octave';
import { Duration } from '@app/model/note/duration/duration';
import { Note, NOTE_FLAT, NOTE_SHARP } from '@app/model/note/note';
import { Pitch } from '@app/model/note/pitch/pitch';
import { PlacedChord } from '@app/model/note/placed-chord';
import { Measure } from '@app/model/measure/measure';
import { TimeSignature } from '@app/model/measure/time-signature';
import { TempoUnit, TempoUnitType } from '@app/model/tempo-unit';
import { DEFAULT_TONALITY_C_MAJOR, NOTE_END_OF_TRACK, NOTE_REST, NOTE_CHROMAS_SYLLABIC, CHORD_CHROMAS_SYLLABIC, HALF_TONE_SHARP_CHROMAS, HALF_TONE_FLAT_CHROMAS, HALF_TONE_MAJOR_CHROMAS, HALF_TONE_MINOR_CHROMAS, CHROMA_ENHARMONICS, META_CHROMAS, HALF_TONE_CHROMAS, NOTE_RANGE, NOTE_ACCIDENTAL_MINOR } from './notation.constant ';
import { Tonality } from '@app/model/note/tonality';

const CHORD_SEPARATOR: string = ' ';
const CHORD_DURATION_SEPARATOR: string = '/';
const NOTE_SEPARATOR: string = '|';
const NOTE_END_OF_TRACK_OCTAVE: number = 0;
const NOTE_END_OF_TRACK_DURATION: number = 8;
const NOTE_END_OF_TRACK_VELOCITY: number = 0;
const CHROMA_OCTAVE_PATTERN: RegExp = /[a-z#]+|[^a-z#]+/gi;

const DEFAULT_CHORD_DURATION: number = 4;
const DEFAULT_TIME_SIGNATURE_NUMERATOR: number = 4;
const DEFAULT_TIME_SIGNATURE_DENOMINATOR: number = 4;

@Injectable({
  providedIn: 'root'
})
export class NotationService {

  public parseMeasures(textMeasures: Array<string>, tempo: number, timeSignatureNumerator: number, timeSignatureDenominator: number, velocity: number): Array<Measure> {
    const measures: Array<Measure> = new Array<Measure>();
    let measureIndex: number = 0;
    textMeasures.forEach((textMeasure: string) => {
      const placedChords: Array<PlacedChord> = this.parseTextMeasure(textMeasure, velocity);
      const measure: Measure = this.createMeasure(measureIndex, tempo, timeSignatureNumerator, timeSignatureDenominator);
      measure.placedChords = placedChords;
      measureIndex++;
      measures.push(measure);
    });
    return measures;
  }

  public createMeasure(index: number, tempoInBpm: number, timeSignatureNumerator: number, timeSignatureDenominator: number): Measure {
    const timeSignature: TimeSignature = this.createTimeSignature(timeSignatureNumerator, timeSignatureDenominator);
    const measure: Measure = new Measure(index, tempoInBpm, timeSignature);
    return measure;
  }

  private parseTextMeasure(textMeasure: string, velocity: number): Array<PlacedChord> {
    let index: number = 0;
    return textMeasure.split(CHORD_SEPARATOR)
      .map((textChord: string) => {
        const placedChord: PlacedChord = this.parseTextChord(index, textChord, velocity);
        index++;
        return placedChord;
      });
  }

  private parseTextNote(index: number, textNote: string): Note {
    let note: Note;
    let chroma: string;
    let octave: number;
    if (this.abcNoteIsNotRest(textNote)) {
      [chroma, octave] = this.noteToChromaOctave(textNote);
      note = this.createNote(index, chroma, octave);
    } else {
      chroma = textNote;
      octave = 0;
      note = this.createNote(index, chroma, octave);
    }
    return note;
  }

  private parseTextNotes(textNotes: string): Array<Note> {
    let index: number = 0;
    return textNotes.split(NOTE_SEPARATOR)
      .map((textNote: string) => {
        const note: Note = this.parseTextNote(index, textNote);
        index++;
        return note;
      });
  }

  private parseTextChord(index: number, textChord: string, velocity: number): PlacedChord {
    const chordAndDuration: Array<string> = textChord.split(CHORD_DURATION_SEPARATOR);
    const chordNotes: string = chordAndDuration[0];
    const chordDuration: number = Number(chordAndDuration[1]);
    const notes: Array<Note> = this.parseTextNotes(chordNotes);
    const placedChord: PlacedChord = this.createPlacedChord(index, chordDuration, TempoUnit.NOTE, velocity, DEFAULT_TONALITY_C_MAJOR, notes);
    return placedChord;
  }

  private addNotes(placedChord: PlacedChord, notes: Array<Note>): void {
    notes.forEach((note: Note) => {
      placedChord.addNote(note);
    });
  }

  private isRangeMinor(noteRange: NOTE_RANGE): boolean {
    if (noteRange == NOTE_RANGE.MINOR_NATURAL || noteRange == NOTE_RANGE.MINOR_HARMONIC || noteRange == NOTE_RANGE.MINOR_MELODIC) {
      return true;
    } else {
      return false;
    }
  }

  public removeSharpsAndFlats(chroma: string): string {
    return chroma.replace(NOTE_SHARP, '').replace(NOTE_FLAT, '');
  }

  private getNoteFrequency(note: Note): number {
    // The accidental must not be present in the note when getting the frequency
    const chroma: string = this.removeSharpsAndFlats(note.renderIntlChromaOctave());
    return Tone.Frequency(chroma).toFrequency();
  }

  public sortNotesByPitch(notes: Array<Note>): Array<Note> {
    return notes.sort((noteA: Note, noteB: Note) => {
      return this.getNoteFrequency(noteA) - this.getNoteFrequency(noteB);
    });
  }

  public getFirstNoteSortedByPitch(placedChord: PlacedChord): Note {
    const sortedNotes: Array<Note> = this.sortNotesByPitch(placedChord.notes);
    if (!sortedNotes || sortedNotes.length == 0) {
      throw new Error('The placed chord had no notes to sort by pitch.');
    }
    const lastIsLowest: number = sortedNotes.length - 1;
    return sortedNotes[lastIsLowest];
  }

  public tonalityFirstChromaLetterToChromaSyllabic(placedChord: PlacedChord): string {
    let chroma: string = this.chromaLetterToChromaSyllabic(CHORD_CHROMAS_SYLLABIC, placedChord.tonality.firstChroma);
    if (this.isRangeMinor(placedChord.tonality.range)) {
      chroma += NOTE_ACCIDENTAL_MINOR;
    }
    return chroma;
  }

  public chordChromaLetterToChromaSyllabic(chroma: string): string {
    return this.chromaLetterToChromaSyllabic(CHORD_CHROMAS_SYLLABIC, chroma);
  }

  public noteChromaLetterToChromaSyllabic(chroma: string): string {
    return this.chromaLetterToChromaSyllabic(NOTE_CHROMAS_SYLLABIC, chroma);
  }

  private chromaLetterToChromaSyllabic(chromasSyllabic: Map<string, string>, chroma: string): string {
    if (chromasSyllabic.has(chroma)) {
      const syllabic: string | undefined = chromasSyllabic.get(chroma);
      if (syllabic) {
        return syllabic;
      } else {
        throw new Error('The chroma letter ' + chroma + ' could not be retrieved in the chromas syllabic ' + chromasSyllabic.keys.toString());
      }
    } else {
      throw new Error('The chroma letter ' + chroma + ' could not be found in the chromas syllabic ' + chromasSyllabic.keys.toString());
    }
  }

  // public selectHalfToneChromasFromFirstChroma(chroma: string): Array<string> {
  //   if (HALF_TONE_SHARP_CHROMAS.includes(chroma)) {
  //     return HALF_TONE_SHARP_CHROMAS;
  //   } else if (HALF_TONE_FLAT_CHROMAS.includes(chroma)) {
  //     return HALF_TONE_FLAT_CHROMAS;
  //   } else {
  //     throw new Error('No chromas array was found containing the chroma ' + chroma);
  //   }
  // } TODO
  public selectHalfToneChromasFromFirstChroma(chroma: string): Array<string> {
    if (HALF_TONE_MAJOR_CHROMAS.includes(chroma)) {
      return HALF_TONE_MAJOR_CHROMAS;
    } else if (HALF_TONE_MINOR_CHROMAS.includes(chroma)) {
      return HALF_TONE_MINOR_CHROMAS;
    } else {
      throw new Error('No chromas array was found containing the chroma ' + chroma);
    }
  }

  public createPlacedChord(index: number, chordDuration: number, tempoUnit: TempoUnitType, velocity: number, tonality: Tonality, notes: Array<Note>): PlacedChord {
    const duration: Duration = this.createDuration(chordDuration, tempoUnit);
    const placedChord: PlacedChord = this.createEmptyChord(index, duration, velocity, tonality);
    this.addNotes(placedChord, notes);
    return placedChord;
  }

  public createNote(index: number, chroma: string, octave: number): Note {
    const pitch: Pitch = this.createPitch(this.createChroma(chroma), this.createOctave(octave));
    const note: Note = new Note(index, pitch);
    return note;
  }

  public noteToChromaOctave(note: string): [string, number] {
    const chromaOctave: Array<string> | null = note.match(CHROMA_OCTAVE_PATTERN);
    if (chromaOctave != null) {
      const chroma: string = chromaOctave[0];
      let octave: number = 0;
      if (chromaOctave.length > 1) {
        octave = Number(chromaOctave[1]);
      } else {
        throw new Error('Unspecified octave for the note: ' + note + ' with chroma: ' + chroma);
      }
      return [chroma, octave];
    }
    throw new Error('The note ' + note + ' is not of a chroma and octave pattern.');
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
    if (chords && chords.length > 0) {
      // Have a few end of track notes as a note may not be played by an unreliable synth
      chords[chords.length] = this.createLastOfTrackPlacedChord(chords.length);
      chords[chords.length] = this.createLastOfTrackPlacedChord(chords.length);
      chords[chords.length] = this.createLastOfTrackPlacedChord(chords.length);
    }
  }

  public createLastOfTrackPlacedChord(index: number): PlacedChord {
    const endNote: Note = this.createNote(index, NOTE_END_OF_TRACK, NOTE_END_OF_TRACK_OCTAVE);
    return this.createPlacedChord(index, NOTE_END_OF_TRACK_DURATION, TempoUnit.NOTE, NOTE_END_OF_TRACK_VELOCITY, DEFAULT_TONALITY_C_MAJOR, [endNote]);
  }

  public buildEndOfTrackNote(): string {
    return NOTE_END_OF_TRACK + NOTE_END_OF_TRACK_OCTAVE + CHORD_DURATION_SEPARATOR + NOTE_END_OF_TRACK_DURATION;
  }

  public getDefaultChordDuration(): Duration {
    return this.createDuration(DEFAULT_CHORD_DURATION, TempoUnit.NOTE);
  }
  public createDefaultTimeSignature(): TimeSignature {
    return new TimeSignature(DEFAULT_TIME_SIGNATURE_NUMERATOR, DEFAULT_TIME_SIGNATURE_DENOMINATOR);
  }

  public isBpmTempoUnit(duration: Duration) {
    return duration && duration.unit === TempoUnit.NOTE;
  }
/* ENHARMONICS
*/
  private allowedChromas(): Array<string> {
    const bidirectional: Array<string> = new Array();
    CHROMA_ENHARMONICS.forEach((value: string, key: string) => {
      bidirectional.push(key);
      bidirectional.push(value);
    });
    return META_CHROMAS.concat(bidirectional);
  }
/*
private allowedChromas(): Array<string> {
  return META_CHROMAS.concat(HALF_TONE_CHROMAS);
} TODO
*/

  private createChroma(value: string): Chroma {
    if (this.allowedChromas().includes(value)) {
      return new Chroma(value);
    } else {
      throw new Error('A chroma could not be instantiated witht the value ' + value);
    }
  }

  private createOctave(value: number): Octave {
    return new Octave(value);
  }

  public createDuration(duration: number, tempoUnit: TempoUnitType): Duration {
    return new Duration(duration, tempoUnit);
  }

  private createPitch(chroma: Chroma, octave: Octave): Pitch {
    return new Pitch(chroma, octave);
  }

  public createEmptyChord(index: number, duration: Duration, velocity: number, tonality: Tonality): PlacedChord {
    return new PlacedChord(index, duration, velocity, tonality);
  }

  public createSameChord(chord: PlacedChord): PlacedChord {
    const chordIndex: number = chord.index + 1;
    const sameChord: PlacedChord = this.createEmptyChord(chordIndex, chord.duration, chord.velocity, chord.tonality)
    sameChord.dottedAll = chord.dottedAll;
    chord.getNotesSortedByIndex()
    .map((note: Note) => {
      sameChord.addNote(note);
    });
    return sameChord;
  }

  public createTimeSignature(numerator: number, denominator: number): TimeSignature {
    return new TimeSignature(numerator, denominator);
  }

}
