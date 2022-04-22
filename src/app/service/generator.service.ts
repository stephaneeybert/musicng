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
import { NOTE_RANGE, TRACK_TYPES, CHROMAS_MAJOR, CHROMAS_MINOR, DEFAULT_TEMPO_BPM } from './notation.constant ';
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

  public recreateSoundtrackDemo(soundtrack: Soundtrack): void {
    const trackIndex: number = 1;
    const measureIndex: number = 1;
    const placedChordIndex: number = 1;
    const pickedChordChroma: string | undefined = undefined;
    const pickedNoteChroma: string | undefined = undefined;
    const pickedNoteOctave: number | undefined = undefined;
    const pickedTonality: Tonality | undefined = undefined;
    const recreate: boolean = true;
    this.recreateSoundtrack(soundtrack, trackIndex, measureIndex, placedChordIndex, pickedChordChroma, pickedNoteChroma, pickedNoteOctave, pickedTonality, recreate);
  }

  public recreateSoundtrack(soundtrack: Soundtrack, trackIndex: number, measureIndex: number, placedChordIndex: number, pickedChordChroma: string | undefined, pickedNoteChroma: string | undefined, pickedNoteOctave: number | undefined, pickedTonalityChroma: string | undefined, recreate: boolean): void {
    if (trackIndex == TRACK_INDEX_HARMONY) {
      let harmonyTrack: Track = this.getHarmonyTrack(soundtrack);
      let harmonyMeasure: Measure = harmonyTrack.getSortedMeasures()[measureIndex];
      let harmonyChord: PlacedChord = harmonyMeasure.getSortedChords()[placedChordIndex];
      this.regenerateHarmonyChords(soundtrack, harmonyMeasure, harmonyChord, pickedChordChroma, pickedTonalityChroma, recreate);

      // Update the recreated harmony chord
      // as it is used to recreate the melody notes
      harmonyTrack = this.getHarmonyTrack(soundtrack);
      harmonyMeasure = harmonyTrack.getSortedMeasures()[measureIndex];
      harmonyChord = harmonyMeasure.getSortedChords()[placedChordIndex];

      // Regenerate the melody chords when regenerating the harmony chords
      const melodyTrack: Track = this.getMelodyTrack(soundtrack);
      const fromMeasure: Measure = melodyTrack.getSortedMeasures()[measureIndex];
      const fromChord: PlacedChord = this.notationService.getMelodyChordFromHarmonyChord(soundtrack, fromMeasure.index, placedChordIndex);
      this.regenerateMelodyChords(soundtrack, melodyTrack, fromMeasure, fromChord, undefined, undefined, harmonyChord, recreate);
    } else if (trackIndex == TRACK_INDEX_MELODY) {
      const melodyTrack: Track = this.getMelodyTrack(soundtrack);
      const fromMeasure: Measure = melodyTrack.getSortedMeasures()[measureIndex];
      const fromChord: PlacedChord = fromMeasure.getSortedChords()[placedChordIndex];
      this.regenerateMelodyChords(soundtrack, melodyTrack, fromMeasure, fromChord, pickedNoteChroma, pickedNoteOctave, undefined, recreate);
    }

    let message: string;
    if (recreate) {
      message = this.translateService.instant('soundtracks.message.regenerated', { name: soundtrack.name });
    } else {
      message = this.translateService.instant('soundtracks.message.updated', { name: soundtrack.name });
    }
    this.materialService.showSnackBar(message);
  }

  public generateSoundtrack(): Soundtrack {
    const soundtrack: Soundtrack = this.soundtrackService.createSoundtrack(this.createNewSoundtrackId(), this.createNewSoundtrackName());

    const octave: number = this.settingsService.getSettings().generateNoteOctave;
    const chordDuration: number = this.settingsService.getSettings().generateChordDuration;
    const harmonyVelocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityHarmony);
    const harmonyMeasures: Array<Measure> = this.generateHarmonyChordsInMeasures(octave, chordDuration, harmonyVelocity, undefined, undefined, undefined, undefined, undefined, undefined, true);

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
    const melodyChords: Array<PlacedChord> = this.generateMelodyChords(soundtrack, harmonyMeasures, octave, chordDuration, melodyVelocity, undefined, undefined, undefined, undefined, undefined);
    const melodyMeasures: Array<Measure> = this.createMeasures(melodyChords);

    const melodyTrack: Track = soundtrack.addTrack(TRACK_INDEX_MELODY, melodyMeasures);
    melodyTrack.name = this.getTrackName(TRACK_TYPES.MELODY);
  }

  private regenerateMelodyChords(soundtrack: Soundtrack, fromTrack: Track, fromMeasure: Measure, fromChord: PlacedChord, pickedNoteChroma: string | undefined, pickedNoteOctave: number | undefined, harmonyChord: PlacedChord | undefined, recreate: boolean): void {
    const octave: number = this.settingsService.getSettings().generateNoteOctave;
    const chordDuration: number = this.settingsService.getSettings().generateChordDuration;

    const melodyVelocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityMelody);
    const melodyTrack: Track = soundtrack.getSortedTracks()[TRACK_INDEX_MELODY];
    if (recreate) {
      this.deleteStartingFromChord(melodyTrack, fromMeasure, fromChord);
      const harmonyMeasures: Array<Measure> = this.getHarmonyTrack(soundtrack).getSortedMeasures();
      const melodyChords: Array<PlacedChord> = this.generateMelodyChords(soundtrack, harmonyMeasures, octave, chordDuration, melodyVelocity, melodyTrack, fromMeasure, fromChord, pickedNoteChroma, pickedNoteOctave);
      soundtrack.getSortedTracks()[melodyTrack.index].measures = this.createMeasures(melodyChords);
    } else {
      if (pickedNoteChroma && pickedNoteOctave) {
        this.notationService.replaceMelodyNote(soundtrack, fromTrack.index, fromMeasure.index, fromChord.index, pickedNoteChroma, pickedNoteOctave);
      } else if (harmonyChord) {
        const previousMelodyChord: PlacedChord | undefined = this.notationService.getPreviousPlacedChord(soundtrack, fromTrack.index, fromMeasure.index, fromChord.index);
        if (previousMelodyChord) {
          const firstNote: Note = this.notationService.getFirstChordNoteSortedByIndex(previousMelodyChord);
          const previousMelodyChroma: string = firstNote.renderChroma();
          const previousMelodyOctave: number = firstNote.renderOctave();
          const [noteChroma, noteOctave]: [string, number] = this.pickMelodyNoteFromHarmonyChord(harmonyChord, previousMelodyChroma, previousMelodyOctave);
          this.notationService.replaceMelodyNote(soundtrack, fromTrack.index, fromMeasure.index, fromChord.index, noteChroma, noteOctave);
        }
      }
    }
    this.soundtrackService.storeSoundtrack(soundtrack);
    this.soundtrackService.updateSoundtrack(soundtrack);
  }

  public generateHarmonyTrack(soundtrack: Soundtrack, harmonyMeasures: Array<Measure>): void {
    const harmonyTrack: Track = soundtrack.addTrack(TRACK_INDEX_HARMONY, harmonyMeasures);
    harmonyTrack.name = this.getTrackName(TRACK_TYPES.HARMONY);
    harmonyTrack.displayChordNames = true;
  }

  private regenerateHarmonyChords(soundtrack: Soundtrack, fromMeasure: Measure, fromChord: PlacedChord, pickedChordChroma: string | undefined, pickedTonalityChroma: string | undefined, recreate: boolean): void {
    const octave: number = this.settingsService.getSettings().generateNoteOctave;
    const chordDuration: number = this.settingsService.getSettings().generateChordDuration;
    const harmonyVelocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityHarmony);
    const harmonyTrack: Track = this.getHarmonyTrack(soundtrack);
    // Keep the octave of the base note of the replaced chord
    const pickedChordOctave: number = fromChord.getNotesSortedByIndex()[0].renderOctave();
    if (recreate) {
      this.deleteStartingFromChord(harmonyTrack, fromMeasure, fromChord);
      soundtrack.getSortedTracks()[harmonyTrack.index].measures = this.generateHarmonyChordsInMeasures(octave, chordDuration, harmonyVelocity, harmonyTrack, fromMeasure, fromChord, pickedChordChroma, pickedChordOctave, pickedTonalityChroma, recreate);
    } else {
      if (pickedChordChroma) {
        const velocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityHarmony);
        const currentHarmonyChord: PlacedChord = this.notationService.getPlacedChord(soundtrack, TRACK_INDEX_HARMONY, fromMeasure.index, fromChord.index);
        if (fromMeasure.deleteChord(currentHarmonyChord)) {
          const chromaOctaves = this.buildSpecificChordChromaOctaves(fromChord.tonality, pickedChordChroma, pickedChordOctave);
          const notes: Array<Note> = this.notationService.createChordNotesFromChromaOctaves(chromaOctaves);
          const newHarmonyChord = this.notationService.createPlacedChordFromNotes(chordDuration, velocity, fromChord.tonality, fromChord.index, notes);
          fromMeasure.addChord(newHarmonyChord);
        }
      }
    }
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

  // Check if the chord shares a minimum number of notes with its previous chord
  private placedChordIsSimilarTo(previousChord: PlacedChord, chromaOctaves: Array<[string, number]>): boolean {
    let nbSameNotes: number = 0;
    for (const previousNote of previousChord.getNotesSortedByIndex()) {
      for (let i = 0; i < chromaOctaves.length; i++) {
        if (previousNote.renderChroma() == chromaOctaves[i][0] && previousNote.renderOctave() == chromaOctaves[i][1]) {
          nbSameNotes++;
        }
      }
    }
    return (nbSameNotes >= (chromaOctaves.length - 1));
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

  // An inpassing note is one that is not in the harmony chord but that
  // is between the previous melody note and another note of the harmony chord
  // even if of another octave
  private getInpassingNotes(harmonyChord: PlacedChord, previousMelodyChroma: string, previousMelodyOctave: number): Array<string> {
    const inpassingNotes: Array<string> = new Array<string>();

    const tonalityChromas: Array<string> = this.notationService.getTonalityChromas(harmonyChord.tonality.range, harmonyChord.tonality.firstChroma);
    const previousMelodyNoteIndex: number = tonalityChromas.indexOf(previousMelodyChroma);
    if (previousMelodyNoteIndex < 0) {
      throw new Error('The previous melody chroma ' + previousMelodyChroma + ' could not be found in the tonality ' + tonalityChromas);
    }
    let chromas: Array<string> = tonalityChromas;

    const harmonyChordSortedChromas: Array<string> = harmonyChord.getSortedNotesChromas();

    // Consider the chromas above the previous melody note chroma
    if (previousMelodyOctave <= this.notationService.getFirstChordNoteSortedByIndex(harmonyChord).renderOctave()) {
      for (let chromaIndex: number = 0; chromaIndex < tonalityChromas.length; chromaIndex++) {
        chromas = this.notationService.shiftChromasLeftOnce(chromas);
        // Consider only notes before the next harmony chord note
        if (!harmonyChordSortedChromas.includes(chromas[previousMelodyNoteIndex])) {
          if (this.notationService.isBelowNbHalfTonesDissonance(harmonyChord.tonality, previousMelodyChroma, chromas[previousMelodyNoteIndex])) {
            // Check if the note is on the upper octave
            let octave: number = previousMelodyOctave;
            if (previousMelodyNoteIndex + chromaIndex + 1 >= tonalityChromas.length) {
              octave++;
            }
            inpassingNotes.push(chromas[previousMelodyNoteIndex] + String(octave));
          }
        } else {
          break;
        }
      }
    }

    // Consider the chromas below the previous melody note chroma
    if (previousMelodyOctave >= this.notationService.getFirstChordNoteSortedByIndex(harmonyChord).renderOctave()) {
      chromas = tonalityChromas;
      for (let chromaIndex: number = 0; chromaIndex < tonalityChromas.length; chromaIndex++) {
        chromas = this.notationService.shiftChromasRightOnce(chromas);
        // Consider only notes before the next harmony chord note
        if (!harmonyChordSortedChromas.includes(chromas[previousMelodyNoteIndex])) {
          if (this.notationService.isBelowNbHalfTonesDissonance(harmonyChord.tonality, previousMelodyChroma, chromas[previousMelodyNoteIndex])) {
            // Check if the note is on the lower octave
            let octave: number = previousMelodyOctave;
            if (previousMelodyNoteIndex - chromaIndex <= 0) {
              octave--;
            }
            inpassingNotes.push(chromas[previousMelodyNoteIndex] + String(octave));
          }
        } else {
          break;
        }
      }
    }

    // If the previous melody note is bordered by two notes from the harmony chord
    // then no near note can be obtained and there are no returned near notes

    return inpassingNotes;
  }

  private pickInpassingNote(harmonyChord: PlacedChord, previousMelodyChroma: string, previousMelodyOctave: number): string | undefined {
    // Randomly pick a note from the near ones
    const inpassingNotes: Array<string> = this.getInpassingNotes(harmonyChord, previousMelodyChroma, previousMelodyOctave);
    if (inpassingNotes.length > 0) {
      const nearNoteIndex: number = this.commonService.getRandomIntegerBetween(0, inpassingNotes.length - 1);
      return inpassingNotes[nearNoteIndex];
    } else {
      return undefined;
    }
  }

  // Get the notes from the harmony chord that are near the previous melody note
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
        // Avoid the previous note
        if (harmonyChordChroma != previousMelodyChroma && harmonyChordOctave != previousMelodyOctave) {
          // The maximum distance to consider for a note to be near enough
          if (this.notationService.isBelowNbHalfTonesDissonance(harmonyChord.tonality, previousMelodyChroma, harmonyChordChroma)) {
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

  private getFirstMeasureTonality(): Tonality {
    const firstChroma: string = this.settingsService.getSettings().generateTonality;
    // The tonality of the first measure must be a major one
    if (!CHROMAS_MAJOR.includes(firstChroma)) {
      throw new Error('The setting for the tonality of the first measure is not a major one');
    }
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
        this.stripPreviousTonalityFromList(tonalities, previousChord.tonality);
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

  private stripPreviousTonalityFromList(tonalities: Array<Tonality>, previousTonality: Tonality | undefined): void {
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

  private getOtherTonalities(previousPreviousChord: PlacedChord | undefined, previousChord: PlacedChord | undefined): Array<Tonality> { if (previousPreviousChord && previousChord) {
      const previousChordName: string = this.notationService.getChordIntlName(previousChord);
      const previousPreviousChordName: string = this.notationService.getChordIntlName(previousPreviousChord);
      let tonalities: Array<Tonality> = this.getTonalitiesContainingChordNames(NOTE_RANGE.MAJOR, previousPreviousChordName, previousChordName)
      .concat(
        this.getTonalitiesContainingChordNames(NOTE_RANGE.MINOR_NATURAL, previousPreviousChordName, previousChordName)
      )
      // There must always be at least one tonality that includes the two previous chords
      if (tonalities.length == 0) {
        throw new Error('No tonality could be found as sibbling to the two previous chords ' + previousPreviousChordName + ' and ' + previousChordName);
      }
      return tonalities;
    } else {
      return this.notationService.getMajorTonalities();
    }
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

  private generateMelodyChords(soundtrack: Soundtrack, harmonyMeasures: Array<Measure>, octave: number, chordDuration: number, velocity: number, fromTrack: Track | undefined, fromMeasure: Measure | undefined, fromChord: PlacedChord | undefined, pickedNoteChroma: string | undefined, pickedNoteOctave: number | undefined): Array<PlacedChord> {
    const melodyChords: Array<PlacedChord> = new Array();
    let measureIndex: number = 0;
    let placedChordIndex: number = 0;

    if (fromTrack && fromMeasure && fromChord) {
      const keptMeasures: Array<Measure> = this.copyUntilExcludingChord(fromTrack, fromMeasure, fromChord);
      if (keptMeasures.length > 0) {
        for (const keptMeasure of keptMeasures) {
          for (const keptChord of keptMeasure.getSortedChords()) {
            melodyChords.push(keptChord);
            placedChordIndex++;
          }
        }
      }
      measureIndex = fromMeasure.index;

      if (pickedNoteChroma && pickedNoteOctave) {
        const noteDuration: number = this.notationService.harmonyChordDuratioToMelodyNoteDuration(chordDuration);
        const harmonyChord: PlacedChord = this.notationService.getHarmonyChordFromMelodyChord(soundtrack, fromMeasure.index, fromChord.index);
        const notes: Array<Note> = this.notationService.createChordNotesFromChromaOctaves([[pickedNoteChroma, pickedNoteOctave]]);
        const placedChord: PlacedChord = this.notationService.createPlacedChordFromNotes(noteDuration, velocity, harmonyChord.tonality, placedChordIndex, notes);
        melodyChords.push(placedChord);
        placedChordIndex++;
      }
    }

    const minChordIndex: number = placedChordIndex;
    placedChordIndex = 0;

    for (let i: number = measureIndex; i < harmonyMeasures.length; i++) {
      const measure: Measure = harmonyMeasures[i];
      for (let j: number = 0; j < measure.getSortedChords().length; j++) {
        const harmonyChord: PlacedChord = measure.getSortedChords()[j];
        const previousMelodyChord: PlacedChord | undefined = melodyChords.length > 0 ? melodyChords[melodyChords.length - 1] : undefined;
        const melodyChordsForOneHarmonyChord: Array<PlacedChord> = this.generateTwoMelodyChordsForOneHarmonyChord(placedChordIndex, previousMelodyChord, harmonyChord, octave, chordDuration, velocity);
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

  // Collect the notes from the harmony chord plus the inpassing notes
  public collectPossibleMelodyNotesFromHarmonyChord(harmonyChord: PlacedChord, previousMelodyChord: PlacedChord | undefined, withInpassing: boolean): Array<string> {
    let collection: Array<[string, number]> = new Array();
    const octave: number = previousMelodyChord ? this.notationService.getFirstChordNoteSortedByIndex(previousMelodyChord).renderOctave() : this.settingsService.getSettings().generateNoteOctave;
    const sortedNotes: Array<Note> = harmonyChord.getNotesSortedByIndex();
    for (let i: number = 0; i < sortedNotes.length; i++) {
      const reverse: number = sortedNotes.length - i - 1;
      const note: Note = sortedNotes[reverse];
      collection.push([note.renderChroma(), note.renderOctave()]);
    }
    if (withInpassing && previousMelodyChord) {
      const previousMelodyChroma: string | undefined = this.notationService.getFirstChordNoteSortedByIndex(previousMelodyChord).renderChroma();
      for (const chroma of this.getInpassingNotes(harmonyChord, previousMelodyChroma, octave)) {
        collection.push([chroma, octave]);
      }
    }
    const sorted = collection
      .map(([chroma, octave]: [string, number]) => {
        return this.notationService.renderIntlChromaOctave(chroma, octave)
      });
    return sorted;
  }

  // Pick a melody note from the harmony chord that is near the previous melody note
  private pickMelodyNoteFromHarmonyChord(harmonyChord: PlacedChord, previousMelodyChroma: string | undefined, previousMelodyOctave: number): [string, number] {
    const harmonyChordSortedChromas: Array<string> = harmonyChord.getSortedNotesChromas();
    if (previousMelodyChroma) {
      const nearNotes: Array<[string, number]> = this.getNearNotesFromSourceChord(harmonyChord, previousMelodyChroma, previousMelodyOctave);
      let nearNoteIndex: number;
      nearNoteIndex = this.commonService.getRandomIntegerBetween(0, nearNotes.length - 1);
      return nearNotes[nearNoteIndex];
    } else {
      // If no previous note then pick any note from the harmony chord
      const chordNoteIndex: number = this.commonService.getRandomIntegerBetween(0, harmonyChordSortedChromas.length - 1);
      return [harmonyChordSortedChromas[chordNoteIndex], previousMelodyOctave];
    }
  }

  private generateTwoMelodyChordsForOneHarmonyChord(placedChordIndex: number, previousMelodyChord: PlacedChord | undefined, harmonyChord: PlacedChord, octave: number, chordDuration: number, velocity: number): Array<PlacedChord> {
    const melodyChords: Array<PlacedChord> = new Array();
    const previousMelodyChroma: string | undefined = previousMelodyChord ? this.notationService.getFirstChordNoteSortedByIndex(previousMelodyChord).renderChroma() : undefined;
    const previousMelodyOctave: number = previousMelodyChord ? this.notationService.getFirstChordNoteSortedByIndex(previousMelodyChord).renderOctave() : octave;

    if (!this.notationService.isEndOfTrackPlacedChord(harmonyChord)) {
      // For each harmony chord of the harmony track, there are two single note chords of half duration in the melody track
      // The first melody note is one of the harmony chord, and the second melody note is also a note from the same harmony chord or an inpassing note
      // An inpassing note is one that is not in the harmony chord but that is between the previous melody note and another note of the harmony chord even if of another octave
      // So an inpassing note cannot be followed by another inpassing note, but a harmony chord note can be followed by another harmony chord note
      // A melody note of a harmony chord must also be near the previous melody note

      // Get the first note as one of the harmony chord notes
      const [firstMelodyChroma, firstMelodyOctave]: [string, number] = this.pickMelodyNoteFromHarmonyChord(harmonyChord, previousMelodyChroma, previousMelodyOctave);
      const noteDuration: number = this.notationService.harmonyChordDuratioToMelodyNoteDuration(chordDuration);
      const notes: Array<Note> = this.notationService.createChordNotesFromChromaOctaves([[firstMelodyChroma, firstMelodyOctave]]);
      let placedChord: PlacedChord = this.notationService.createPlacedChordFromNotes(noteDuration, velocity, harmonyChord.tonality, placedChordIndex, notes);
      melodyChords.push(placedChord);

      // Get the second note as an in passing note or as one one of the harmony chord notes
      let inpassingTextNote: string | undefined;
      if (this.fromInpassingNote()) {
        inpassingTextNote = this.pickInpassingNote(harmonyChord, firstMelodyChroma, firstMelodyOctave);
      }
      if (inpassingTextNote) {
        const [inpassingNoteChroma, inpassingNoteOctave]: [string, number] = this.notationService.noteToChromaOctave(inpassingTextNote);
        const notes: Array<Note> = this.notationService.createChordNotesFromChromaOctaves([[inpassingNoteChroma, inpassingNoteOctave]]);
        placedChord = this.notationService.createPlacedChordFromNotes(noteDuration, velocity, harmonyChord.tonality, placedChordIndex + 1, notes);
        melodyChords.push(placedChord);
      } else {
        // Get one of the harmony chord notes even the already picked one
        const [secondMelodyChroma, secondMelodyOctave]: [string, number] = this.pickMelodyNoteFromHarmonyChord(harmonyChord, firstMelodyChroma, firstMelodyOctave);
        // If the second note is the same as the fisrt one then have only one chord
        // but with a duration that is twice as long
        if (secondMelodyChroma == firstMelodyChroma && secondMelodyOctave == firstMelodyOctave) {
          melodyChords[melodyChords.length - 1].duration = this.notationService.createDuration(chordDuration, TempoUnit.NOTE);
        } else {
          const notes: Array<Note> = this.notationService.createChordNotesFromChromaOctaves([[secondMelodyChroma, secondMelodyOctave]]);
          placedChord = this.notationService.createPlacedChordFromNotes(noteDuration, velocity, harmonyChord.tonality, placedChordIndex + 1, notes);
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

  private copyUntilExcludingChord(fromTrack: Track, fromMeasure: Measure, fromChord: PlacedChord): Array<Measure>  {
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

  private generateHarmonyChordsInMeasures(octave: number, chordDuration: number, velocity: number, fromTrack: Track | undefined, fromMeasure: Measure | undefined, fromChord: PlacedChord | undefined, pickedChordChroma: string | undefined, pickedChordOctave: number | undefined, pickedTonalityChroma: string | undefined, recreate: boolean): Array<Measure> {
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
      const keptMeasures: Array<Measure> = this.copyUntilExcludingChord(fromTrack, fromMeasure, fromChord);
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
        if (chordNumber > 1) {
          previousChord = measure.placedChords[chordNumber - 2];
        }
      } else {
        measure = this.createMeasure(measureIndex);
        measures.push(measure);
        measure.placedChords = new Array<PlacedChord>();
      }
      tonality = fromChord.tonality;

      if (pickedChordChroma && pickedChordOctave) {
        const chromaOctaves = this.buildSpecificChordChromaOctaves(tonality, pickedChordChroma, pickedChordOctave);
        const notes: Array<Note> = this.notationService.createChordNotesFromChromaOctaves(chromaOctaves);
        harmonyChord = this.notationService.createPlacedChordFromNotes(chordDuration, velocity, tonality, measureChordIndex, notes);
        previousPreviousChord = previousChord;
        previousChord = harmonyChord;
        measureChordIndex++;
        chordNumber++;
        measure.placedChords.push(harmonyChord);
      }
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
        if (pickedTonalityChroma) {
          const pickedTonality: Tonality = new Tonality(NOTE_RANGE.MAJOR, pickedTonalityChroma);
          tonality = pickedTonality;
          // Avoid using the bonus table when changing of tonality as no chroma can then be found
          previousChord = undefined;
        } else if (this.withModulation()) {
          // Do not overwrite the first tonality
          // as it's configured in the settings
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
        if (this.settingsService.getSettings().generateDoubleChord) {
          if (chordNumber < generateNbChords && measure.getPlacedChordsNbBeats() < measure.getNbBeats()) {
            const clonedChord: PlacedChord = this.notationService.clonePlacedChord(harmonyChord);
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
    const previousChordBaseNote: Note | undefined = previousChord ? this.notationService.getFirstChordNoteSortedByIndex(previousChord) : undefined;
    const previousBaseChroma: string | undefined = previousChordBaseNote ? previousChordBaseNote.renderChroma() : undefined;
    const chromaOctaves: Array<[string, number]> = this.buildRandomChordChromaOctaves(tonality, previousBaseChroma, octave);

    // Consider a chord only if it is similar to its previous one
    //if (!previousChord || this.placedChordIsSimilarTo(previousChord, chromaOctaves)) {
    if (!previousChord) {
      const notes: Array<Note> = this.notationService.createChordNotesFromChromaOctaves(chromaOctaves);
      return this.notationService.createPlacedChordFromNotes(chordDuration, velocity, tonality, placedChordIndex, notes);
    } else if (this.placedChordIsSimilarTo(previousChord, chromaOctaves)) {
      const notes: Array<Note> = this.notationService.createChordNotesFromChromaOctaves(chromaOctaves);
      return this.notationService.createPlacedChordFromNotes(chordDuration, velocity, tonality, placedChordIndex, notes);
    } else {
      // If the current chord is too dissimilar from its previous one
      // then possibly create a chord from a reversing of the previous one
      if (this.settingsService.getSettings().generateReverseDissimilarChord) {
        const notes: Array<Note> = this.reverseChordNotes(previousChord);
        return this.notationService.createPlacedChordFromNotes(chordDuration, velocity, tonality, placedChordIndex, notes);
      }
    }
  }

  private reverseChordNotes(chord: PlacedChord): Array<Note> {
    const reversed: Array<Note> = new Array();
    let chromas: Array<Note> = chord.getNotesSortedByIndex();
    for (let i: number = 0; i < chromas.length; i++) {
      reversed.push(chromas[chromas.length - i - 1]);
    }
    return reversed;
  }

  private getTonalityShiftedChromas(tonality: Tonality): Array<Array<string>> {
    const tonalityChromas: Array<string> = this.notationService.getTonalityChromas(tonality.range, tonality.firstChroma);
    const chordWidth: number = this.settingsService.getSettings().generateChordWidth;
    const shiftedChromas: Array<Array<string>> = this.notationService.getTonalityShiftedChromas(tonalityChromas, chordWidth);
    return shiftedChromas;
  }

  private buildSpecificChordChromaOctaves(tonality: Tonality, chroma : string, octave: number): Array<[string, number]> {
    const tonalityChromas: Array<string> = this.notationService.getTonalityChordNames(tonality.range, tonality.firstChroma);

    const chromaIndex: number = tonalityChromas.indexOf(chroma);
    if (chromaIndex < 0) {
      throw new Error('The tonality does not contain the specific chroma ' + chroma);
    }

    const chromas: Array<string> = new Array();
    const shiftedChromas: Array<Array<string>> = this.getTonalityShiftedChromas(tonality);
    const chordWidth: number = this.settingsService.getSettings().generateChordWidth;
    for (let noteIndex = 0; noteIndex < chordWidth; noteIndex++) {
      chromas.push(shiftedChromas[noteIndex][chromaIndex]);
    }
    const notes: Array<Note> = this.notationService.createChordNotesFromBaseNoteOctave(octave, tonality, chromas);

    const chromaOctaves: Array<[string, number]> = new Array();
    for (const note of notes) {
      chromaOctaves.push([note.renderChroma(), note.renderOctave()]);
    }
    return chromaOctaves;
  }

  private buildRandomChordChromaOctaves(tonality: Tonality, previousBaseChroma : string | undefined, octave: number): Array<[string, number]> {
    let chromaIndex: number;
    if (previousBaseChroma) {
      const tonalityChromas: Array<string> = this.notationService.getTonalityChromas(tonality.range, tonality.firstChroma);
      chromaIndex = this.randomlyPickChromaFromTonalityBonuses(tonalityChromas, previousBaseChroma);
    } else {
      chromaIndex = this.randomlyPickFirstChroma();
    }

    const chromas: Array<string> = new Array();
    const shiftedChromas: Array<Array<string>> = this.getTonalityShiftedChromas(tonality);
    const chordWidth: number = this.settingsService.getSettings().generateChordWidth;
    for (let noteIndex = 0; noteIndex < chordWidth; noteIndex++) {
      chromas.push(shiftedChromas[noteIndex][chromaIndex]);
    }
    const notes: Array<Note> = this.notationService.createChordNotesFromBaseNoteOctave(octave, tonality, chromas);

    const chromaOctaves: Array<[string, number]> = new Array();
    for (const note of notes) {
      chromaOctaves.push([note.renderChroma(), note.renderOctave()]);
    }
    return chromaOctaves;
  }

  // Pick a first chroma when there is no previous chord
  private randomlyPickFirstChroma(): number {
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
