import { Injectable } from '@angular/core';
import { Measure } from '@app/model/measure/measure';
import { NotationService } from './notation.service';
import { PlacedChord } from '@app/model/note/placed-chord';
import { Note } from '@app/model/note/note';
import { SoundtrackService } from '@app/views/soundtrack/soundtrack.service';
import { TranslateService } from '@ngx-translate/core';
import { Soundtrack } from '@app/model/soundtrack';
import { TempoUnit } from '@app/model/tempo-unit';
import { Track } from '@app/model/track';
import { CommonService } from '@stephaneeybert/lib-core';
import { TRACK_TYPES } from './notation.service';
import { SettingsService } from '@app/views/settings/settings.service';
import { RANDOM_METHOD, NOTE_RANGE, HALF_TONE_CHROMAS, NOTE_RANGE_INTERVALS, HALF_TONE } from './notation.constant ';
import { Tonality } from '@app/model/note/tonality';

@Injectable({
  providedIn: 'root'
})
export class GeneratorService {

  constructor(
    private commonService: CommonService,
    private soundtrackService: SoundtrackService,
    private notationService: NotationService,
    private settingsService: SettingsService,
    private translateService: TranslateService,
  ) { }

  CHROMA_SHIFT_TIMES: number = 2;

  private createNotesAndPlacedChord(octave: number, chordDuration: number, velocity: number, tonality: Tonality, placedChordIndex: number, chord: Array<string>): PlacedChord {
    let noteIndex: number = 0;
    const notes: Array<Note> = chord.map((textNote: string) => {
      const note: Note = this.notationService.createNote(noteIndex, textNote, octave);
      noteIndex++;
      return note;
    });
    return this.notationService.createPlacedChord(placedChordIndex, chordDuration, TempoUnit.DUPLE, velocity, tonality, notes);
  }

  private createMeasure(index: number): Measure {
    const tempoBpm: number = this.settingsService.getSettings().generateTempoBpm;
    const timeSignatureNumerator: number = this.settingsService.getSettings().generateTimeSignatureNumerator;
    const timeSignatureDenominator: number = this.settingsService.getSettings().generateTimeSignatureDenominator;
    return this.notationService.createMeasure(index, tempoBpm, timeSignatureNumerator, timeSignatureDenominator);
  }

  private createMeasures(generatedChords: Array<PlacedChord>): Array<Measure> {
    let measureIndex: number = 0;
    let chordIndex: number = 0;
    const measures: Array<Measure> = new Array<Measure>();
    let measure: Measure = this.createMeasure(measureIndex);
    measure.placedChords = new Array<PlacedChord>();
    generatedChords
      .forEach((placedChord: PlacedChord) => {
        if (measure.placedChords) {
          // The number of beats of the chords placed in a measure must equal the number of beats of the measure
          if (measure.getPlacedChordsNbBeats() >= measure.getNbBeats()) {
            measures.push(measure);
            measure = this.createMeasure(measureIndex);
            measure.placedChords = new Array<PlacedChord>();
            measureIndex++;
            chordIndex = 0;
          }
          placedChord.index = chordIndex;
          chordIndex++;
          measure.placedChords.push(placedChord);
        } else {
          throw new Error('The measure placed chords array has not been instantiated.');
        }
      });
    measures.push(measure);
    return measures;
  }

  public generateSoundtrack(): Soundtrack {
    const soundtrack: Soundtrack = this.soundtrackService.createSoundtrack(this.createNewSoundtrackId(), this.createNewSoundtrackName());

    const randomMethod: RANDOM_METHOD = this.settingsService.getSettings().generateMethod;

    const octave: number = this.settingsService.getSettings().generateNoteOctave;
    const chordDuration: number = this.settingsService.getSettings().generateChordDuration;

    const harmonyVelocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityHarmony);
    const harmonyMeasures: Array<Measure> = this.generateHarmonyChordInMeasures(octave, chordDuration, harmonyVelocity);

