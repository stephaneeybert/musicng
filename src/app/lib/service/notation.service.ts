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
import { Soundtrack } from '@app/model/soundtrack';
import { Track } from '@app/model/track';
import { CommonService } from './common.service';
import { Subdivisions } from '@app/model/note/duration/subdivisions';
import { SoundtrackStorageService } from '@app/views/soundtrack/soundtrack-storage.service';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

const CHORD_SEPARATOR: string = ' ';
const CHORD_DURATION_SEPARATOR: string = '/';
const NOTE_SEPARATOR: string = '|';
const NOTE_REST: string = 'rest';
const NOTE_END_OF_TRACK: string = 'rest';
const NOTE_END_OF_TRACK_OCTAVE: number = 9;
const NOTE_END_OF_TRACK_DURATION: number = 1;

const DEFAULT_TEMPO_BPM_VALUE: number = 128;
const DEFAULT_TIME_SIGNATURE_NUMERATOR: number = 4;
const DEFAULT_TIME_SIGNATURE_DENOMINATOR: number = 4;

const CHROMAS_ALPHABETICAL: Array<string> = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const CHROMAS_GERMAN_ALPHABETICAL: Array<string> = ['C', 'D', 'E', 'F', 'G', 'A', 'H'];
const CHROMAS_SYLLABIC: Map<string, string> = new Map([ ['C', 'Do'], ['D', 'Re.m'], ['E', 'Mi.m'], ['F', 'Fa'], ['G', 'Sol'], ['A', 'La.m'], ['B', 'Si-'] ]);

@Injectable({
  providedIn: 'root'
})
export class NotationService {

  constructor(
    private commonService: CommonService,
    private soundtrackStorageService: SoundtrackStorageService
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

  public createMeasure(duration: number, timeSignatureNumerator: number, timeSignatureDenominator: number): Measure {
    const timeSignature: TimeSignature = this.createTimeSignature(timeSignatureNumerator, timeSignatureDenominator);
    const measure: Measure = new Measure(this.createDuration(duration, TempoUnit.BPM), timeSignature);
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
    const chordDuration: number = parseInt(chordAndDuration[1], 10);
    const notes: Array<Note> = this.parseTextNotes(chordNotes);
    const placedChord: PlacedChord = this.createPlacedChord(chordDuration, TempoUnit.DUPLE, notes);
    return placedChord;
  }

  private is(value: any): boolean {
    return this.commonService.is(value);
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
            if (!measureObj.placedChords || measureObj.placedChords.length == 0) {
              this.soundtrackStorageService.deleteSoundtrack(soundtrack.id);
              throw new Error('The placed chords could not be accessed from the untyped soundtrack.');
            }
            if (!measureObj.duration || !measureObj.duration.subdivision || !this.is(measureObj.duration.subdivision.left) || !this.is(measureObj.duration.subdivision.right) || !measureObj.duration.unit) {
                this.soundtrackStorageService.deleteSoundtrack(soundtrack.id);
                throw new Error('The measure duration subdivision or unit could not be accessed from the untyped soundtrack.');
            }
            const measureDuration: number = parseInt(measureObj.duration.subdivision.left, 10) + parseInt(measureObj.duration.subdivision.right, 10);
            const measure: Measure = this.createMeasure(measureDuration, parseInt(measureObj.timeSignature.numerator), parseInt(measureObj.timeSignature.denominator));
            measure.placedChords = new Array();
            measure.duration = this.createDuration(measureDuration, measureObj.duration.unit);
            measure.timeSignature = this.createTimeSignature(measureObj.timeSignature.numerator, measureObj.timeSignature.denominator);
            measureObj.placedChords.forEach((placedChordObj: any) => {
              if (!placedChordObj.notes || placedChordObj.notes.length == 0) {
                this.soundtrackStorageService.deleteSoundtrack(soundtrack.id);
                throw new Error('The notes could not be accessed from the untyped soundtrack.');
              }
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
              if (!placedChordObj.duration || !placedChordObj.duration.subdivision || !this.is(placedChordObj.duration.subdivision.left) || !this.is(placedChordObj.duration.subdivision.right) || !placedChordObj.duration.unit) {
                this.soundtrackStorageService.deleteSoundtrack(soundtrack.id);
                throw new Error('The placed chord duration subdivistion or unit could not be accessed from the untyped soundtrack.');
              }
              const duration: number = parseInt(placedChordObj.duration.subdivision.left, 10) + parseInt(placedChordObj.duration.subdivision.right, 10);
              const tempoUnit: TempoUnit = placedChordObj.duration.unit as TempoUnit;
              const placedChord: PlacedChord = this.createPlacedChord(duration, tempoUnit, notes);
              placedChord.dottedAll = placedChordObj.dottedAll;
              if (!measure.placedChords) {
                this.soundtrackStorageService.deleteSoundtrack(soundtrack.id);
                throw new Error('The measure placed chords array could not be accessed from the untyped soundtrack.');
              }
              measure.placedChords.push(placedChord);
            });
            track.measures.push(measure);
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

  public createPlacedChord(chordDuration: number, tempoUnit: TempoUnit, notes: Array<Note>): PlacedChord {
    const duration: Duration = this.createDuration(chordDuration, tempoUnit);
    const placedChord: PlacedChord = this.createEmptyChord(duration);
    this.addNotes(placedChord, notes);
    return placedChord;
  }

  public createNote(index: number, chroma: string, octave: number): Note {
    const pitch: Pitch = this.createPitch(this.createChroma(chroma), this.createOctave(octave));
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
    return this.createPlacedChord(NOTE_END_OF_TRACK_DURATION, TempoUnit.DUPLE, [endNote]);
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

  public placeEmptyChord(duration: Duration): PlacedChord {
    return this.createEmptyChord(duration);
  }

  private createChroma(value: string): Chroma {
    return new Chroma(value);
  }

  private createOctave(value: number): Octave {
    return new Octave(value);
  }

  // TODO See https://music.stackexchange.com/questions/96150/how-to-express-a-duration-in-bpm-into-a-duration-in-division-subdivision
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

  private createEmptyChord(duration: Duration): PlacedChord {
    const placedChod: PlacedChord = new PlacedChord(duration);
    return placedChod;
  }

  public createTimeSignature(numerator: number, denominator: number): TimeSignature {
    return new TimeSignature(numerator, denominator);
  }

}
