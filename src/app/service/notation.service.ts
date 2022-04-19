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
import { DEFAULT_TONALITY_C_MAJOR, NOTE_END_OF_TRACK, NOTE_REST, NOTE_CHROMAS_SYLLABIC, CHORD_CHROMAS_SYLLABIC, CHROMA_ENHARMONICS, META_CHROMAS, NOTE_RANGE, NOTE_ACCIDENTAL_MINOR, NOTE_RANGE_INTERVALS, CHROMAS_ALPHABETICAL, CHROMAS_MAJOR, CHROMAS_MINOR, NB_HALF_TONES_MAJOR, NOTE_ACCIDENTAL_DIMINISHED, DEFAULT_CHORD_WIDTH, DEFAULT_NOTE_OCTAVE, DEFAULT_VELOCITY_SOFT, NB_HALF_TONES_MINOR, NOTE_CHROMA_C, TRACK_INDEX_HARMONY, TRACK_INDEX_MELODY } from './notation.constant ';
import { Tonality } from '@app/model/note/tonality';
import { Soundtrack } from '@app/model/soundtrack';
import { Track } from '@app/model/track';

const CHORD_SEPARATOR: string = ' ';
const CHORD_DURATION_SEPARATOR: string = '/';
const NOTE_SEPARATOR: string = '|';
const NOTE_END_OF_TRACK_OCTAVE: number = 0;
const NOTE_END_OF_TRACK_DURATION: number = 8;
const NOTE_END_OF_TRACK_VELOCITY: number = 0;
const CHROMA_OCTAVE_PATTERN: RegExp = /[a-z#]+|[^a-z#]+/gi;
const CHROMA_SHIFT_TIMES: number = 2;

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

  public removeSharpsAndFlats(chroma: string): string {
    return chroma.replace(NOTE_SHARP, '').replace(NOTE_FLAT, '');
  }

  private getNoteFrequency(note: Note): number {
    // The accidental must not be present in the note when getting the frequency
    const chromaOctave: string = this.removeSharpsAndFlats(note.renderIntlChromaOctave());
    return Tone.Frequency(chromaOctave).toFrequency();
  }

  public sortNotesByIndex(notes: Array<Note>): Array<Note> {
    return notes.sort((noteA: Note, noteB: Note) => {
      return noteA.index - noteB.index;
    });
  }

  public sortNotesByFrequency(notes: Array<Note>): Array<Note> {
    return notes.sort((noteA: Note, noteB: Note) => {
      return this.getNoteFrequency(noteA) - this.getNoteFrequency(noteB);
    });
  }

  public getFirstChordNoteSortedByIndex(placedChord: PlacedChord): Note {
    const sortedNotes: Array<Note> = this.sortNotesByIndex(placedChord.notes);
    if (!sortedNotes || sortedNotes.length == 0) {
      throw new Error('The placed chord had no notes to sort by index.');
    }
    return sortedNotes[0];
  }

  private getSecondChordNoteSortedByIndex(placedChord: PlacedChord): Note {
    const sortedNotes: Array<Note> = this.sortNotesByIndex(placedChord.notes);
    if (!sortedNotes || sortedNotes.length < 2) {
      throw new Error('The placed chord had no notes to sort by index.');
    }
    return sortedNotes[1];
  }

  private getThirdChordNoteSortedByIndex(placedChord: PlacedChord): Note {
    const sortedNotes: Array<Note> = this.sortNotesByIndex(placedChord.notes);
    if (!sortedNotes || sortedNotes.length < 3) {
      throw new Error('The placed chord had no notes to sort by index.');
    }
    return sortedNotes[2];
  }

  public getFirstNoteSortedByPitch(placedChord: PlacedChord): Note {
    const sortedNotes: Array<Note> = this.sortNotesByFrequency(placedChord.notes);
    if (!sortedNotes || sortedNotes.length == 0) {
      throw new Error('The placed chord had no notes to sort by pitch.');
    }
    const lastIsLowest: number = sortedNotes.length - 1;
    return sortedNotes[lastIsLowest];
  }

  public renderIntlChromaOctave(chroma: string, octave: number): string {
    let abc: string = chroma;
    if (octave != null) {
      abc += octave;
    }
    return abc;
  }

  public renderTonalityName(tonality: Tonality): string {
    const tonalityChordNames: Array<string> = this.getTonalityChordNames(tonality.range, tonality.firstChroma);
    return this.renderChordNameInSyllabic(tonalityChordNames[0]);
  }

  public renderTonalityChords(tonality: Tonality): Array<string> {
    const chordNames: Array<string> = new Array();
    const tonalityChordNames: Array<string> = this.getTonalityChordNames(tonality.range, tonality.firstChroma);
    for (const tonalityChordName of tonalityChordNames) {
      chordNames.push(this.renderChordNameInSyllabic(tonalityChordName));
    }
    return chordNames;
  }

  public renderChordNameInSyllabic(chordNameIntl: string): string {
    const syllabic: string = this.chordChromaIntlToChromaSyllabic(CHORD_CHROMAS_SYLLABIC, chordNameIntl);
    return syllabic + ' ' + chordNameIntl;
  }

  public isHarmonyChord(placedChord: PlacedChord): boolean {
    return placedChord.notes && placedChord.notes.length >= DEFAULT_CHORD_WIDTH;
  }

  public chordChromaIntlToChromaSyllabic(chromasSyllabic: Map<string, string>, chroma: string): string {
    let bareChroma: string = chroma;
    let accidental: string = '';
    if (bareChroma.includes(NOTE_ACCIDENTAL_MINOR)) {
      bareChroma = bareChroma.replace(NOTE_ACCIDENTAL_MINOR, '');
      accidental += NOTE_ACCIDENTAL_MINOR;
    }
    if (bareChroma.includes(NOTE_ACCIDENTAL_DIMINISHED)) {
      bareChroma = bareChroma.replace(NOTE_ACCIDENTAL_DIMINISHED, '');
      accidental += NOTE_ACCIDENTAL_DIMINISHED;
    }
    let syllabicChroma: string = this.getChromaSyllabic(chromasSyllabic, bareChroma);
    syllabicChroma += accidental;
    return syllabicChroma;
  }

  public noteChromaLetterToChromaSyllabic(chroma: string): string {
    return this.getChromaSyllabic(NOTE_CHROMAS_SYLLABIC, chroma);
  }

  private getChromaSyllabic(chromasSyllabic: Map<string, string>, chroma: string): string {
    if (chromasSyllabic.has(chroma)) {
      const syllabic: string | undefined = chromasSyllabic.get(chroma);
      if (syllabic) {
        return syllabic;
      } else {
        throw new Error('The chroma letter ' + chroma + ' could not be retrieved in the chromas syllabic.');
      }
    } else {
      throw new Error('The chroma letter ' + chroma + ' could not be found in the chromas syllabic.');
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
      // Have a few end of track notes instead of just one
      // as a note may not be played by an unreliable synth
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

  private allowedChromas(): Array<string> {
    const bidirectional: Array<string> = new Array();
    CHROMA_ENHARMONICS.forEach((value: string, key: string) => {
      bidirectional.push(key);
      bidirectional.push(value);
    });
    return META_CHROMAS.concat(bidirectional);
  }

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

  public clonePlacedChord(chord: PlacedChord): PlacedChord {
    const chordIndex: number = chord.index + 1;
    const clonedChord: PlacedChord = this.createEmptyChord(chordIndex, chord.duration, chord.velocity, chord.tonality)
    clonedChord.dottedAll = chord.dottedAll;
    chord.getNotesSortedByIndex()
    .forEach((note: Note) => {
      clonedChord.addNote(note);
    });
    return clonedChord;
  }

  public createTimeSignature(numerator: number, denominator: number): TimeSignature {
    return new TimeSignature(numerator, denominator);
  }

  // The international name of the chord is the chroma picked in the tonality
  // possibly suffixed with some accidentals
  // This chroma picked in the tonality is the first note added in the chord
  // This is valid if the chord is not reversed
  // Suffix the chord name with a minor accidental if the second note of the chord is a minor
  public getChordIntlName(placedChord: PlacedChord): string {
    const note: Note = this.getFirstChordNoteSortedByIndex(placedChord);
    // Get the chord position in the tonality
    const firstChordNote: Note = this.getFirstChordNoteSortedByIndex(placedChord);
    const firstNotePosition: number = this.getChordNotePositionInTonality(placedChord, firstChordNote);
    const secondChordNote: Note = this.getSecondChordNoteSortedByIndex(placedChord);
    const secondNotePosition: number = this.getChordNotePositionInTonality(placedChord, secondChordNote);
    const thirdChordNote: Note = this.getThirdChordNoteSortedByIndex(placedChord);
    const thirdNotePosition: number = this.getChordNotePositionInTonality(placedChord, thirdChordNote);
    const firstToSecondHalfTones: number = this.getNbHalfTonesBetweenNotes(placedChord.tonality.range, firstNotePosition, secondNotePosition);
    const secondToThirdHalfTones: number = this.getNbHalfTonesBetweenNotes(placedChord.tonality.range, secondNotePosition, thirdNotePosition);
    // Check if the second note of the chord is a major or minor
    if (this.isMinorDegree(firstToSecondHalfTones, secondToThirdHalfTones)) {
      // Minor chord
      return note.renderChroma() + NOTE_ACCIDENTAL_MINOR;
    } else if (this.isDiminishedDegree(firstToSecondHalfTones, secondToThirdHalfTones)) {
      // Diminished chord
      return note.renderChroma() + NOTE_ACCIDENTAL_DIMINISHED;
    } else {
      // Major chord
      return note.renderChroma();
    }
  }

  private getChordNotePositionInTonality(placedChord: PlacedChord, note: Note): number {
    let tonalityChromas: Array<string> = this.getTonalityChromas(placedChord.tonality.range, placedChord.tonality.firstChroma);
    for (let position: number = 0; position < tonalityChromas.length; position++) {
      if (note.renderChroma() == tonalityChromas[position]) {
        return position;
      }
    }
    throw new Error('The position for the placed chord note ' + note.renderChroma() + ' could not be found in the tonality ' + tonalityChromas);
  }

  private getNbHalfTonesBetweenNotes(noteRange: NOTE_RANGE, fromNotePosition: number, toNotePosition: number): number {
    let nbHalfTones: number = 0;
    const intervals: Array<number> = this.getNoteRangeIntervals(noteRange);
    if (fromNotePosition > toNotePosition) {
      toNotePosition += intervals.length;
    }
    for (let index: number = fromNotePosition; index < toNotePosition; index++) {
      let position: number = index;
      if (position >= intervals.length) {
        position -= intervals.length;
      }
      nbHalfTones = nbHalfTones + (intervals[position] * 2);
    }
    return nbHalfTones;
  }

  // The chord is diminished if the number of intervals between the first and second notes is 4 and the number of intervals between the second and third notes is 3
  private isMajorDegree(firstToSecondHalfTones: number, secondToThirdHalfTones: number): boolean {
    if (firstToSecondHalfTones == NB_HALF_TONES_MAJOR && secondToThirdHalfTones == NB_HALF_TONES_MINOR) {
      return true;
    } else {
      return false;
    }
  }

  // The chord is diminished if the number of intervals between the first and second notes is 3 and the number of intervals between the second and third notes is 4
  private isMinorDegree(firstToSecondHalfTones: number, secondToThirdHalfTones: number): boolean {
    if (firstToSecondHalfTones == NB_HALF_TONES_MINOR && secondToThirdHalfTones == NB_HALF_TONES_MAJOR) {
      return true;
    } else {
      return false;
    }
  }

  // The chord is diminished if the number of intervals between the first and second notes is 3 and the number of intervals between the second and third notes is 3
  private isDiminishedDegree(firstToSecondHalfTones: number, secondToThirdHalfTones: number): boolean {
    // Check the degree is diminished
    if (firstToSecondHalfTones == NB_HALF_TONES_MINOR && secondToThirdHalfTones == NB_HALF_TONES_MINOR) {
      return true;
    } else {
      return false;
    }
  }

  public getNoteRangeIntervals(noteRange: NOTE_RANGE): Array<number> {
    const noteRangeIntervals: Array<number> | undefined = NOTE_RANGE_INTERVALS.get(noteRange);
    if (noteRangeIntervals) {
      return noteRangeIntervals;
    } else {
      throw new Error('No intervals could be found for the note range ' + noteRange);
    }
  }

  public getTonalityChordNames(noteRange: NOTE_RANGE, rangeFirstChroma: string): Array<string> {
    const tonalityChordNames: Array<string> = new Array();
    const tonalityChromas: Array<string> = this.getTonalityChromas(noteRange, rangeFirstChroma);
    let placedChordIndex: number = 0;
    const chromas: Array<Array<string>> = this.buildStandardTonalityChordChromas(tonalityChromas);
    const tonality: Tonality = new Tonality(noteRange, rangeFirstChroma);
    for (let index: number = 0; index < tonalityChromas.length; index++) {
      const placedChord: PlacedChord = this.createNotesAndPlacedChord(DEFAULT_NOTE_OCTAVE, DEFAULT_CHORD_DURATION, DEFAULT_VELOCITY_SOFT, tonality, placedChordIndex, chromas[index]);
      tonalityChordNames.push(this.getChordIntlName(placedChord));
      placedChordIndex++;
    }
    return tonalityChordNames;
  }

  private buildStandardTonalityChordChromas(tonalityChromas: Array<string>): Array<Array<string>> {
    const chromas: Array<Array<string>> = new Array();
    const shiftedChromas: Array<Array<string>> = this.getTonalityShiftedChromas(tonalityChromas, DEFAULT_CHORD_WIDTH);
    for (let chromaIndex: number = 0; chromaIndex < tonalityChromas.length; chromaIndex++) {
      const chordChromas: Array<string> = new Array();
      for (let noteIndex = 0; noteIndex < DEFAULT_CHORD_WIDTH; noteIndex++) {
        chordChromas.push(shiftedChromas[noteIndex][chromaIndex]);
      }
      chromas.push(chordChromas);
    }
    return chromas;
  }

  public createNotesAndPlacedChord(octave: number, chordDuration: number, velocity: number, tonality: Tonality, placedChordIndex: number, chromas: Array<string>): PlacedChord {
    let noteIndex: number = 0;
    let previousChroma: string = '';
    const nextUpperOctave: number = octave + 1;
    const notes: Array<Note> = new Array();
    for (let i = 0; i < chromas.length; i++) {
      const chroma: string = chromas[i];
      if (noteIndex > 0 && this.chordChromaBelongsToNextUpperOctave(previousChroma, chroma, tonality)) {
        octave = nextUpperOctave;
      }
      const note: Note = this.createNote(noteIndex, chroma, octave);
      noteIndex++;
      previousChroma = chroma;
      notes.push(note);
    }
    return this.createPlacedChord(placedChordIndex, chordDuration, TempoUnit.NOTE, velocity, tonality, notes);
  }

  // As the chromas of a chord are created in ascending pitch order
  // if a current chord chroma is lower than the previous chord chroma
  // then take the alpha chromas of these two chromas and
  // if this current alpha chroma is lower than that previous alpha chroma on the C Major tonality
  // then the current chroma belong to the next upper octave
  private chordChromaBelongsToNextUpperOctave(previousChroma: string, currentChroma: string, tonality: Tonality): boolean {
    const tonalityChromas: Array<string> = this.getTonalityChromas(tonality.range, tonality.firstChroma);
    if (tonalityChromas.indexOf(currentChroma) < tonalityChromas.indexOf(previousChroma)) {
      const previousAlphaChroma: string = previousChroma.substring(0,1);
      const currentAlphaChroma: string = currentChroma.substring(0,1);
      const cMajorTonalityChromas: Array<string> = this.getTonalityChromas(DEFAULT_TONALITY_C_MAJOR.range, DEFAULT_TONALITY_C_MAJOR.firstChroma);
      if (cMajorTonalityChromas.indexOf(currentAlphaChroma) < cMajorTonalityChromas.indexOf(previousAlphaChroma)) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public getChromasDistance(previousNoteChroma: string, previousNoteOctave: number, currentNoteChroma: string, currentNoteOctave: number, tonalityChromas: Array<string>): number {
    const previousNoteIndex: number = tonalityChromas.indexOf(previousNoteChroma);
    const currentNoteIndex: number = tonalityChromas.indexOf(currentNoteChroma);
    return Math.abs((((currentNoteOctave - 1) * tonalityChromas.length) + currentNoteIndex) - (((previousNoteOctave - 1) * tonalityChromas.length) + previousNoteIndex));
  }

  public getTonalityChromas(noteRange: NOTE_RANGE, rangeFirstChroma: string): Array<string> {
    let tonalityChromas: Array<string> = new Array();
    const sourceScale: Array<string> = this.getSourceScale(rangeFirstChroma);
    const enharmonicScale: Array<string> = this.getEnharmonicScale(rangeFirstChroma);
    const alphaScale: Array<string> = this.getAlphaScale(rangeFirstChroma, sourceScale.length);
    const noteRangeStructure: Array<number> = this.intervalsToStructure(this.getNoteRangeIntervals(noteRange));

    let structureIndex: number = 0;
    for (let index = 0; index < sourceScale.length; index++) {
      if (noteRangeStructure[structureIndex] == index) {
        if (sourceScale[index].includes(alphaScale[structureIndex])) {
          tonalityChromas.push(sourceScale[index]);
        } else if (enharmonicScale[index].includes(alphaScale[structureIndex])) {
          tonalityChromas.push(enharmonicScale[index]);
        }
        structureIndex++;
      }
    }
    return tonalityChromas;
  }

  private getSourceScale(rangeFirstChroma: string): Array<string> {
    return this.pickContainingEnharmonics(rangeFirstChroma);
  }

  private getEnharmonicScale(rangeFirstChroma: string): Array<string> {
    const sameSoundingChroma: string = this.getChromaEnharmonic(rangeFirstChroma);
    return this.pickContainingEnharmonics(sameSoundingChroma);
  }

  private getAlphaScale(startChroma: string, length: number): Array<string> {
    var shiftedChromas: Array<string> = new Array();
    for (let i: number = 0; i < length; i++) {
      if (startChroma.includes(CHROMAS_ALPHABETICAL[i])) {
        for (let j = i; j < length + i; j++) {
          shiftedChromas.push(CHROMAS_ALPHABETICAL[j % CHROMAS_ALPHABETICAL.length]);
        }
        break;
      }
    }
    if (shiftedChromas.length == 0) {
      throw new Error('The chroma ' + startChroma + ' could not be found in the alphabetical chromas ' + CHROMAS_ALPHABETICAL);
    }
    return shiftedChromas;
  }

  // Create a new map of enharmonics from mappings with their orginal values as keys
  // so as to get a map of enharmonics containing only the reversed mappings
  private getReversedEnharmonics(): Map<string, string> {
    const reversed: Map<string, string> = new Map();
    CHROMA_ENHARMONICS.forEach((value: string, key: string) => {
      reversed.set(value, key);
    });
    return reversed;
  }

  // Add to the map of enharmonics some new mappings with their original values as keys
  // so as to get a map with the original mappings plus the reversed mappings
  private getBidirectionalEnharmonics(): Map<string, string> {
    const bidirectional: Map<string, string> = new Map();
    CHROMA_ENHARMONICS.forEach((value: string, key: string) => {
      bidirectional.set(key, value);
      bidirectional.set(value, key);
    });
    return bidirectional;
  }

  // Get the matching enharmonic from a chroma
  private getChromaEnharmonic(chroma: string): string {
    const bidirectional: Map<string, string> = this.getBidirectionalEnharmonics();
    if (bidirectional.has(chroma)) {
      const enharmonic: string | undefined = bidirectional.get(chroma);
      if (enharmonic) {
        return enharmonic;
      } else {
        throw new Error('The chroma ' + chroma + ' could not be retrieved in the enharmonics.');
      }
    } else {
      throw new Error('The chroma ' + chroma + ' could not be found in the enharmonics.');
    }
  }

  // Get the one enharmonic mappings array that contains a chroma
  // and shift the array so as to start it with the chroma
  private pickContainingEnharmonics(startChroma: string): Array<string> {
    let chromas: Array<string> = new Array();
    if (CHROMA_ENHARMONICS.has(startChroma)) {
      CHROMA_ENHARMONICS.forEach((value: string, key: string) => {
        chromas.push(key);
      });
    } else {
      const reversedEnharmonics: Map<string, string> = this.getReversedEnharmonics();
      if (reversedEnharmonics.has(startChroma)) {
        reversedEnharmonics.forEach((value: string, key: string) => {
          chromas.push(key);
        });
      } else {
        throw new Error('The chroma ' + startChroma + ' could not be found in the reversed enharmonics.');
      }
    }

    let shiftedChromas: Array<string> = new Array();
    for (let i: number = 0; i < chromas.length; i++) {
      if (startChroma == chromas[i]) {
        for (let j = i; j < chromas.length + i; j++) {
          shiftedChromas.push(chromas[j % chromas.length]);
        }
        break;
      }
    }

    return shiftedChromas;
  }

  private intervalsToStructure(noteRangeIntervals: Array<number>): Array<number> {
    let noteRangeStructure: Array<number> = new Array();
    let total: number = 0;
    for (let index: number = 0; index < noteRangeIntervals.length; index++) {
      noteRangeStructure.push(total);
      total += (2 * noteRangeIntervals[index]);
    }
    return noteRangeStructure;
  }

  public createArrayShiftOnceLeft(items: Array<string>): Array<string> {
    // Make a deep copy
    let shiftedItems: Array<string> = new Array();
    items.forEach((chroma: string) => {
      shiftedItems.push(chroma);
    });

    // Shift the copy and not the original
    const item: string | undefined = shiftedItems.shift();
    if (item) {
      shiftedItems.push(item);
    } else {
      throw new Error('The array could not be shifted left');
    }
    return shiftedItems;
  }

  // Create a chromas array shifted from another one
  private createShiftedChromas(chromas: Array<string>): Array<string> {
    for (let i = 0; i < CHROMA_SHIFT_TIMES; i++) {
      chromas = this.createArrayShiftOnceLeft(chromas);
    }
    return chromas;
  }

  // Create all the shifted chromas arrays for a chord width
  public getTonalityShiftedChromas(tonalityChromas: Array<string>, chordWidth: number): Array<Array<string>> {
    const shiftedChromas: Array<Array<string>> = new Array();
    // Create shifted chromas, each starting some notes down the previous chroma
    // The number of shifted chromas is the width of the chord
    // An example for the C tonality is:
    // 'G', 'A', 'B', 'C', 'D', 'E', 'F'
    // 'E', 'F', 'G', 'A', 'B', 'C', 'D'
    // 'C', 'D', 'E', 'F', 'G', 'A', 'B'

    // Build the shifted chromas
    shiftedChromas[0] = tonalityChromas;
    for (let index = 1; index < chordWidth; index++) {
      shiftedChromas[index] = this.createShiftedChromas(shiftedChromas[index - 1]);
    }
    return shiftedChromas;
  }

  public isHarmonyTrack(trackIndex: number): boolean {
    return trackIndex == TRACK_INDEX_HARMONY;
  }

  public isMelodyTrack(trackIndex: number): boolean {
    return trackIndex == TRACK_INDEX_MELODY;
  }

  public isFirstMeasureChord(placedChordIndex: number): boolean {
    return placedChordIndex == 0;
  }

  public getMeasure(soundtrack: Soundtrack, trackIndex: number, measureIndex: number): Measure {
    const track: Track = soundtrack.getSortedTracks()[trackIndex];
    return track.getSortedMeasures()[measureIndex];
  }

  public getPlacedChord(soundtrack: Soundtrack, trackIndex: number, measureIndex: number, placedChordIndex: number): PlacedChord {
    const measure: Measure = this.getMeasure(soundtrack, trackIndex, measureIndex);
    const placedChord: PlacedChord = measure.getSortedChords()[placedChordIndex];
    return placedChord;
  }

  public getPreviousPlacedChord(soundtrack: Soundtrack, trackIndex: number, measureIndex: number, placedChordIndex: number): PlacedChord | undefined {
    // Ignore the previous chord if it sits in the previous measure
    if (placedChordIndex > 0) {
      const previousChordIndex: number = placedChordIndex - 1;
      const measure: Measure = this.getMeasure(soundtrack, trackIndex, measureIndex);
      const placedChord: PlacedChord = measure.getSortedChords()[previousChordIndex];
      return placedChord;
    } else {
      return undefined;
    }
  }

  public getHarmonyChordFromMelodyChord(soundtrack: Soundtrack, measureIndex: number, melodyChordIndex: number): PlacedChord  {
    const harmonyChord: PlacedChord = this.getPlacedChord(soundtrack, TRACK_INDEX_HARMONY, measureIndex, Math.floor(melodyChordIndex / 2));
    if (harmonyChord == undefined) {
      throw new Error('No harmony chord was found matching the melody chord.');
    }
    return harmonyChord;
  }

  public getMajorTonalities(): Array<Tonality> {
    const tonalities: Array<Tonality> = new Array();
    CHROMAS_MAJOR.forEach((chroma: string) => {
      tonalities.push(new Tonality(NOTE_RANGE.MAJOR, chroma));
    });
    return tonalities;
  }

  public getMajorTonalityChromas(): Array<string> {
    const chromas: Array<string> = new Array();
    CHROMAS_MAJOR.forEach((chroma: string) => {
      chromas.push(chroma);
    });
    return chromas;
  }

  private getAllTonalities(): Array<Tonality> {
    const tonalities: Array<Tonality> = new Array();
    CHROMAS_MAJOR.forEach((chroma: string) => {
      tonalities.push(new Tonality(NOTE_RANGE.MAJOR, chroma));
    });
    CHROMAS_MINOR.forEach((chroma: string) => {
      tonalities.push(new Tonality(NOTE_RANGE.MINOR_NATURAL, chroma));
    });
    return tonalities;
  }

  public logAllTonalities(): void {
    const tonalities: Array<Tonality> = this.getAllTonalities();

    console.log('Tonalities chromas');
    for (let index: number = 0; index < tonalities.length; index++) {
      const tonality: Tonality = tonalities[index];
      const tonalityChromas: Array<string> = this.getTonalityChromas(tonality.range, tonality.firstChroma);
      console.log(tonalityChromas);
    }

    console.log('');
    console.log('Tonalities chords names');
    for (let index: number = 0; index < tonalities.length; index++) {
      const tonality: Tonality = tonalities[index];
      const tonalityChordNames: Array<string> = this.getTonalityChordNames(tonality.range, tonality.firstChroma);
      console.log(tonalityChordNames);
    }
  }

}
