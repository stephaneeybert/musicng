import { Injectable } from '@angular/core';
import { Measure } from '@app/model/measure/measure';
import { NotationService } from './notation.service';
import { PlacedChord } from '@app/model/note/placed-chord';
import { SoundtrackService } from '@app/views/soundtrack/soundtrack.service';
import { TranslateService } from '@ngx-translate/core';
import { Soundtrack } from '@app/model/soundtrack';
import { TempoUnit } from '@app/model/tempo-unit';
import { Track } from '@app/model/track';
import { CommonService } from '@stephaneeybert/lib-core';
import { SettingsService } from '@app/views/settings/settings.service';
import { NOTE_RANGE, TRACK_TYPES, CHROMAS_MAJOR, CHROMAS_MINOR, NOTE_NEAR_MAX } from './notation.constant ';
import { Tonality } from '@app/model/note/tonality';
import { Note } from '@app/model/note/note';

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

    const octave: number = this.settingsService.getSettings().generateNoteOctave;
    const chordDuration: number = this.settingsService.getSettings().generateChordDuration;
    const harmonyVelocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityHarmony);
    const harmonyMeasures: Array<Measure> = this.generateHarmonyChordInMeasures(octave, chordDuration, harmonyVelocity);

    if (this.settingsService.getSettings().generateMelody) {
      const melodyVelocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityMelody);
      const melodyChords: Array<PlacedChord> = this.generateMelodyChords(harmonyMeasures, octave, chordDuration, melodyVelocity);
      const melodyMeasures: Array<Measure> = this.createMeasures(melodyChords);

      const melodyTrack: Track = soundtrack.addTrack(melodyMeasures);
      melodyTrack.name = this.getTrackName(TRACK_TYPES.MELODY);
    }

    if (this.settingsService.getSettings().generateHarmony) {
      const harmonyTrack: Track = soundtrack.addTrack(harmonyMeasures);
      harmonyTrack.name = this.getTrackName(TRACK_TYPES.HARMONY);
      harmonyTrack.displayChordNames = true;
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

  private createArrayShiftOnceRight(items: Array<string>): Array<string> {
    // Make a deep copy
    let shiftedItems: Array<string> = new Array();
    items.forEach((chroma: string) => {
      shiftedItems.push(chroma);
    });

    // Shift the copy and not the original
    const item: string | undefined = shiftedItems.pop();
    if (item) {
      shiftedItems.unshift(item);
    } else {
      throw new Error('The array could not be shifted right');
    }
    return shiftedItems;
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

  // The randomised pick between a harmony chord note or an inpassing note can be tuned by a setting
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
  // An inpassing note is one that is not in the harmony chord but that
  // is between the previous melody note and another note of the harmony chord
  // even if of another octave
  private getInpassingNearNotes(harmonyChord: PlacedChord, previousMelodyChroma: string, previousMelodyOctave: number): Array<string> {
    const nearNotes: Array<string> = new Array<string>();
    const harmonyChordSortedChromas: Array<string> = harmonyChord.getSortedNotesChromas();

    const tonalityChromas: Array<string> = this.notationService.getTonalityChromas(harmonyChord.tonality.range, harmonyChord.tonality.firstChroma);
    const previousMelodyNoteIndex: number = tonalityChromas.indexOf(previousMelodyChroma);

    if (previousMelodyNoteIndex < 0) {
      throw new Error('The previous melody chroma ' + previousMelodyChroma + ' could not be found in the tonality ' + tonalityChromas);
    }

    let chromas: Array<string> = tonalityChromas;

    // Consider the chromas above the previous melody note chroma
    if (previousMelodyOctave <= this.notationService.getFirstChordNoteSortedByIndex(harmonyChord).renderOctave()) {
      // The maximum distance to consider for a note to be near enough
      for (let chromaIndex: number = 0; chromaIndex < NOTE_NEAR_MAX; chromaIndex++) {
        chromas = this.notationService.createArrayShiftOnceLeft(chromas);
        // Consider only notes before the next harmony chord note
        if (!harmonyChordSortedChromas.includes(chromas[previousMelodyNoteIndex])) {
          // Check if the note is on the upper octave
          let octave: number = previousMelodyOctave;
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
    if (previousMelodyOctave >= this.notationService.getFirstChordNoteSortedByIndex(harmonyChord).renderOctave()) {
      chromas = tonalityChromas;
      // The maximum distance to consider for a note to be near enough
      for (let chromaIndex: number = 0; chromaIndex < NOTE_NEAR_MAX; chromaIndex++) {
        chromas = this.createArrayShiftOnceRight(chromas);
        // Consider only notes before the next harmony chord note
        if (!harmonyChordSortedChromas.includes(chromas[previousMelodyNoteIndex])) {
          // Check if the note is on the lower octave
          let octave: number = previousMelodyOctave;
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

  // Get a note from the harmony chord that is near the previous melody note
  // The octave remains the same as the one from the harmony chord
  private getNearNotesFromSourceChord(harmonyChord: PlacedChord, previousMelodyChroma: string, previousMelodyOctave: number): Array<[string, number]> {
    const nearNoteChromas: Array<[string, number]> = new Array<[string, number]>();
    const harmonyChordNotes: Array<Note> = harmonyChord.getNotesSortedByIndex();
    let tonalityChromas: Array<string> = this.notationService.getTonalityChromas(harmonyChord.tonality.range, harmonyChord.tonality.firstChroma);
    const previousMelodyNoteIndex: number = tonalityChromas.indexOf(previousMelodyChroma);

    // If the previous note was from a different tonality and is thus not found in the new tonality
    // then pick any note from the harmony chord
    if (previousMelodyNoteIndex < 0) {
      const chordNoteIndex: number = this.commonService.getRandomIntegerBetween(0, harmonyChordNotes.length - 1);
      const pickedChordNote: Note = harmonyChordNotes[chordNoteIndex];
      nearNoteChromas.push([pickedChordNote.renderChroma(), pickedChordNote.renderOctave()]);
    } else {
      for (let noteIndex = 0; noteIndex < harmonyChordNotes.length; noteIndex++) {
        const harmonyChordNote: Note = harmonyChordNotes[noteIndex];
        const harmonyChordChroma: string = harmonyChordNote.renderChroma();
        const harmonyChordOctave: number = harmonyChordNote.renderOctave();
        // Avoid the previous chroma
        if (harmonyChordChroma != previousMelodyChroma) {
          // The maximum distance to consider for a note to be near enough
          if (this.notationService.getChromasDistance(previousMelodyChroma, previousMelodyOctave, harmonyChordChroma, harmonyChordOctave, tonalityChromas) < NOTE_NEAR_MAX) {
            nearNoteChromas.push([harmonyChordChroma, harmonyChordNote.renderOctave()]);
          }
        }
      }

      // If no note was near enough to be added then reuse the previous note
      if (nearNoteChromas.length == 0) {
        nearNoteChromas.push([previousMelodyChroma, previousMelodyOctave]);
      }
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
      // If no previous note then pick any note from the harmony chord
      const chordNoteIndex: number = this.commonService.getRandomIntegerBetween(0, harmonyChordSortedChromas.length - 1);
      return [harmonyChordSortedChromas[chordNoteIndex], previousMelodyOctave];
    }
  }

  private getFirstMeasureTonality(): Tonality {
    const firstChroma: string = this.settingsService.getSettings().generateTonality;
    // The tonality of the first measure must be a major one
    if (!CHROMAS_MAJOR.includes(firstChroma)) {
      throw new Error('The setting for the tonality of the first measure is not a major one');
    }
    console.log('Start with first chroma: ' + firstChroma);
    return new Tonality(NOTE_RANGE.MAJOR, firstChroma);
  }

  private getTonalitiesContainingChordNames(range: NOTE_RANGE, previousPreviousChordName: string, previousChordName: string): Array<Tonality> {
    const tonalities: Array<Tonality> = new Array();
    const halfTones: Array<string> = (range == NOTE_RANGE.MAJOR) ? CHROMAS_MAJOR : CHROMAS_MINOR;
    for (let i: number = 0; i < halfTones.length; i++) {
      const chroma: string = halfTones[i];
      const tonalityChordNames: Array<string> = this.notationService.getTonalityChordNames(range, chroma);
      if (tonalityChordNames.includes(previousPreviousChordName) && tonalityChordNames.includes(previousChordName)) {
        tonalities.push(new Tonality(range, chroma));
      }
    }
    return tonalities;
  }

  // Get a tonality selected randomly among ones that include two previous chords
  private getSibblingTonality(previousPreviousChord: PlacedChord | undefined, previousChord: PlacedChord | undefined): Tonality {
    const onlyMajor: boolean = this.settingsService.getSettings().generateOnlyMajorTonalities;
    const dontRepeat: boolean = true;
    if (previousPreviousChord && previousChord) {
      let tonalities: Array<Tonality> = new Array();
      const previousChordName: string = this.notationService.getChordIntlName(previousChord);
      const previousPreviousChordName: string = this.notationService.getChordIntlName(previousPreviousChord);
      tonalities = tonalities.concat(this.getTonalitiesContainingChordNames(NOTE_RANGE.MAJOR, previousPreviousChordName, previousChordName));
      if (!onlyMajor) {
        tonalities = tonalities.concat(this.getTonalitiesContainingChordNames(NOTE_RANGE.MINOR_NATURAL, previousPreviousChordName, previousChordName));
      }
      if (dontRepeat && tonalities.length > 1) {
        this.stripTonality(tonalities, previousChord.tonality);
      }
      // There must always be at least one tonality that includes the two previous chords
      if (tonalities.length == 0) {
        throw new Error('No tonality could be found as sibbling to the two previous chords ' + previousPreviousChordName + ' and ' + previousChordName);
      }
      return tonalities[this.commonService.getRandomIntegerBetween(0, tonalities.length - 1)];
    } else {
      // If no previous chord is specified then randomly pick a tonality
      return this.getRandomTonality(undefined, onlyMajor, dontRepeat);
    }
  }

  private stripTonality(tonalities: Array<Tonality>, previousTonality: Tonality | undefined): void {
    if (previousTonality) {
      let index: number = tonalities.findIndex(tonality => tonality.firstChroma === previousTonality.firstChroma);
      if (index != -1) {
        tonalities.splice(index, 1);
      }
    }
  }

  private stripTonalityChroma(tonalityChromas: Array<string>, previousTonality: Tonality | undefined, dontRepeat: boolean): Array<string> {
    let deepCopy: Array<string> = new Array();
    tonalityChromas.forEach((chroma: string) => {
      deepCopy.push(chroma);
    });

    if (previousTonality && dontRepeat) {
      let index: number = deepCopy.findIndex(chroma => chroma === previousTonality.firstChroma);
      if (index != -1) {
        deepCopy.splice(index, 1);
      }
    }

    return deepCopy;
  }

  private getRandomTonality(previousTonality: Tonality | undefined, onlyMajor: boolean, dontRepeat: boolean): Tonality {
    if (!onlyMajor) {
      const randomRangeIndex: number = this.commonService.getRandomIntegerBetween(0, 1);
      if (randomRangeIndex == 0) {
        const tonalityChromas = this.stripTonalityChroma(CHROMAS_MAJOR, previousTonality, dontRepeat);
        const randomChromaIndex: number = this.commonService.getRandomIntegerBetween(0, tonalityChromas.length - 1);
        const chroma: string = tonalityChromas[randomChromaIndex];
        return new Tonality(NOTE_RANGE.MAJOR, chroma);
      } else {
        const tonalityChromas = this.stripTonalityChroma(CHROMAS_MINOR, previousTonality, dontRepeat);
        const randomChromaIndex: number = this.commonService.getRandomIntegerBetween(0, tonalityChromas.length - 1);
        const chroma: string = tonalityChromas[randomChromaIndex];
        return new Tonality(NOTE_RANGE.MINOR_NATURAL, chroma);
      }
    } else {
      const tonalityChromas = this.stripTonalityChroma(CHROMAS_MAJOR, previousTonality, dontRepeat);
      const randomChromaIndex: number = this.commonService.getRandomIntegerBetween(0, tonalityChromas.length - 1);
      const chroma: string = tonalityChromas[randomChromaIndex];
      return new Tonality(NOTE_RANGE.MAJOR, chroma);
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

  private generateMelodyChords(harmonyMeasures: Array<Measure>, octave: number, chordDuration: number, velocity: number): Array<PlacedChord> {
    const melodyChords: Array<PlacedChord> = new Array();
    let placedChordIndex: number = 0;

    harmonyMeasures.forEach((measure: Measure) => {
      measure.getSortedChords().forEach((harmonyChord: PlacedChord) => {
        const previousMelodyChord: PlacedChord | undefined = melodyChords.length > 0 ? melodyChords[melodyChords.length - 1] : undefined;
        const melodyChordsForOneHarmonyChord: Array<PlacedChord> = this.generateTwoMelodyChordsForOneHarmonyChord(placedChordIndex, previousMelodyChord, harmonyChord, octave, chordDuration, velocity);
        for (let i: number = 0; i < melodyChordsForOneHarmonyChord.length; i++) {
          melodyChords.push(melodyChordsForOneHarmonyChord[i]);
          placedChordIndex++;
        }
      });
    });
    this.notationService.addEndOfTrackNote(melodyChords);
    return melodyChords;
  }

  private generateTwoMelodyChordsForOneHarmonyChord(placedChordIndex: number, previousMelodyChord: PlacedChord | undefined, harmonyChord: PlacedChord, octave: number, chordDuration: number, velocity: number): Array<PlacedChord> {
    const melodyChords: Array<PlacedChord> = new Array();
    let currentMelodyChroma: string | undefined = previousMelodyChord ? this.notationService.getFirstChordNoteSortedByIndex(previousMelodyChord).renderChroma() : undefined;
    let currentMelodyOctave: number = previousMelodyChord ? this.notationService.getFirstChordNoteSortedByIndex(previousMelodyChord).renderOctave() : octave;

    if (!this.notationService.isEndOfTrackPlacedChord(harmonyChord)) {
      // For each harmony chord of the harmony track, there are two single note chords of half duration in the melody track
      // The first melody note is one of the harmony chord, and the second melody note is also a note from the same harmony chord or an inpassing note
      // An inpassing note is one that is not in the harmony chord but that is between the previous melody note and another note of the harmony chord even if of another octave
      // So an inpassing note cannot be followed by another inpassing note, but a harmony chord note can be followed by another harmony chord note
      // A melody note of a harmony chord must also be near the previous melody note

      // Get one of the harmony chord notes
      const [firstMelodyChroma, firstMelodyOctave]: [string, number] = this.pickNearNoteFromSourceChord(harmonyChord, currentMelodyChroma, currentMelodyOctave);
      currentMelodyChroma = firstMelodyChroma;
      currentMelodyOctave = firstMelodyOctave;
      // The duration is a quotient base and is thus multiplied by 2 to cut it in half
      const halfDuration: number = chordDuration * 2;
      let placedChord: PlacedChord = this.notationService.createNotesAndPlacedChord(currentMelodyOctave, halfDuration, velocity, harmonyChord.tonality, placedChordIndex, [firstMelodyChroma]);
      melodyChords.push(placedChord);

      let inpassingTextNote: string | undefined;
      if (this.fromInpassingNote()) {
        inpassingTextNote = this.pickInpassingNote(harmonyChord, currentMelodyChroma, currentMelodyOctave);
      }

      if (inpassingTextNote) {
        const [inpassingNoteChroma, inpassingNoteOctave]: [string, number] = this.notationService.noteToChromaOctave(inpassingTextNote);
        placedChord = this.notationService.createNotesAndPlacedChord(inpassingNoteOctave, halfDuration, velocity, harmonyChord.tonality, placedChordIndex + 1, [inpassingNoteChroma]);
        melodyChords.push(placedChord);
      } else {
        // Get one of the harmony chord notes even the already picked one
        const [secondMelodyChroma, secondMelodyOctave]: [string, number] = this.pickNearNoteFromSourceChord(harmonyChord, currentMelodyChroma, currentMelodyOctave);
        // If the second note is the same as the fisrt one then have only one chord
        // but with a duration that is twice as long
        if (secondMelodyChroma == firstMelodyChroma && secondMelodyOctave == firstMelodyOctave) {
          melodyChords[melodyChords.length - 1].duration = this.notationService.createDuration(chordDuration, TempoUnit.NOTE);
        } else {
          placedChord = this.notationService.createNotesAndPlacedChord(secondMelodyOctave, halfDuration, velocity, harmonyChord.tonality, placedChordIndex + 1, [secondMelodyChroma]);
          melodyChords.push(placedChord);
        }
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
      const placedChord: PlacedChord | undefined = this.generateHarmonyChord(placedChordIndex, tonality, octave, chordDuration, velocity, previousChord);
      if (placedChord) {
        placedChords.push(placedChord);
        // Add twice the same chord
        if (previousChord && this.settingsService.getSettings().generateDoubleChord) {
          placedChordIndex++;
          if (placedChordIndex < generateNbChords) {
            const clonedChord: PlacedChord = this.notationService.createSameChord(previousChord);
            placedChords.push(clonedChord);
            placedChordIndex++;
          }
        }
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
    let previousPreviousChord: PlacedChord | undefined;
    let previousChord: PlacedChord | undefined;

    let tonality: Tonality = this.getFirstMeasureTonality();

    let harmonyChord: PlacedChord | undefined;
    const generateNbChords: number = this.settingsService.getSettings().generateNbChords > 0 ? this.settingsService.getSettings().generateNbChords : 1;
    while (chordIndex < generateNbChords) {
      previousPreviousChord = previousChord;
      previousChord = harmonyChord;

      // The number of beats of the chords placed in a measure must equal the number of beats of the measure
      if (measure.getPlacedChordsNbBeats() >= measure.getNbBeats()) {
        measure = this.createMeasure(measureIndex);
        measure.placedChords = new Array<PlacedChord>();
        measures.push(measure);
        measureIndex++;
        measureChordIndex = 0;
        if (this.withModulation()) {
          // Do not overwrite the first tonality
          if (chordIndex > 0) {
            const randomTonality: Tonality = this.getSibblingTonality(previousPreviousChord, previousChord);
            tonality = new Tonality(randomTonality.range, randomTonality.firstChroma);
          }
          // Avoid using the bonus table when changing of tonality as no chroma can then be foung
          previousChord = undefined;
        }
      }
      harmonyChord = this.generateHarmonyChord(measureChordIndex, tonality, octave, chordDuration, velocity, previousChord);
      if (harmonyChord) {
        measureChordIndex++;
        chordIndex++;
        measure.placedChords.push(harmonyChord);
        // Add twice the same chord
        if (previousChord && this.settingsService.getSettings().generateDoubleChord) {
          if (chordIndex < generateNbChords && measure.getPlacedChordsNbBeats() < measure.getNbBeats()) {
            const clonedChord: PlacedChord = this.notationService.createSameChord(previousChord);
            placedChords.push(clonedChord);
            measureChordIndex++;
            chordIndex++;
          }
        }
      }
    }
    this.notationService.addEndOfTrackNote(placedChords);

    return measures;
  }

  private generateHarmonyChord(placedChordIndex: number, tonality: Tonality, octave: number, chordDuration: number, velocity: number, previousChord: PlacedChord | undefined): PlacedChord | undefined {
    let previousChordSortedChromas: Array<string> = previousChord ? previousChord.getSortedNotesChromas() : [];
    const previousBaseChroma: string | undefined = previousChord ? this.notationService.getFirstChordNoteSortedByIndex(previousChord).renderChroma() : undefined;

    const chordChromas: Array<string> = this.buildChordChromas(tonality, previousBaseChroma);

    // Consider a chord only if it is similar to its previous one
    if (!previousChord || this.isSimilarToPrevious(previousChordSortedChromas, chordChromas)) {
      return this.notationService.createNotesAndPlacedChord(octave, chordDuration, velocity, tonality, placedChordIndex, chordChromas);
    } else {
      // If the current chord is too dissimilar from its previous one
      // then possibly create a chord from a reversing of the previous one
      if (this.settingsService.getSettings().generateReverseDissimilarChord) {
        const shiftedChromas: Array<string> = this.createShiftedChord(previousChordSortedChromas);
        return this.notationService.createNotesAndPlacedChord(octave, chordDuration, velocity, tonality, placedChordIndex, shiftedChromas);
      }
    }
  }

  private buildChordChromas(tonality: Tonality, previousBaseChroma : string | undefined): Array<string> {
    const chromas: Array<string> = new Array();
    const tonalityChromas: Array<string> = this.notationService.getTonalityChromas(tonality.range, tonality.firstChroma);
    const chordWidth: number = this.settingsService.getSettings().generateChordWidth;
    const shiftedChromas: Array<Array<string>> = this.notationService.getTonalityShiftedChromas(tonalityChromas, chordWidth);

    let chromaIndex: number;
    if (previousBaseChroma) {
      chromaIndex = this.randomlyPickChromaFromTonalityBonuses(tonalityChromas, previousBaseChroma);
    } else {
      chromaIndex = this.randomlyPickFirstChroma(tonalityChromas, tonality);
    }

    for (let noteIndex = 0; noteIndex < chordWidth; noteIndex++) {
      chromas.push(shiftedChromas[noteIndex][chromaIndex]);
    }
    return chromas;
  }

  // Pick a first chroma when there is no previous chord
  private randomlyPickFirstChroma(tonalityChromas: Array<string>, tonality: Tonality): number {
    const chromas: Array<number> = new Array();
    // Pick the chroma within the 0, 2, 4 ones and ignore the others in the tonality of 7 chromas
    chromas.push(0);
    chromas.push(2);
    chromas.push(4);
    const randomIndex: number = this.commonService.getRandomIntegerBetween(0, (chromas.length - 1));
    return chromas[randomIndex];
  }

  // Based on the previous chroma bonuses pick one chroma
  private randomlyPickChromaFromTonalityBonuses(tonalityChromas: Array<string>, previousChroma: string): number {
    // The higher the random value, the less weight has the bonus and thus the more random the choice of a note
    // The lower the random value, the more weight has the bonus and thus the less random the choice of a note
    const BONUS_RANDOMLINESS: number = this.settingsService.getSettings().generateBonusRandom;
    // If a minimum bonus is specified then do not consider the chromas that have a lower bonus
    const BONUS_MIN: number = this.settingsService.getSettings().generateBonusMin;

    const previousChromaIndex: number = tonalityChromas.indexOf(previousChroma);
    if (previousChromaIndex < 0) {
      throw new Error('The tonality does not contain the chroma ' + previousChroma);
    }
    const chromaBonuses: Array<number> = this.getChromaBonuses(previousChromaIndex);
    const electedChromas: Array<number> = new Array();
    for (let index = 0; index < chromaBonuses.length; index++) {
      let chromaBonus: number = chromaBonuses[index];
      if ((BONUS_MIN > 0 && chromaBonus >= BONUS_MIN) || 0 === BONUS_MIN) {
        chromaBonus += BONUS_RANDOMLINESS;
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
  private getBonusTable(): Array<Array<number>> {
    const bonuses: Array<Array<number>> = new Array(
      [0, 0, 15, 5, 5, 10, 0],
      [0, 0, 0, 10, 0, 5, 0],
      [15, 0, 0, 0, 10, 0, 0],
      [5, 10, 0, 0, 0, 15, 0],
      [5, 0, 10, 0, 0, 0, 0],
      [10, 5, 0, 15, 0, 0, 0],
      [0, 10, 0, 0, 10, 0, 0]
    );
    return bonuses;
  }

}
