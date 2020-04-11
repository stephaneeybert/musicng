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
import { Soundtrack } from '@app/model/soundtrack';
import { Track } from '@app/model/track';
import { CommonService } from './common.service';

const CHORD_SEPARATOR: string = ' ';
const CHORD_DURATION_SEPARATOR: string = '/';
const NOTE_SEPARATOR: string = '|';
const NOTE_REST: string = 'rest';
const NOTE_END_OF_TRACK: string = 'rest';
const NOTE_END_OF_TRACK_OCTAVE: number = 9;
const NOTE_END_OF_TRACK_DURATION: string = '4';

const DEFAULT_TEMPO_BPM_VALUE: string = '128';
const DEFAULT_TIME_SIGNATURE_NUMERATOR: number = 4; // TODO Change to 4
const DEFAULT_TIME_SIGNATURE_DENOMINATOR: number = 4;

const CHROMAS_ALPHABETICAL: Array<string> = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const CHROMAS_GERMAN_ALPHABETICAL: Array<string> = ['C', 'D', 'E', 'F', 'G', 'A', 'H'];
const CHROMAS_SYLLABIC: Map<string, string> = new Map([ ['C', 'Do'], ['D', 'Re.m'], ['E', 'Mi.m'], ['F', 'Fa'], ['G', 'Sol'], ['A', 'La.m'], ['B', 'Si-'] ]);

@Injectable({
  providedIn: 'root'
})
export class NotationService {

  constructor(
    private commonService: CommonService
  ) { }

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

  public createMeasure(tempo: string, timeSignatureNumerator: number, timeSignatureDenominator: number): Measure {
    const timeSignature: TimeSignature = this.timeSignature(timeSignatureNumerator, timeSignatureDenominator);
    const measure: Measure = new Measure(this.tempo(tempo, TempoUnit.BPM), timeSignature);
    return measure;
  }

  private parseTextMeasure(textMeasure: string): Array<PlacedChord> {
    return textMeasure.split(CHORD_SEPARATOR)
      .map((textChord: string) => {
        return this.parseTextChord(textChord);
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

  private parseTextChord(textChord: string): PlacedChord {
    const chordAndDuration: Array<string> = textChord.split(CHORD_DURATION_SEPARATOR);
    const chordNotes: string = chordAndDuration[0];
    const chordDuration: string = chordAndDuration[1];
    const notes: Array<Note> = this.parseTextNotes(chordNotes);
    const placedChord: PlacedChord = this.createPlacedChord(chordDuration, notes);
    return placedChord;
  }

  public objectToNewSoundtrack(soundtrackObj: any): Soundtrack {
    const soundtrack: Soundtrack = new Soundtrack(this.commonService.normalizeName(name), name);
    soundtrack.id = soundtrackObj.id;
    soundtrack.name = soundtrackObj.name;
    soundtrack.copyright = soundtrackObj.copyright;
    soundtrack.lyrics = soundtrackObj.lyrics;
    soundtrack.tracks = new Array();
    if (soundtrackObj.tracks && soundtrackObj.tracks.length > 0) {
      soundtrackObj.tracks.forEach((trackObj: any) => {
        const track: Track = new Track();
        track.name = trackObj.name;
        track.channel = trackObj.channel;
        track.measures = new Array();
        if (trackObj.measures && trackObj.measures.length > 0) {
          trackObj.measures.forEach((measureObj: any) => {
            if (measureObj.placedChords && measureObj.placedChords.length > 0) {
              const measure: Measure = this.createMeasure(measureObj.tempo.value, parseInt(measureObj.timeSignature.numerator), parseInt(measureObj.timeSignature.denominator));
              measure.placedChords = new Array();
              measureObj.placedChords.forEach((placedChordObj: any) => {
                if (placedChordObj.notes && placedChordObj.notes.length > 0 && placedChordObj.cursor && placedChordObj.cursor.noteDuration && placedChordObj.cursor.noteDuration.subdivision) {
                  const notes: Array<Note> = new Array();
                  let index: number = 0;
                  placedChordObj.notes.forEach((noteObj: any) => {
                    if (noteObj.pitch) {
                      const note: Note = this.createNote(index, noteObj.pitch.chroma.value, noteObj.pitch.octave.value);
                      note.pitch.accidental = noteObj.pitch.accidental;
                      note.dotted = noteObj.dotted;
                      note.velocity = noteObj.velocity;
                      notes.push(note);
                      index++;
                    }
                  });
                  const duration: string = placedChordObj.cursor.noteDuration.subdivision.left + placedChordObj.cursor.noteDuration.unit;
                  const placedChord: PlacedChord = this.createPlacedChord(duration, notes);
                  placedChord.dottedAll = placedChordObj.dottedAll;
                  if (measure.placedChords) {
                    measure.placedChords.push(placedChord);
                  } else {
                    throw new Error('The measure placed chords array has not yet been instantiated.');
                  }
                }
              });
              track.measures.push(measure);
            }
          });
        }
        soundtrack.tracks.push(track);
      });
    }
    return soundtrack;
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
        throw new Error('The Latin chromas array has not been instantiated.');
      }
    } else {
      throw new Error('No Latin chroma could be found for the chroma letter ' + chroma);
    }
  }

  public createPlacedChord(chordDuration: string, notes: Array<Note>): PlacedChord {
    const duration: Duration = this.duration(chordDuration, TempoUnit.DUPLE);
    const cursor: Cursor = new Cursor(duration);
    const placedChord: PlacedChord = this.createEmptyChord(cursor);
    this.addNotes(placedChord, notes);
    return placedChord;
  }

  public createNote(index: number, chroma: string, octave: number): Note {
    const pitch: Pitch = this.pitch(this.toChroma(chroma), this.toOctave(octave));
    const note: Note = new Note(index, pitch);
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
      chords[chords.length] = this.createLastOfTrackPlacedChord();
      chords[chords.length] = this.createLastOfTrackPlacedChord();
      chords[chords.length] = this.createLastOfTrackPlacedChord();
    }
  }

  public createLastOfTrackPlacedChord(): PlacedChord {
    const index: number = 0;
    const endNote: Note = this.createNote(index, NOTE_REST, NOTE_END_OF_TRACK_OCTAVE);
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

  public buildNoteWithTicks(abc: string, octave: number, velocity: number): Note {
    const index: number = 0;
    const note: Note = this.createNote(index, abc, octave);
    note.velocity = velocity;
    return note;
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
