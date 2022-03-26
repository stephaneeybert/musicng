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
import { NOTE_RANGE, TRACK_TYPES, CHROMAS_MAJOR, CHROMAS_MINOR, NOTE_NEAR_MAX, DEFAULT_TEMPO_BPM } from './notation.constant ';
import { Tonality } from '@app/model/note/tonality';
import { Note } from '@app/model/note/note';
import { MaterialService } from '@app/core/service/material.service';

const TRACK_INDEX_MELODY: number = 0;
const TRACK_INDEX_HARMONY: number = 1;
const TRACK_INDEX_DRUMS: number = 2;
const TRACK_INDEX_BASS: number = 3;

const DEFAULT_TIME_SIGNATURE_NUMERATOR: number = 2;
const DEFAULT_TIME_SIGNATURE_DENOMINATOR: number = 4;
const DEFAULT_VELOCITY: number = 1;

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
    private materialService: MaterialService
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
            measureIndex++;
            measure = this.createMeasure(measureIndex);
            measure.placedChords = new Array<PlacedChord>();
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

  public addDummyMelody(): Soundtrack {
    const endOfTrackNote: string = this.notationService.buildEndOfTrackNote();
    const textMeasures: Array<string> = [
      'C5/8 D5/8 E5/8 F5/8',
      'G5/8 A5/8 B5/8 C6/8',
      'D6/8 E6/8 F6/8 G6/8',
      'A6/8 B6/8 C7/8',
      'C5/8 rest/8 D5/16 C5/16 B4/16 C5/16',
      'E5/8 rest/8 F5/16 E5/16 D#5/16 E5/16',
      'B5/16 A5/16 G#5/16 A5/16 B5/16 A5/16 G#5/16 A5/16',
      'C6/4 A5/8 C6/8',
      'B5/8 A5/8 G5/8 A5/8',
      'B5/8 A5/8 G5/8 A5/8',
      'B5/8 A5/8 G5/8 F#5/8',
      'E5/4' + ' ' + endOfTrackNote];

    const soundtrackName: string = 'Demo soundtrack';
    const measures: Array<Measure> = this.notationService.parseMeasures(textMeasures, DEFAULT_TEMPO_BPM, DEFAULT_TIME_SIGNATURE_NUMERATOR, DEFAULT_TIME_SIGNATURE_DENOMINATOR, DEFAULT_VELOCITY);
    const soundtrack: Soundtrack = this.soundtrackService.createSoundtrack(soundtrackName, soundtrackName);
    const melodyTrack: Track = soundtrack.addTrack(TRACK_INDEX_MELODY, measures);
    melodyTrack.displayChordNames = true;
    this.soundtrackService.add(soundtrack);
    return soundtrack;
  }

  regenerateSoundtrack(soundtrack: Soundtrack): void {
    const harmonyTrack: Track = this.getHarmonyTrack(soundtrack);
    const demoMeasureIndex: number = 1;
    const fromHarmonyMeasure: Measure = harmonyTrack.getSortedMeasures()[demoMeasureIndex];
    const fromHarmonyChordIndex: number = 1;
    const fromHarmonyChord: PlacedChord = fromHarmonyMeasure.getSortedChords()[fromHarmonyChordIndex];
    this.regenerateHarmonyChords(soundtrack, fromHarmonyMeasure, fromHarmonyChord);

    // TODO When regenerating the harmony chords, do we regenerate the melody chords ?
    // TODO Can we have a direction for the harmony track too ? Or is it only for the melody track ?
    const melodyTrack: Track = this.getMelodyTrack(soundtrack);
    const fromMelodyMeasure: Measure = melodyTrack.getSortedMeasures()[demoMeasureIndex];
    const fromMelodyChordIndex: number = fromHarmonyChordIndex * 2;
    const fromMelodyChord: PlacedChord = fromMelodyMeasure.getSortedChords()[fromMelodyChordIndex];
    const directionUp: boolean = false;
    this.regenerateMelodyChords(soundtrack, fromMelodyMeasure, fromMelodyChord, directionUp);

    const message: string = this.translateService.instant('soundtracks.message.regenerated', { name: soundtrack.name });
    this.materialService.showSnackBar(message);
  }

  public generateSoundtrack(): Soundtrack {
    const soundtrack: Soundtrack = this.soundtrackService.createSoundtrack(this.createNewSoundtrackId(), this.createNewSoundtrackName());

    const octave: number = this.settingsService.getSettings().generateNoteOctave;
    const chordDuration: number = this.settingsService.getSettings().generateChordDuration;
    const harmonyVelocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityHarmony);
    const harmonyMeasures: Array<Measure> = this.generateHarmonyChordInMeasures(octave, chordDuration, harmonyVelocity, undefined, undefined, undefined);

    if (this.settingsService.getSettings().generateMelody) {
     this.generateMelodyTrack(soundtrack, harmonyMeasures, octave, chordDuration);
    }

    if (this.settingsService.getSettings().generateHarmony) {
     this.generateHarmonyTrack(soundtrack, harmonyMeasures);
    }

    if (this.settingsService.getSettings().generateDrums) {
      this.generateDrumsTrack(soundtrack);
    }

    if (this.settingsService.getSettings().generateBass) {
      this.generateBassTrack(soundtrack);
    }

    this.soundtrackService.add(soundtrack);

    return soundtrack;
  }

  public getMelodyTrack(soundtrack: Soundtrack): Track {
    return soundtrack.getSortedTracks()[TRACK_INDEX_MELODY];
  }

  public getHarmonyTrack(soundtrack: Soundtrack): Track {
    return soundtrack.getSortedTracks()[TRACK_INDEX_HARMONY];
  }

  public generateMelodyTrack(soundtrack: Soundtrack, harmonyMeasures: Array<Measure>, octave: number, chordDuration: number): void {
    const melodyVelocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityMelody);
    const melodyChords: Array<PlacedChord> = this.generateMelodyChords(harmonyMeasures, octave, chordDuration, melodyVelocity, undefined, undefined, undefined, undefined);
    const melodyMeasures: Array<Measure> = this.createMeasures(melodyChords);

    const melodyTrack: Track = soundtrack.addTrack(TRACK_INDEX_MELODY, melodyMeasures);
    melodyTrack.name = this.getTrackName(TRACK_TYPES.MELODY);
  }

  public regenerateMelodyChords(soundtrack: Soundtrack, fromMeasure: Measure, fromChord: PlacedChord, directionUp: boolean): void {
    const octave: number = this.settingsService.getSettings().generateNoteOctave;
    const chordDuration: number = this.settingsService.getSettings().generateChordDuration;

    const melodyVelocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityMelody);
    const melodyTrack: Track = soundtrack.getSortedTracks()[TRACK_INDEX_MELODY];
    this.deleteStartingFromChord(melodyTrack, fromMeasure, fromChord);
    const harmonyTrack: Track = soundtrack.getSortedTracks()[TRACK_INDEX_HARMONY];
    const melodyChords: Array<PlacedChord> = this.generateMelodyChords(harmonyTrack.getSortedMeasures(), octave, chordDuration, melodyVelocity, melodyTrack, fromMeasure, fromChord, directionUp);
    soundtrack.getSortedTracks()[melodyTrack.index].measures = this.createMeasures(melodyChords);
    this.soundtrackService.storeSoundtrack(soundtrack);
    this.soundtrackService.updateSoundtrack(soundtrack);
  }

  public generateHarmonyTrack(soundtrack: Soundtrack, harmonyMeasures: Array<Measure>): void {
    const harmonyTrack: Track = soundtrack.addTrack(TRACK_INDEX_HARMONY, harmonyMeasures);
    harmonyTrack.name = this.getTrackName(TRACK_TYPES.HARMONY);
    harmonyTrack.displayChordNames = true;
  }

  public regenerateHarmonyChords(soundtrack: Soundtrack, fromMeasure: Measure, fromChord: PlacedChord): void {
    const octave: number = this.settingsService.getSettings().generateNoteOctave;
    const chordDuration: number = this.settingsService.getSettings().generateChordDuration;

    const harmonyVelocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityHarmony);
    const harmonyTrack: Track = soundtrack.getSortedTracks()[1];
    this.deleteStartingFromChord(harmonyTrack, fromMeasure, fromChord);
    soundtrack.getSortedTracks()[harmonyTrack.index].measures = this.generateHarmonyChordInMeasures(octave, chordDuration, harmonyVelocity, harmonyTrack, fromMeasure, fromChord);
    this.soundtrackService.storeSoundtrack(soundtrack);
    this.soundtrackService.updateSoundtrack(soundtrack);
  }

  public generateDrumsTrack(soundtrack: Soundtrack): void {
    const drumsChords: Array<PlacedChord> = new Array();
    const drumsTrack: Track = soundtrack.addTrack(TRACK_INDEX_DRUMS, this.createMeasures(drumsChords));
    drumsTrack.name = this.getTrackName(TRACK_TYPES.DRUMS);
    drumsTrack.displayChordNames = true;
  }

  public generateBassTrack(soundtrack: Soundtrack): void {
    const bassChords: Array<PlacedChord> = new Array();
    const bassTrack: Track = soundtrack.addTrack(TRACK_INDEX_BASS, this.createMeasures(bassChords));
    bassTrack.name = this.getTrackName(TRACK_TYPES.BASS);
    bassTrack.displayChordNames = true;
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
    console.log(tonalityChromas);

    // Consider the chromas above the previous melody note chroma
    if (previousMelodyOctave <= this.notationService.getFirstChordNoteSortedByIndex(harmonyChord).renderOctave()) {
      // The maximum distance to consider for a note to be near enough
// TODO if (this.notationService.getChromasDistance(previousMelodyChroma, previousMelodyOctave, harmonyChordChroma, harmonyChordOctave, tonalityChromas) < NOTE_NEAR_MAX) {
      for (let chromaIndex: number = 0; chromaIndex < NOTE_NEAR_MAX; chromaIndex++) {
        chromas = this.notationService.createArrayShiftOnceLeft(chromas);
        // Consider only notes before the next harmony chord note
        if (!harmonyChordSortedChromas.includes(chromas[previousMelodyNoteIndex])) {
          // Check if the note is on the upper octave
          let octave: number = previousMelodyOctave;
          console.log('Added above in passing note ' + chromas[previousMelodyNoteIndex]);
          if (previousMelodyNoteIndex + chromaIndex + 1 >= tonalityChromas.length) {
            octave++;
            console.log('previousMelodyOctave: ' + previousMelodyOctave + ' octave: ' + octave);
          }
          nearNotes.push(chromas[previousMelodyNoteIndex] + String(octave));
        } else {
          break;
        }
      }
    }
    // console.log('-------------');
    // console.log(tonalityChromas);
    // console.log(harmonyChordSortedChromas);
    // console.log(previousMelodyChroma + previousMelodyOctave);
    // console.log(nearNotes);

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
          // console.log('Added below in passing note ' + chromas[previousMelodyNoteIndex]);
          if (previousMelodyNoteIndex - chromaIndex <= 0) {
            octave--;
            // console.log('previousMelodyOctave: ' + previousMelodyOctave + ' octave: ' + octave);
          }
          nearNotes.push(chromas[previousMelodyNoteIndex] + String(octave));
        } else {
          break;
        }
      }
      // console.log(nearNotes);
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
            nearNoteChromas.push([harmonyChordChroma, harmonyChordOctave]);
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
  private pickNearNoteFromSourceChord(harmonyChord: PlacedChord, previousMelodyChroma: string | undefined, previousMelodyOctave: number, directionUp: boolean | undefined): [string, number] {
    const harmonyChordSortedChromas: Array<string> = harmonyChord.getSortedNotesChromas();
    if (previousMelodyChroma) {
      const nearNotes: Array<[string, number]> = this.getNearNotesFromSourceChord(harmonyChord, previousMelodyChroma, previousMelodyOctave);
      let nearNoteIndex: number;
      if (directionUp == true) {
        // Going up
        nearNoteIndex = nearNotes.length - 1;
      } else if (directionUp == false) {
        // Going down
        nearNoteIndex = 0;
      } else {
        // Going randomly
        nearNoteIndex = this.commonService.getRandomIntegerBetween(0, nearNotes.length - 1);
      }
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

  private generateMelodyChords(harmonyMeasures: Array<Measure>, octave: number, chordDuration: number, velocity: number, fromTrack: Track | undefined, fromMeasure: Measure | undefined, fromChord: PlacedChord | undefined, directionUp: boolean | undefined): Array<PlacedChord> {
    const melodyChords: Array<PlacedChord> = new Array();
    let measureIndex: number = 0;
    let placedChordIndex: number = 0;

    if (fromTrack && fromMeasure && fromChord) {
      const keptMeasures: Array<Measure> = this.copyUntilChord(fromTrack, fromMeasure, fromChord);
      if (keptMeasures.length > 0) {
        for (const keptMeasure of keptMeasures) {
          for (const keptChord of keptMeasure.getSortedChords()) {
            melodyChords.push(keptChord);
            placedChordIndex++;
          }
        }
      }

      measureIndex = fromMeasure.index;
    }
    const minChordIndex: number = placedChordIndex;
    placedChordIndex = 0;

    for (let i: number = measureIndex; i < harmonyMeasures.length; i++) {
      const measure: Measure = harmonyMeasures[i];
      for (let j: number = 0; j < measure.getSortedChords().length; j++) {
        const harmonyChord: PlacedChord = measure.getSortedChords()[j];
        const previousMelodyChord: PlacedChord | undefined = melodyChords.length > 0 ? melodyChords[melodyChords.length - 1] : undefined;
        const melodyChordsForOneHarmonyChord: Array<PlacedChord> = this.generateTwoMelodyChordsForOneHarmonyChord(placedChordIndex, previousMelodyChord, harmonyChord, octave, chordDuration, velocity, directionUp);
        for (let k: number = 0; k < melodyChordsForOneHarmonyChord.length; k++) {
          if (placedChordIndex >= minChordIndex) {
            melodyChords.push(melodyChordsForOneHarmonyChord[k]);
          }
          placedChordIndex++;
        }
      }
    }

    this.notationService.addEndOfTrackNote(melodyChords);

    return melodyChords;
  }

  private generateTwoMelodyChordsForOneHarmonyChord(placedChordIndex: number, previousMelodyChord: PlacedChord | undefined, harmonyChord: PlacedChord, octave: number, chordDuration: number, velocity: number, directionUp: boolean | undefined): Array<PlacedChord> {
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
      const [firstMelodyChroma, firstMelodyOctave]: [string, number] = this.pickNearNoteFromSourceChord(harmonyChord, currentMelodyChroma, currentMelodyOctave, directionUp);
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
        const [secondMelodyChroma, secondMelodyOctave]: [string, number] = this.pickNearNoteFromSourceChord(harmonyChord, currentMelodyChroma, currentMelodyOctave, directionUp);
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

  private deleteStartingFromChord(fromTrack: Track, fromMeasure: Measure, fromChord: PlacedChord): void {
    // Delete the existing chords and measures from a specified starting chord

    // Delete the following chords of the first measure
    const redundantChords: Array<PlacedChord> = fromMeasure.getSortedChords();
    const originalChordsLength: number = redundantChords.length;
    for (let index: number = fromChord.index; index < originalChordsLength; index++) {
      if (fromMeasure.placedChords) {
        fromMeasure.placedChords.splice(fromChord.index, 1);
      }
    }

    // Delete the following measures
    const redundantMeasures: Array<Measure> = fromTrack.getSortedMeasures();
    const originalMeasuresLength: number = redundantMeasures.length;
    const firstFollowingMeasure: number = fromMeasure.index + 1;
    for (let index: number = firstFollowingMeasure; index < originalMeasuresLength; index++) {
      fromTrack.measures.splice(firstFollowingMeasure, 1);
    }
  }

  private copyUntilChord(fromTrack: Track, fromMeasure: Measure, fromChord: PlacedChord): Array<Measure>  {
    const measures: Array<Measure> = new Array<Measure>();
    let measureIndex: number = 0;
    let measure: Measure;

    // Get all the chords of the previous measures to keep
    for (let i: number = 0; i < fromMeasure.index; i++) {
      measure = this.createMeasure(measureIndex);
      measures.push(measure);
      measureIndex++;
      measure.placedChords = new Array<PlacedChord>();
      const placedChords: Array<PlacedChord> = fromTrack.getSortedMeasures()[i].getSortedChords();
      for (let j: number = 0; j < placedChords.length; j++) {
        measure.placedChords.push(placedChords[j]);
      }
    }

    // Get the previous chords of the last measure to keep
    measure = this.createMeasure(measureIndex);
    measures.push(measure);
    measure.placedChords = new Array<PlacedChord>();
    const placedChords: Array<PlacedChord> = fromTrack.getSortedMeasures()[fromMeasure.index].getSortedChords();
    for (let j: number = 0; j < fromChord.index; j++) {
      measure.placedChords.push(placedChords[j]);
    }

    return measures;
  }

  private generateHarmonyChordInMeasures(octave: number, chordDuration: number, velocity: number, fromTrack: Track | undefined, fromMeasure: Measure | undefined, fromChord: PlacedChord | undefined): Array<Measure> {
    const measures: Array<Measure> = new Array<Measure>();
    let measureIndex: number = 0;
    let chordNumber: number = 0;
    let tonality: Tonality;
    let measure: Measure;

    let measureChordIndex: number = chordNumber;
    let previousPreviousChord: PlacedChord | undefined;
    let previousChord: PlacedChord | undefined;
    let harmonyChord: PlacedChord | undefined;

    if (fromTrack && fromMeasure && fromChord) {
      const keptMeasures: Array<Measure> = this.copyUntilChord(fromTrack, fromMeasure, fromChord);
      if (keptMeasures.length > 0) {
        for (const keptMeasure of keptMeasures) {
          measures.push(keptMeasure);
          chordNumber = chordNumber + keptMeasure.getSortedChords().length;
        }
        measureIndex = measures.length - 1;
        measure = measures[measureIndex];
        measure.placedChords = measures[measureIndex].getSortedChords();
        measureChordIndex = measures[measureIndex].getSortedChords().length;
        harmonyChord = measure.placedChords[chordNumber - 1];
      } else {
        measure = this.createMeasure(measureIndex);
        measures.push(measure);
        measure.placedChords = new Array<PlacedChord>();
      }
      tonality = fromChord.tonality;
    } else {
      measure = this.createMeasure(measureIndex);
      measures.push(measure);
      measure.placedChords = new Array<PlacedChord>();
      tonality = this.getFirstMeasureTonality();
    }

    const generateNbChords: number = this.settingsService.getSettings().generateNbChords > 0 ? this.settingsService.getSettings().generateNbChords : 1;
    while (chordNumber < generateNbChords) {
      previousPreviousChord = previousChord;
      previousChord = harmonyChord;

      // The number of beats of the chords placed in a measure must equal the number of beats of the measure
      if (measure.getPlacedChordsNbBeats() >= measure.getNbBeats()) {
        measureIndex++;
        measure = this.createMeasure(measureIndex);
        measure.placedChords = new Array<PlacedChord>();
        measures.push(measure);
        measureChordIndex = 0;
        if (this.withModulation()) {
          // Do not overwrite the first tonality
          if (chordNumber > 0) {
            const randomTonality: Tonality = this.getSibblingTonality(previousPreviousChord, previousChord);
            tonality = new Tonality(randomTonality.range, randomTonality.firstChroma);
          }
          // Avoid using the bonus table when changing of tonality as no chroma can then be found
          previousChord = undefined;
        }
      }
      harmonyChord = this.generateHarmonyChord(measureChordIndex, tonality, octave, chordDuration, velocity, previousChord);
      if (harmonyChord) {
        measureChordIndex++;
        chordNumber++;
        measure.placedChords.push(harmonyChord);
        // Add twice the same chord
        if (previousChord && this.settingsService.getSettings().generateDoubleChord) {
          if (chordNumber < generateNbChords && measure.getPlacedChordsNbBeats() < measure.getNbBeats()) {
            const clonedChord: PlacedChord = this.notationService.createSameChord(previousChord);
            measure.placedChords.push(clonedChord);
            measureChordIndex++;
            chordNumber++;
          }
        }
      }
    }
    this.notationService.addEndOfTrackNote(measure.placedChords);

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

    for (let noteIndex = 0; noteIndex < chordWidth; noteIndex++) { // TODO Looks like shifting to a different octave messes up things here
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