    if (this.settingsService.getSettings().generateHarmony) {
      const harmonyTrack: Track = soundtrack.addTrack(harmonyMeasures);
      harmonyTrack.name = this.getTrackName(TRACK_TYPES.HARMONY);
      harmonyTrack.displayChordNames = true;
    }

    if (this.settingsService.getSettings().generateMelody) {
      const melodyVelocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityMelody);
      const melodyChords: Array<PlacedChord> = this.generateMelodyChords(harmonyMeasures, randomMethod, octave, chordDuration, melodyVelocity);
      const melodyMeasures: Array<Measure> = this.createMeasures(melodyChords);

      const melodyTrack: Track = soundtrack.addTrack(melodyMeasures);
      melodyTrack.name = this.getTrackName(TRACK_TYPES.MELODY);
    }

    if (this.settingsService.getSettings().generateDrums) {
      const drumsChords: Array<PlacedChord> = new Array();
      const drumsTrack: Track = soundtrack.addTrack(this.createMeasures(drumsChords));
      drumsTrack.name = this.getTrackName(TRACK_TYPES.DRUMS);
      drumsTrack.displayChordNames = true;
    }

    if (this.settingsService.getSettings().generateBass) {
      const bassChords: Array<PlacedChord> = new Array();
      const bassTrack: Track = soundtrack.addTrack(this.createMeasures(bassChords));
      bassTrack.name = this.getTrackName(TRACK_TYPES.BASS);
      bassTrack.displayChordNames = true;
    }

    this.soundtrackService.storeSoundtrack(soundtrack);
    return soundtrack;
  }

  private getTrackName(trackType: string): string {
    return this.translateService.instant('music.notation.track.' + trackType);
  }

  private createNewSoundtrackName(): string {
    return this.translateService.instant('soundtracks.assignedName');
  }

  private createNewSoundtrackId(): string {
    return this.translateService.instant('soundtracks.assignedName') + '_' + this.commonService.getRandomString(4);
  }

  private createArrayShiftOnceLeft(items: Array<string>): Array<string> {
    // Make a deep copy
    let shiftedItems: Array<string> = new Array();
    items.forEach((chroma: string) => {
      shiftedItems.push(chroma);
    });

    // Shift the copy and not the original
    const item: string | undefined = shiftedItems.shift();
    shiftedItems.push(item!);
    return shiftedItems;
  }

  private createArrayShiftOnceRight(items: Array<string>): Array<string> {
    // Make a deep copy
    let shiftedItems: Array<string> = new Array();
    items.forEach((chroma: string) => {
      shiftedItems.push(chroma);
    });

    // Shift the copy and not the original
    const item: string | undefined = shiftedItems.pop();
    shiftedItems.unshift(item!);
    return shiftedItems;
  }

  // Create a chromas array shifted from another one
  private createShiftedChromas(chromas: Array<string>): Array<string> {
    for (let i = 0; i < this.CHROMA_SHIFT_TIMES; i++) {
      chromas = this.createArrayShiftOnceLeft(chromas);
    }
    return chromas;
  }

  // Create all the shifted chromas arrays for a chord width
  private getTonalityShiftedChromas(tonalityChromas: Array<string>): Array<Array<string>> {
    const shiftedChromas: Array<Array<string>> = new Array();
    // Create shifted chromas, each starting some notes down the previous chroma
    // The number of shifted chromas is the width of the chord
    // An example for the C tonality is:
    //  Do Re.m  Mi.m  Fa  Sol  La.m  Si-
    // 'C', 'D', 'E', 'F', 'G', 'A', 'B'
    // 'E', 'F', 'G', 'A', 'B', 'C', 'D'
    // 'G', 'A', 'B', 'C', 'D', 'E', 'F'

    // Build the shifted chromas
    shiftedChromas[0] = tonalityChromas;
    const chordWidth: number = this.settingsService.getSettings().generateChordWidth;
    for (let index = 1; index < chordWidth; index++) {
      shiftedChromas[index] = this.createShiftedChromas(shiftedChromas[index - 1]);
    }
    return shiftedChromas;
  }

  // Check if the chord shares a minimum number of notes with its previous chord
  private isSimilarToPrevious(previousChord: Array<string>, chord: Array<string>): boolean {
    let nbSameNotes: number = 0;
    for (let i = 0; i < this.settingsService.getSettings().generateChordWidth; i++) {
      if (previousChord.includes(chord[i])) {
        nbSameNotes++;
      }
    }
    return (nbSameNotes >= (chord.length - 1));
  }

  private createShiftedChord(chord: Array<string>): Array<string> {
    return this.createArrayShiftOnceRight(chord);
  }

  // The randomised pick between a source chord note or an inpassing note can be tuned by a setting
  private fromInpassingNote(): boolean {
    const inpassingNote: number = this.settingsService.getSettings().generateInpassingNote;
    if (inpassingNote > 0) {
      const randomInpassingnote: number = this.commonService.getRandomIntegerBetween(0, 100);
      if (randomInpassingnote < inpassingNote) {
        return true;
      }
    }
    return false;
  }

  // Get an inpassing note that is near the previous melody note
  // An inpassing note is one that is not in the source chord but that
  // is between the previous melody note and another note of the source chord
  // even if of another octave
  private getInpassingNearNotes(harmonyChord: PlacedChord, previousMelodyChroma: string, previousMelodyOctave: number): Array<string> {
    const nearNotes: Array<string> = new Array<string>();
    const harmonyChordSortedChromas: Array<string> = harmonyChord.getSortedNotesChromas();

    const tonalityChromas: Array<string> = this.getTonalityChromas(harmonyChord.tonality.range, harmonyChord.tonality.firstChroma);
    const previousMelodyNoteIndex: number = tonalityChromas.indexOf(previousMelodyChroma);

    if (previousMelodyNoteIndex < 0) {
      throw new Error('The previous melody chroma ' + previousMelodyChroma + ' could not be found in the tonality ' + tonalityChromas);
    }

    let chromas: Array<string> = tonalityChromas;

    // The maximum near distance to consider
    const NEAR_MAX: number = 2; // TODO Have this constant as a settings

    // Consider the chromas above the previous melody note chroma
    if (previousMelodyOctave <= harmonyChord.getFirstNote().renderOctave()) {
      for (let chromaIndex: number = 0; chromaIndex < NEAR_MAX; chromaIndex++) {
        chromas = this.createArrayShiftOnceLeft(chromas);
        // Consider only notes before the next harmony chord note
        if (!harmonyChordSortedChromas.includes(chromas[previousMelodyNoteIndex])) {
          // Check if the note is on the upper octave
          let octave = previousMelodyOctave;
          if (previousMelodyNoteIndex + chromaIndex + 1 >= tonalityChromas.length) {
            octave++;
          }
          nearNotes.push(chromas[previousMelodyNoteIndex] + String(octave));
        } else {
          break;
        }
      }
    }

    // Consider the chromas below the previous melody note chroma
    if (previousMelodyOctave >= harmonyChord.getFirstNote().renderOctave()) {
      chromas = tonalityChromas;
      for (let chromaIndex: number = 0; chromaIndex < NEAR_MAX; chromaIndex++) {
        chromas = this.createArrayShiftOnceRight(chromas);
        // Consider only notes before the next harmony chord note
        if (!harmonyChordSortedChromas.includes(chromas[previousMelodyNoteIndex])) {
          // Check if the note is on the lower octave
          let octave = previousMelodyOctave;
          if (previousMelodyNoteIndex - chromaIndex <= 0) {
            octave--;
          }
          nearNotes.push(chromas[previousMelodyNoteIndex] + String(octave));
        } else {
          break;
        }
      }
    }

    // If the previous melody note is bordered by two notes from the harmony chord
    // then no near note can be obtained and there are no returned near notes

    return nearNotes;
  }

  private pickInpassingNote(harmonyChord: PlacedChord, previousMelodyChroma: string, previousMelodyOctave: number): string | undefined {
    // Randomly pick a note from the near ones
    const nearNotes: Array<string> = this.getInpassingNearNotes(harmonyChord, previousMelodyChroma, previousMelodyOctave);
    if (nearNotes.length > 0) {
      const nearNoteIndex: number = this.commonService.getRandomIntegerBetween(0, nearNotes.length - 1);
      return nearNotes[nearNoteIndex];
    } else {
      return undefined;
    }
  }

  // Get a note from the source chord that is near the previous melody note
  // The octave remains the same as the one from the source chord
  private getNearNotesFromSourceChord(harmonyChord: PlacedChord, previousMelodyChroma: string, previousMelodyOctave: number): Array<[string, number]> {
    const nearNoteChromas: Array<[string, number]> = new Array<[string, number]>();
    const harmonyChordSortedChromas: Array<string> = harmonyChord.getSortedNotesChromas();
    let tonalityChromas: Array<string> = this.getTonalityChromas(harmonyChord.tonality.range, harmonyChord.tonality.firstChroma);
    const previousMelodyNoteIndex: number = tonalityChromas.indexOf(previousMelodyChroma);
    if (previousMelodyNoteIndex < 0) {
      throw new Error('The previous melody chroma ' + previousMelodyChroma + ' could not be found in the tonality ' + tonalityChromas);
    }

    // The maximum near distance to consider
    const NEAR_MAX: number = 2; // TODO Have this constant as a settings

    for (let noteIndex = 0; noteIndex < harmonyChordSortedChromas.length; noteIndex++) {
      const harmonyChordChroma: string = harmonyChordSortedChromas[noteIndex];
      // Avoid the previous chroma
      if (harmonyChordChroma != previousMelodyChroma) {
        if (Math.abs(tonalityChromas.indexOf(harmonyChordChroma) - previousMelodyNoteIndex) <= NEAR_MAX) {
          nearNoteChromas.push([harmonyChordChroma, previousMelodyOctave]);
        }
      }
    }

    // If no note was near enough to be added then use the previous note
    if (nearNoteChromas.length == 0) {
      nearNoteChromas.push([previousMelodyChroma, previousMelodyOctave]);
    }

    return nearNoteChromas;
  }

  // Pick a melody note from the harmony chord that is near the previous melody note
  private pickNearNoteFromSourceChord(harmonyChord: PlacedChord, previousMelodyChroma: string | undefined, previousMelodyOctave: number): [string, number] {
    const harmonyChordSortedChromas: Array<string> = harmonyChord.getSortedNotesChromas();
    if (previousMelodyChroma) {
      const nearNotes: Array<[string, number]> = this.getNearNotesFromSourceChord(harmonyChord, previousMelodyChroma, previousMelodyOctave);
      const nearNoteIndex: number = this.commonService.getRandomIntegerBetween(0, nearNotes.length - 1);
      return nearNotes[nearNoteIndex];
    } else {
      // If no previous note then pick any note from the source chord
      const chordNoteIndex: number = this.commonService.getRandomIntegerBetween(0, harmonyChordSortedChromas.length - 1);
      return [harmonyChordSortedChromas[chordNoteIndex], previousMelodyOctave];
    }
  }

  private getTonalityChromas(noteRange: NOTE_RANGE, rangeFirstNote: string): Array<string> {
    const tonality: Array<string> = new Array();
    const noteRangeIntervals: Array<number> | undefined = NOTE_RANGE_INTERVALS.get(noteRange);
    if (noteRangeIntervals) {
      tonality.push(rangeFirstNote);
      let chromas: Array<string> = HALF_TONE_CHROMAS;
      let index: number = chromas.indexOf(rangeFirstNote);
      for (let i = 0; i < noteRangeIntervals.length - 1; i++) {
        for (var j = 0; j < noteRangeIntervals[i] / HALF_TONE; j++) {
          chromas = this.createArrayShiftOnceLeft(chromas);
        }
        tonality.push(chromas[index]);
      }
    }
    return tonality;
  }

  private getFirstMeasureTonality(): Tonality {
    const firstChromaIndex: number = this.settingsService.getSettings().generateTonality;
    const firstChroma: string = HALF_TONE_CHROMAS[firstChromaIndex];
    return new Tonality(NOTE_RANGE.MAJOR, firstChroma);
  }

  // Get the chromas of a tonality selected randomly among a given range
  // TODO Add two parameters, the previous chord base note and the previous previous chord base note
  // private getRandomTonalityChromas(previousChroma: string, precedingPreviousChroma: string): Array<string> {
  private getRandomTonality(): Tonality {
    const randomChromaIndex: number = this.commonService.getRandomIntegerBetween(0, HALF_TONE_CHROMAS.length);
    const randomRangeIndex: number = this.commonService.getRandomIntegerBetween(0, 2); // TODO Hard coded value
    const chroma: string = HALF_TONE_CHROMAS[randomChromaIndex];
    if (randomRangeIndex == 0) {
      return new Tonality(NOTE_RANGE.MAJOR, chroma);
    } else {
      return new Tonality(NOTE_RANGE.MINOR_NATURAL, chroma);
    }
  }

  // The modulation by a randomised pick of another tonality can be tuned by a setting
  private withModulation(): boolean {
    const modulation: number = this.settingsService.getSettings().generateModulation;
    if (modulation > 0) {
      const randomModulation: number = this.commonService.getRandomIntegerBetween(0, 100);
      if (randomModulation < modulation) {
        return true;
      }
    }
    return false;
  }

  // // Select randomly a chroma among the possible chromas
  // private getRandomTonalityFirstChroma(): string {
  //   const random: number = this.commonService.getRandomIntegerBetween(0, HALF_TONE_INTERVAL_NOTES.length);
  //   return HALF_TONE_INTERVAL_NOTES[random];
  // } TODO

  private generateMelodyChords(harmonyMeasures: Array<Measure>, randomMethod: number, octave: number, chordDuration: number, velocity: number): Array<PlacedChord> {
    const melodyChords: Array<PlacedChord> = new Array();
    let placedChordIndex: number = 0;

    harmonyMeasures.forEach((measure: Measure) => {
      measure.getSortedChords().forEach((harmonyChord: PlacedChord) => {
        const previousMelodyChord: PlacedChord | undefined = melodyChords.length > 0 ? melodyChords[melodyChords.length - 1] : undefined;
        const melodyChordsForOneHarmonyChord: Array<PlacedChord> = this.generateTwoMelodyChordsForOneHarmonyChord(placedChordIndex, previousMelodyChord, harmonyChord, randomMethod, octave, chordDuration, velocity);
        for (let i: number = 0; i < melodyChordsForOneHarmonyChord.length; i++) {
          melodyChords.push(melodyChordsForOneHarmonyChord[i]);
          placedChordIndex++;
        }
      });
    });
    this.notationService.addEndOfTrackNote(melodyChords);
    return melodyChords;
  }

  private generateTwoMelodyChordsForOneHarmonyChord(placedChordIndex: number, previousMelodyChord: PlacedChord | undefined, harmonyChord: PlacedChord, randomMethod: number, octave: number, chordDuration: number, velocity: number): Array<PlacedChord> {
    const melodyChords: Array<PlacedChord> = new Array();
    let currentMelodyChroma: string | undefined = previousMelodyChord ? previousMelodyChord.renderFirstNoteChroma() : undefined;
    let currentMelodyOctave: number = previousMelodyChord ? previousMelodyChord.renderFirstNoteOctave() : octave;

    if (!this.notationService.isEndOfTrackPlacedChord(harmonyChord)) {
      if (RANDOM_METHOD.HARMONY_BASE == randomMethod) {
        // For each source chord of the harmony track, there are two single note chords of half duration in the melody track
        // The first melody note is one of the source chord, and the second melody note is also a note from the same source chord or an inpassing note
        // An inpassing note is one that is not in the source chord but that is between the previous melody note and another note of the source chord even if of another octave
        // So an inpassing note cannot be followed by another inpassing note, but a source chord note can be followed by another source chord note
        // A melody note of a source chord must also be near the previous melody note

        // Get one of the source chord notes
        const [firstMelodyChroma, firstMelodyOctave]: [string, number] = this.pickNearNoteFromSourceChord(harmonyChord, currentMelodyChroma, currentMelodyOctave);
        currentMelodyChroma = firstMelodyChroma;
        currentMelodyOctave = firstMelodyOctave;
        // The duration is a quotient base and is thus multiplied by 2 to cut it in half
        const halfDuration: number = chordDuration * 2;
        let placedChord: PlacedChord = this.createNotesAndPlacedChord(currentMelodyOctave, halfDuration, velocity, harmonyChord.tonality, placedChordIndex, [firstMelodyChroma]);
        melodyChords.push(placedChord);

        let inpassingTextNote: string | undefined;
        if (this.fromInpassingNote()) {
          inpassingTextNote = this.pickInpassingNote(harmonyChord, currentMelodyChroma, currentMelodyOctave);
        }

        if (inpassingTextNote) {
          const [inpassingNoteChroma, inpassingNoteOctave]: [string, number] = this.notationService.noteToChromaOctave(inpassingTextNote);
          placedChord = this.createNotesAndPlacedChord(inpassingNoteOctave, halfDuration, velocity, harmonyChord.tonality, placedChordIndex + 1, [inpassingNoteChroma]);
          melodyChords.push(placedChord);
        } else {
          // Get one of the source chord notes even the already picked one
          const [secondMelodyChroma, secondMelodyOctave]: [string, number] = this.pickNearNoteFromSourceChord(harmonyChord, currentMelodyChroma, currentMelodyOctave);
          if (secondMelodyChroma == firstMelodyChroma && secondMelodyOctave == firstMelodyOctave) {
            // If the second note is the same as the fisrt one then have only one chord
            // but with a duration that is twice as long
            melodyChords[melodyChords.length - 1].duration = this.notationService.createDuration(chordDuration, TempoUnit.DUPLE);
          } else {
            placedChord = this.createNotesAndPlacedChord(secondMelodyOctave, halfDuration, velocity, harmonyChord.tonality, placedChordIndex + 1, [secondMelodyChroma]);
            melodyChords.push(placedChord);
          }
        }
      } else {
        // Get the first note of the source chord notes
        const melodyChroma: string = harmonyChord.renderFirstNoteChroma();
        const placedChord: PlacedChord = this.createNotesAndPlacedChord(octave, chordDuration, velocity, harmonyChord.tonality, placedChordIndex, [melodyChroma]);
        melodyChords.push(placedChord);
      }
    }
    return melodyChords;
  }

  private generateHarmonyChords(octave: number, chordDuration: number, velocity: number): Array<PlacedChord> {
    const placedChords: Array<PlacedChord> = new Array();
    let placedChordIndex: number = 0;
    let previousChord: PlacedChord | undefined;

    const tonality: Tonality = this.getFirstMeasureTonality();

    const generateNbChords: number = this.settingsService.getSettings().generateNbChords > 0 ? this.settingsService.getSettings().generateNbChords : 1;
    while (placedChordIndex < generateNbChords) {
      const oneOrTwoHarmonyChords: Array<PlacedChord> = this.generateOneOrTwoHarmonyChords(placedChordIndex, tonality, octave, chordDuration, velocity, previousChord);
      for (let i: number = 0; i < oneOrTwoHarmonyChords.length; i++) {
        placedChords.push(oneOrTwoHarmonyChords[i]);
        placedChordIndex++;
        previousChord = oneOrTwoHarmonyChords[i];
      }
    }
    this.notationService.addEndOfTrackNote(placedChords);
    return placedChords;
  }

  private generateHarmonyChordInMeasures(octave: number, chordDuration: number, velocity: number): Array<Measure> {
    let measureIndex: number = 0;
    const measures: Array<Measure> = new Array<Measure>();
    let measure: Measure = this.createMeasure(measureIndex);
    measure.placedChords = new Array<PlacedChord>();
    measures.push(measure);

    const placedChords: Array<PlacedChord> = new Array();
    let chordIndex: number = 0;
    let measureChordIndex: number = 0;
    let previousChord: PlacedChord | undefined;

    let tonality: Tonality = this.getFirstMeasureTonality();

    const generateNbChords: number = this.settingsService.getSettings().generateNbChords > 0 ? this.settingsService.getSettings().generateNbChords : 1;
    while (chordIndex < generateNbChords) {
      const oneOrTwoHarmonyChords: Array<PlacedChord> = this.generateOneOrTwoHarmonyChords(chordIndex, tonality, octave, chordDuration, velocity, previousChord);
      for (let i: number = 0; i < oneOrTwoHarmonyChords.length; i++) {
        // The number of beats of the chords placed in a measure must equal the number of beats of the measure
        oneOrTwoHarmonyChords[i].index = measureChordIndex;
        chordIndex++;
        measureChordIndex++;
        previousChord = oneOrTwoHarmonyChords[i];
        if (measure.getPlacedChordsNbBeats() >= measure.getNbBeats()) {
          measures.push(measure);
          measure = this.createMeasure(measureIndex);
          measure.placedChords = new Array<PlacedChord>();
          measureIndex++;
          measureChordIndex = 0;
        }
        measure.placedChords.push(oneOrTwoHarmonyChords[i]);
      }
    }
    this.notationService.addEndOfTrackNote(placedChords);

    return measures;
  }

  private generateOneOrTwoHarmonyChords(placedChordIndex: number, tonality: Tonality, octave: number, chordDuration: number, velocity: number, previousChord: PlacedChord | undefined): Array<PlacedChord> {
    const placedChords: Array<PlacedChord> = new Array();

    let previousChordSortedChromas: Array<string> = previousChord ? previousChord.getSortedNotesChromas() : [];
    const firstNoteChroma: string | undefined = previousChord ? previousChord.renderFirstNoteChroma() : undefined;
    const tonalityChromas: Array<string> = this.getTonalityChromas(tonality.range, tonality.firstChroma);

    const chromas: Array<string> = this.buildChromas(tonalityChromas, firstNoteChroma);

    // Consider a chord only if it is similar to its previous one
    if (!previousChord || this.isSimilarToPrevious(previousChordSortedChromas, chromas)) {
      const placedChord: PlacedChord = this.createNotesAndPlacedChord(octave, chordDuration, velocity, tonality, placedChordIndex, chromas);
      placedChords.push(placedChord);
      placedChordIndex++;
      // Add twice the same chord
      if (this.settingsService.getSettings().generateDoubleChord) { // TODO Should we keep this ? Ask Norbert.
        const placedChordBis: PlacedChord = this.createNotesAndPlacedChord(octave, chordDuration, velocity, tonality, placedChordIndex + 1, chromas);
        placedChords.push(placedChordBis);
      }
    } else {
      // If the current chord is too dissimilar from its previous one
      // then create a chord from a reversing of the previous one
      if (this.settingsService.getSettings().generateReverseDissimilarChord) {
        const slidedNotes: Array<string> = this.createShiftedChord(previousChordSortedChromas);
        const placedChord: PlacedChord = this.createNotesAndPlacedChord(octave, chordDuration, velocity, tonality, placedChordIndex, slidedNotes);
        placedChords.push(placedChord);
      }
    }
    // if (this.withModulation()) { // TODO Move this where there comes a new measure
    //   const randomTtonality: Tonality = this.getRandomTonality();
    //   let tonalityChromas: Array<string> = this.getTonalityChromas(randomTtonality.range, randomTtonality.firstChroma);
    //   // TODO We also need to have no previous chord
    // }
    return placedChords;
  }

  private buildChromas(tonalityChromas: Array<string>, previousBaseChroma?: string): Array<string> {
    const chromas: Array<string> = new Array();
    const shiftedChromas: Array<Array<string>> = this.getTonalityShiftedChromas(tonalityChromas);

    let chromaIndex: number;
    if (previousBaseChroma) {
      chromaIndex = this.randomlyPickChromaFromTonalityBonuses(tonalityChromas, previousBaseChroma);
    } else {
      chromaIndex = this.randomlyPickChromaFromTonality(tonalityChromas);
    }

    for (let noteIndex = 0; noteIndex < this.settingsService.getSettings().generateChordWidth; noteIndex++) {
      chromas.push(shiftedChromas[noteIndex][chromaIndex]);
    }
    return chromas;
  }

  // Convert the chroma to its index in the tonality TODO Remove
  // private tonalityChromaToIndex(tonalityChromas: Array<string>, chroma: string): number {
  //   for (let index = 0; index < tonalityChromas.length; index++) {
  //     if (tonalityChromas[index] == chroma) {
  //       return index;
  //     }
  //   }
  //   throw new Error('The chroma could not be found in the tonality ' + tonalityChromas);
  // }

  private randomlyPickChromaFromTonality(tonalityChromas: Array<string>): number {
    return this.commonService.getRandomIntegerBetween(0, tonalityChromas.length - 1);
  }

  // Based on the previous chroma bonuses pick one chroma
  private randomlyPickChromaFromTonalityBonuses(tonalityChromas: Array<string>, previousChroma: string): number {
    // The higher the randomliness, the more random the selection
    const RANDOMLINESS: number = 0; // TODO Maybe have a settings
    const MIN_BONUS: number = 3; // TODO Maybe have a settings

    const previousChromaIndex: number = tonalityChromas.indexOf(previousChroma);
    if (previousChromaIndex < 0) {
      throw new Error('The tonality does not contain the chroma ' + previousChroma);
    }
    const chromaBonuses: Array<number> = this.getChromaBonuses(previousChromaIndex);
    const electedChromas: Array<number> = new Array();
    for (let index = 0; index < chromaBonuses.length; index++) {
      let chromaBonus: number = chromaBonuses[index];
      // If a minimum bonus is specified then do not consider the chromas that have a lower bonus
      if ((MIN_BONUS > 0 && chromaBonus >= MIN_BONUS) || 0 === MIN_BONUS) {
        chromaBonus += RANDOMLINESS;
        for (let nb = 0; nb < chromaBonus; nb++) {
          // Thanks to the matrix being mirror like, the chroma is retrieved from the bonus index in the keys array
          electedChromas.push(index);
        }
      }
    }

    // Pick one chroma from the elected ones
    const randomChromaIndex: number = this.commonService.getRandomIntegerBetween(0, electedChromas.length - 1);
    return electedChromas[randomChromaIndex];
  }

  // Get all the possible bonuses for one chroma
  private getChromaBonuses(chromaIndex: number): Array<number> {
    const bonuses: Array<number> | undefined = this.getBonusTable()[chromaIndex];
    if (bonuses) {
      return bonuses;
    } else {
      throw new Error('Unknown bonuses for the chroma: ' + chromaIndex);
    }
  }

  // The table of bonus per chroma
  // For a given chroma there is a series of bonus numbers
  // A bonus represents the level of harmony between a chroma and its following chroma
  // private getBonusTable(): Map<string, Array<number>> {
  //   const bonuses: Map<string, Array<number>> = new Map([
  //     [ 'C', [ 30, 0, 15, 5, 5, 10, 0 ] ],
  //     [ 'D', [ 0, 30, 0, 10, 0, 5, 10 ] ],
  //     [ 'E', [ 15, 0, 30, 0, 10, 0, 0 ] ],
  //     [ 'F', [ 5, 10, 0, 30, 0, 15, 0 ] ],
  //     [ 'G', [ 5, 0, 10, 0, 30, 0, 10 ] ],
  //     [ 'A', [ 10, 5, 0, 15, 0, 30, 0 ] ],
  //     [ 'B', [ 0, 10, 0, 0, 10, 0, 30 ] ]
  //   ]);
  //   return bonuses;
  // }
  private getBonusTable(): Array<Array<number>> {
    const bonuses: Array<Array<number>> = new Array(
      [ 30, 0, 15, 5, 5, 10, 0 ],
      [ 0, 30, 0, 10, 0, 5, 10 ],
      [ 15, 0, 30, 0, 10, 0, 0 ],
      [ 5, 10, 0, 30, 0, 15, 0 ],
      [ 5, 0, 10, 0, 30, 0, 10 ],
      [ 10, 5, 0, 15, 0, 30, 0 ],
      [ 0, 10, 0, 0, 10, 0, 30 ]
    );
    return bonuses;
  }

}
