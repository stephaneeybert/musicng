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
import { NOTE_RANGE, TRACK_TYPES, CHROMAS_MAJOR, CHROMAS_MINOR, DEFAULT_TEMPO_BPM, OCTAVE_MAX, OCTAVE_MIN } from './notation.constant';
import { Tonality } from '@app/model/note/tonality';
import { Note } from '@app/model/note/note';
import { MaterialService } from '@app/core/service/material.service';
import { Octave } from '@app/model/note/pitch/octave';

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

  private recreateHarmonyTrack(soundtrack: Soundtrack, measureIndex: number, placedChordIndex: number, pickedChordChroma: string | undefined, pickedTonality: Tonality | undefined, recreate: boolean): void {
    let harmonyTrack: Track = this.notationService.getHarmonyTrack(soundtrack);
    let harmonyMeasure: Measure = harmonyTrack.getSortedMeasures()[measureIndex];
    let harmonyChord: PlacedChord = harmonyMeasure.getSortedChords()[placedChordIndex];
    this.regenerateHarmonyChords(soundtrack, harmonyMeasure, harmonyChord, pickedChordChroma, pickedTonality, recreate);
    // Update the recreated harmony chord
    // as it is used to recreate the melody notes
    harmonyTrack = this.notationService.getHarmonyTrack(soundtrack);
    harmonyMeasure = harmonyTrack.getSortedMeasures()[measureIndex];
    harmonyChord = harmonyMeasure.getSortedChords()[placedChordIndex];

    // Regenerate the melody chords when regenerating the harmony chords
    const melodyTrack: Track = this.notationService.getMelodyTrack(soundtrack);
    const fromMeasure: Measure = melodyTrack.getSortedMeasures()[measureIndex];
    const fromChord: PlacedChord = this.notationService.getFirstMelodyChordFromHarmonyChord(soundtrack, measureIndex, placedChordIndex);
    this.regenerateMelodyChords(soundtrack, fromMeasure, fromChord, undefined, undefined, harmonyChord, recreate);
  }

  private recreateMelodyTrack(soundtrack: Soundtrack, measureIndex: number, placedChordIndex: number, pickedNoteChroma: string, pickedNoteOctave: number, recreate: boolean): void {
    const melodyTrack: Track = this.notationService.getMelodyTrack(soundtrack);
    const fromMeasure: Measure = melodyTrack.getSortedMeasures()[measureIndex];
    const fromChord: PlacedChord = fromMeasure.getSortedChords()[placedChordIndex];
    this.regenerateMelodyChords(soundtrack, fromMeasure, fromChord, pickedNoteChroma, pickedNoteOctave, undefined, recreate);
  }

  public regenerateHarmonyTrack(soundtrack: Soundtrack, measureIndex: number, placedChordIndex: number, pickedChordChroma: string | undefined, pickedTonality: Tonality | undefined, recreate: boolean): void {
    this.recreateHarmonyTrack(soundtrack, measureIndex, placedChordIndex, pickedChordChroma, pickedTonality, recreate);

    let message: string;
    if (recreate) {
      message = this.translateService.instant('soundtracks.message.regenerated', { name: soundtrack.name });
    } else {
      message = this.translateService.instant('soundtracks.message.updated', { name: soundtrack.name });
    }
    this.materialService.showSnackBar(message);
  }

  public regenerateMelodyTrack(soundtrack: Soundtrack, measureIndex: number, placedChordIndex: number, pickedNoteChroma: string | undefined, pickedNoteOctave: number | undefined, recreate: boolean): void {
    if (pickedNoteChroma && pickedNoteOctave) {
      this.recreateMelodyTrack(soundtrack, measureIndex, placedChordIndex, pickedNoteChroma, pickedNoteOctave, recreate);
    }

    let message: string;
    if (recreate) {
      message = this.translateService.instant('soundtracks.message.melody-regenerated', { name: soundtrack.name });
    } else {
      message = this.translateService.instant('soundtracks.message.melody-updated', { name: soundtrack.name });
    }
    this.materialService.showSnackBar(message);
  }

  public regenerateOnTonality(soundtrack: Soundtrack, measureIndex: number, placedChordIndex: number, pickedChordChroma: string | undefined, pickedTonality: Tonality | undefined): void {
    this.recreateHarmonyTrack(soundtrack, measureIndex, placedChordIndex, pickedChordChroma, pickedTonality, true);

    const message: string = this.translateService.instant('soundtracks.message.regenerated', { name: soundtrack.name });
    this.materialService.showSnackBar(message);
  }

  public addMeasureAfter(soundtrack: Soundtrack, onMeasureIndex: number): void {
    let harmonyTrack: Track = this.notationService.getHarmonyTrack(soundtrack);
    let measures: Array<Measure> = harmonyTrack.getSortedMeasures();
    for (let i: number = measures.length - 1; i > onMeasureIndex; i--) {
      measures[i].index++;
    }

    const addedMeasure = this.createMeasure(onMeasureIndex + 1);
    addedMeasure.placedChords = new Array<PlacedChord>();
    for (const placedChord of measures[onMeasureIndex].getSortedChords()) {
      const newHarmonyChord = this.notationService.createPlacedChordFromNotes(placedChord.getDuration(), placedChord.velocity, placedChord.tonality, placedChord.index, []);
      addedMeasure.addChord(newHarmonyChord);
    }
    measures.push(addedMeasure);
    soundtrack.getSortedTracks()[TRACK_INDEX_HARMONY].measures = measures;

    this.soundtrackService.storeSoundtrack(soundtrack);
    this.soundtrackService.updateSoundtrack(soundtrack);

    this.recreateHarmonyTrack(soundtrack, onMeasureIndex + 1, 0, undefined, undefined, true);

    const message: string = this.translateService.instant('soundtracks.message.measure-added', { name: soundtrack.name });
    this.materialService.showSnackBar(message);
  }

  public generateSoundtrack(): Soundtrack {
    const soundtrack: Soundtrack = this.soundtrackService.createSoundtrack(this.createNewSoundtrackId(), this.createNewSoundtrackName());

    const defaultOctave: number = this.settingsService.getSettings().generateNoteOctave;
    const chordDuration: number = this.settingsService.getSettings().generateChordDuration;
    const harmonyVelocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityHarmony);
    const generateNbChords: number = this.settingsService.getSettings().generateNbChords;
    const harmonyMeasures: Array<Measure> = this.generateHarmonyChordsInMeasures(generateNbChords, defaultOctave, chordDuration, harmonyVelocity, undefined, undefined, undefined, undefined, undefined, undefined);

    if (this.settingsService.getSettings().generateMelody) {
      this.generateMelodyTrack(soundtrack, harmonyMeasures, defaultOctave, chordDuration);
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

  public generateMelodyTrack(soundtrack: Soundtrack, harmonyMeasures: Array<Measure>, defaultOctave: number, chordDuration: number): void {
    const melodyVelocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityMelody);
    const melodyChords: Array<PlacedChord> = this.generateMelodyChords(soundtrack, harmonyMeasures, defaultOctave, chordDuration, melodyVelocity, undefined, undefined, undefined, undefined, undefined);
    const melodyMeasures: Array<Measure> = this.createMeasures(melodyChords);

    const melodyTrack: Track = soundtrack.addTrack(TRACK_INDEX_MELODY, melodyMeasures);
    melodyTrack.name = this.getTrackName(TRACK_TYPES.MELODY);
  }

  private regenerateMelodyChords(soundtrack: Soundtrack, fromMeasure: Measure, fromChord: PlacedChord, pickedNoteChroma: string | undefined, pickedNoteOctave: number | undefined, harmonyChord: PlacedChord | undefined, recreate: boolean): void {
    const defaultOctave: number = this.settingsService.getSettings().generateNoteOctave;
    const chordDuration: number = this.settingsService.getSettings().generateChordDuration;

    const melodyVelocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityMelody);
    const melodyTrack: Track = this.notationService.getMelodyTrack(soundtrack);
    if (recreate) {
      this.deleteStartingFromChord(melodyTrack, fromMeasure, fromChord);
      const harmonyMeasures: Array<Measure> = this.notationService.getHarmonyTrack(soundtrack).getSortedMeasures();
      const melodyChords: Array<PlacedChord> = this.generateMelodyChords(soundtrack, harmonyMeasures, defaultOctave, chordDuration, melodyVelocity, melodyTrack, fromMeasure, fromChord, pickedNoteChroma, pickedNoteOctave);
      soundtrack.getSortedTracks()[melodyTrack.index].measures = this.createMeasures(melodyChords);
    } else {
      if (pickedNoteChroma && pickedNoteOctave) {
        this.notationService.replaceMelodyNote(soundtrack, melodyTrack.index, fromMeasure.index, fromChord.index, pickedNoteChroma, pickedNoteOctave);
      } else if (harmonyChord) {
        const [previousMeasure, previousMelodyChord]: [Measure | undefined, PlacedChord | undefined] = this.notationService.getPreviousPlacedChord(soundtrack, melodyTrack.index, fromMeasure.index, fromChord.index);
        if (previousMelodyChord) {
          const firstNote: Note = this.notationService.getFirstChordNoteSortedByIndex(previousMelodyChord);
          const previousMelodyChroma: string = firstNote.renderChroma();
          const previousMelodyOctave: number = firstNote.renderOctave();
          const [noteChroma, noteOctave]: [string, number] = this.pickMelodyNoteFromHarmonyChord(harmonyChord, previousMelodyChroma, previousMelodyOctave);
          this.notationService.replaceMelodyNote(soundtrack, melodyTrack.index, fromMeasure.index, fromChord.index, noteChroma, noteOctave);
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

  private regenerateHarmonyChords(soundtrack: Soundtrack, fromMeasure: Measure, fromChord: PlacedChord, pickedChordChroma: string | undefined, pickedTonality: Tonality | undefined, recreate: boolean): void {
    const octave: number = this.settingsService.getSettings().generateNoteOctave;
    const chordDuration: number = this.settingsService.getSettings().generateChordDuration;
    const harmonyVelocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityHarmony);
    const harmonyTrack: Track = this.notationService.getHarmonyTrack(soundtrack);
    // Keep the octave of the base note of the replaced chord if any
    const pickedChordOctave: number = fromChord.hasNotes() ? fromChord.getNotesSortedByIndex()[0].renderOctave() : octave;
    if (recreate) {
      const generateNbChords: number = harmonyTrack.getNbPlacedChords();
      this.deleteStartingFromChord(harmonyTrack, fromMeasure, fromChord);
      soundtrack.getSortedTracks()[harmonyTrack.index].measures = this.generateHarmonyChordsInMeasures(generateNbChords, octave, chordDuration, harmonyVelocity, harmonyTrack, fromMeasure, fromChord, pickedChordChroma, pickedChordOctave, pickedTonality);
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
    const previousMelodyNoteIndex: number = this.notationService.getChromaIndexInTonality(tonalityChromas, previousMelodyChroma);
    let chromas: Array<string> = tonalityChromas;

    const harmonyChordSortedChromas: Array<string> = harmonyChord.getSortedNotesChromas();

    // Consider the chromas above the previous melody note chroma
    if (previousMelodyOctave <= this.notationService.getFirstChordNoteSortedByIndex(harmonyChord).renderOctave()) {
      for (let chromaIndex: number = 0; chromaIndex < tonalityChromas.length; chromaIndex++) {
        chromas = this.notationService.shiftChromasLeftOnce(chromas);
        // Consider only notes before the next harmony chord note
        if (!harmonyChordSortedChromas.includes(chromas[previousMelodyNoteIndex])) {
          if (this.isBelowNbSemiTonesForInpassingNotes(harmonyChord.tonality, previousMelodyChroma, chromas[previousMelodyNoteIndex])) {
            // Check if the note is on the upper octave
            let octave: number = previousMelodyOctave;
            if (previousMelodyNoteIndex + chromaIndex + 1 >= tonalityChromas.length) {
              octave++;
            }
            inpassingNotes.push(chromas[chromaIndex] + String(octave));
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
          if (this.isBelowNbSemiTonesForInpassingNotes(harmonyChord.tonality, previousMelodyChroma, chromas[previousMelodyNoteIndex])) {
            // Check if the note is on the lower octave
            let octave: number = previousMelodyOctave;
            if (previousMelodyNoteIndex - chromaIndex <= 0) {
              octave--;
            }
            inpassingNotes.push(chromas[tonalityChromas.length - chromaIndex - 1] + String(octave));
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

    // If the previous note was from a different tonality and is thus not found in the new tonality
    // then pick any note from the harmony chord
    const previousMelodyNoteIndex: number = tonalityChromas.indexOf(previousMelodyChroma);
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
        if (harmonyChordChroma != previousMelodyChroma || harmonyChordOctave != previousMelodyOctave) {
          // The maximum distance to consider for a note to be near enough
          if (this.isBelowNbSemiTonesForNearNotes(harmonyChord.tonality, previousMelodyChroma, harmonyChordChroma)) {
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

  public isBelowNbSemiTonesForNearNotes(tonality: Tonality, fromChroma: string, toChroma: string): boolean {
    const nbSemiTones: number = this.settingsService.getSettings().generateNbSemiTonesAsNearNotes;
    return this.notationService.getNbSemiTonesBetweenChromas(tonality, fromChroma, toChroma) <= nbSemiTones;
  }

  public isBelowNbSemiTonesForInpassingNotes(tonality: Tonality, fromChroma: string, toChroma: string): boolean {
    const nbSemiTones: number = this.settingsService.getSettings().generateNbSemiTonesAsInpassingNotes;
    return this.notationService.getNbSemiTonesBetweenChromas(tonality, fromChroma, toChroma) <= nbSemiTones;
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
  public getSibblingTonalities(previousPreviousChord: PlacedChord | undefined, previousChord: PlacedChord | undefined, dontRepeat: boolean): Array<Tonality> {
    const onlyMajor: boolean = this.settingsService.getSettings().generateOnlyMajorTonalities;
    let tonalities: Array<Tonality> = new Array();
    if (previousPreviousChord && previousChord) {
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
    }
    return tonalities;
  }

  private getSibblingTonality(previousPreviousChord: PlacedChord | undefined, previousChord: PlacedChord | undefined, dontRepeat: boolean): Tonality {
    const tonalities: Array<Tonality> = this.getSibblingTonalities(previousPreviousChord, previousChord, dontRepeat);
    if (tonalities.length > 0) {
      return tonalities[this.commonService.getRandomIntegerBetween(0, tonalities.length - 1)];
    } else {
      // If no previous chord is specified then randomly pick a tonality
      const onlyMajor: boolean = this.settingsService.getSettings().generateOnlyMajorTonalities;
      const dontRepeat: boolean = true; // TODO Have a preference
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

  private generateMelodyChords(soundtrack: Soundtrack, harmonyMeasures: Array<Measure>, defaultOctave: number, chordDuration: number, velocity: number, fromTrack: Track | undefined, fromMeasure: Measure | undefined, fromChord: PlacedChord | undefined, pickedNoteChroma: string | undefined, pickedNoteOctave: number | undefined): Array<PlacedChord> {
    const melodyChords: Array<PlacedChord> = new Array();
    let measureIndex: number = 0;
    let melodyChordIndex: number = 0;

    if (fromTrack && fromMeasure && fromChord) {
      const keptMeasures: Array<Measure> = this.copyUntilExcludingChord(fromTrack, fromMeasure, fromChord);
      if (keptMeasures.length > 0) {
        for (const keptMeasure of keptMeasures) {
          for (const keptChord of keptMeasure.getSortedChords()) {
            melodyChords.push(keptChord);
          }
        }
      }

      const fromHarmonyChord: PlacedChord = this.notationService.getHarmonyChordFromMelodyChord(soundtrack, fromMeasure.index, fromChord.index);

      if (pickedNoteChroma && pickedNoteOctave) {
        // The melody is recreated from a note with having picked a note to be used
        const notes: Array<Note> = this.notationService.createChordNotesFromChromaOctaves([[pickedNoteChroma, pickedNoteOctave]]);
        const noteDuration: number = this.notationService.harmonyChordDuratioToMelodyNoteDuration(chordDuration);
        const placedChord: PlacedChord = this.notationService.createPlacedChordFromNotes(noteDuration, velocity, fromHarmonyChord.tonality, fromChord.index, notes);
        melodyChords.push(placedChord);
        melodyChordIndex = fromChord.index + 1;
      } else {
        // The melody is recreated from a note without having picked any note to be used
        melodyChordIndex = fromChord.index;
      }

      // Create the notes in the measure
      const harmonyChords: Array<PlacedChord> = harmonyMeasures[fromMeasure.index].getSortedChords();
      const fromChordStartTime: number = this.notationService.getPlacedChordStartTime(soundtrack, TRACK_INDEX_MELODY, fromMeasure.index, melodyChordIndex);
      for (let j: number = fromHarmonyChord.index; j < harmonyChords.length; j++) {
        const harmonyChord: PlacedChord = harmonyChords[j];
        const harmonyChordStartTime: number = this.notationService.getPlacedChordStartTime(soundtrack, TRACK_INDEX_HARMONY, fromMeasure.index, harmonyChord.index);
        let previousMelodyChord: PlacedChord | undefined = melodyChords.length > 0 ? melodyChords[melodyChords.length - 1] : undefined;

        let nbNotes: number = 0;
        // For the matching harmony chord, create only one following note if a picked note was already created
        if (harmonyChord.index == fromHarmonyChord.index && harmonyChordStartTime == fromChordStartTime) {
          if (pickedNoteChroma && pickedNoteOctave) {
            nbNotes = 1;
          } else {
            nbNotes = 2;
          }
        } else if (harmonyChord.index > fromHarmonyChord.index) {
          // For the harmony chords following the picked one, allow creating multiple notes
          nbNotes = 2;
        }
        if (nbNotes > 0) {
          const multiple: boolean = nbNotes > 1;
          const melodyChordsForOneHarmonyChord: Array<PlacedChord> = this.generateMelodyChordsForAnHarmonyChord(melodyChordIndex, previousMelodyChord, harmonyChord, defaultOctave, chordDuration, velocity, multiple);
          for (let k: number = 0; k < melodyChordsForOneHarmonyChord.length; k++) {
            const melodyChord: PlacedChord = melodyChordsForOneHarmonyChord[k];
            const melodyChordStartTime: number = this.notationService.addChordStartTime(melodyChords, melodyChord);
            if (melodyChordStartTime > fromChordStartTime) {
              melodyChords.push(melodyChord);
              melodyChordIndex++;
            }
          }
        }
      }

      measureIndex = fromMeasure.index + 1;
    }

    // Create the notes of the following measures
    for (let i: number = measureIndex; i < harmonyMeasures.length; i++) {
      const harmonyMeasure: Measure = harmonyMeasures[i];
      const harmonyChords: Array<PlacedChord> = harmonyMeasure.getSortedChords();
      melodyChordIndex = 0;
      for (let j: number = 0; j < harmonyChords.length; j++) {
        const harmonyChord: PlacedChord = harmonyChords[j];
        const previousMelodyChord: PlacedChord | undefined = melodyChords.length > 0 ? melodyChords[melodyChords.length - 1] : undefined;
        const melodyChordsForOneHarmonyChord: Array<PlacedChord> = this.generateMelodyChordsForAnHarmonyChord(melodyChordIndex, previousMelodyChord, harmonyChord, defaultOctave, chordDuration, velocity, true);
        for (let k: number = 0; k < melodyChordsForOneHarmonyChord.length; k++) {
          melodyChords.push(melodyChordsForOneHarmonyChord[k]);
          melodyChordIndex++;
        }
      }
    }

    this.notationService.addEndOfTrackNote(melodyChords);

    return melodyChords;
  }

  // Collect the notes from the harmony chord plus the inpassing notes
  public collectPossibleMelodyNotesFromHarmonyChord(harmonyChord: PlacedChord, previousMelodyChord: PlacedChord | undefined, melodyChord: PlacedChord | undefined, withInpassing: boolean): Array<string> {
    let collection: Array<[string, number]> = new Array();
    const sortedNotes: Array<Note> = harmonyChord.getNotesSortedByIndex();
    for (let i: number = 0; i < sortedNotes.length; i++) {
      const reverse: number = sortedNotes.length - i - 1;
      const note: Note = sortedNotes[reverse];
      collection.push([note.renderChroma(), note.renderOctave()]);
    }
    if (withInpassing && previousMelodyChord && melodyChord && this.notationService.allowInpassingNotes(previousMelodyChord, melodyChord)) {
      const previousMelodyChroma: string | undefined = this.notationService.getFirstChordNoteSortedByIndex(previousMelodyChord).renderChroma();
      const octave: number = previousMelodyChord ? this.notationService.getFirstChordNoteSortedByIndex(previousMelodyChord).renderOctave() : this.settingsService.getSettings().generateNoteOctave;
      for (const chroma of this.getInpassingNotes(harmonyChord, previousMelodyChroma, octave)) {
        collection.push([chroma, octave]);
      }
    }

    const octaveAbove: Array<[string, number]> = new Array();
    for (const [chroma, octave] of collection) {
      if (octave < OCTAVE_MAX) {
        octaveAbove.push([chroma, octave + 1]);
      }
    }

    const octaveBelow: Array<[string, number]> = new Array();
    for (const [chroma, octave] of collection) {
      if (octave > OCTAVE_MIN) {
        octaveBelow.push([chroma, octave - 1]);
      }
    }

    collection = octaveAbove.concat(collection);
    collection = collection.concat(octaveBelow);

    const textNotes: Array<string> = collection
      .map(([chroma, octave]: [string, number]) => {
        return this.notationService.renderIntlChromaOctave(chroma, octave)
      });
    return textNotes;
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

  private generateMelodyChordsForAnHarmonyChord(placedChordIndex: number, previousMelodyChord: PlacedChord | undefined, harmonyChord: PlacedChord, defaultOctave: number, chordDuration: number, velocity: number, multiple: boolean): Array<PlacedChord> {
    const melodyChords: Array<PlacedChord> = new Array();
    const previousMelodyChroma: string | undefined = previousMelodyChord ? this.notationService.getFirstChordNoteSortedByIndex(previousMelodyChord).renderChroma() : undefined;
    const previousMelodyOctave: number = previousMelodyChord ? this.notationService.getFirstChordNoteSortedByIndex(previousMelodyChord).renderOctave() : defaultOctave;

    if (!harmonyChord.isEndOfTrackPlacedChord()) {
      // For each harmony chord of the harmony track, there are two single note chords of half duration in the melody track
      // The first melody note is one of the harmony chord, and the second melody note is also a note from the same harmony chord or an inpassing note
      // An inpassing note is one that is not in the harmony chord but that is between the previous melody note and another note of the harmony chord even if of another octave
      // So an inpassing note cannot be followed by another inpassing note, but a harmony chord note can be followed by another harmony chord note
      // A melody note of a harmony chord must also be near the previous melody note

      // Get the first note as one of the harmony chord notes
      const [firstMelodyChroma, firstMelodyOctave]: [string, number] = this.pickMelodyNoteFromHarmonyChord(harmonyChord, previousMelodyChroma, previousMelodyOctave);
      const noteDuration: number = this.notationService.harmonyChordDuratioToMelodyNoteDuration(chordDuration);
      const notes: Array<Note> = this.notationService.createMelodyChordNotes(firstMelodyChroma, firstMelodyOctave, false);
      let melodyChord: PlacedChord = this.notationService.createPlacedChordFromNotes(noteDuration, velocity, harmonyChord.tonality, placedChordIndex, notes);
      melodyChords.push(melodyChord);

      if (multiple) {
        // Get the second note as an in passing note or as one one of the harmony chord notes
        let inpassingTextNote: string | undefined;
        if (this.fromInpassingNote()) {
          inpassingTextNote = this.pickInpassingNote(harmonyChord, firstMelodyChroma, firstMelodyOctave);
        }
        if (inpassingTextNote) {
          const [inpassingNoteChroma, inpassingNoteOctave]: [string, number] = this.notationService.noteToChromaOctave(inpassingTextNote);
          const notes: Array<Note> = this.notationService.createMelodyChordNotes(inpassingNoteChroma, inpassingNoteOctave, true);
          melodyChord = this.notationService.createPlacedChordFromNotes(noteDuration, velocity, harmonyChord.tonality, placedChordIndex + 1, notes);
          melodyChords.push(melodyChord);
        } else {
          // Get one of the harmony chord notes even the already picked one
          const [secondMelodyChroma, secondMelodyOctave]: [string, number] = this.pickMelodyNoteFromHarmonyChord(harmonyChord, firstMelodyChroma, firstMelodyOctave);
          // If the second note is the same as the fisrt one then have only one chord
          // but with a duration that is twice as long
          if (secondMelodyChroma == firstMelodyChroma && secondMelodyOctave == firstMelodyOctave) {
            melodyChords[melodyChords.length - 1].duration = this.notationService.createDuration(chordDuration, TempoUnit.NOTE);
          } else {
            const notes: Array<Note> = this.notationService.createMelodyChordNotes(secondMelodyChroma, secondMelodyOctave, false);
            melodyChord = this.notationService.createPlacedChordFromNotes(noteDuration, velocity, harmonyChord.tonality, placedChordIndex + 1, notes);
            melodyChords.push(melodyChord);
          }
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

  private generateHarmonyChordsInMeasures(generateNbChords: number, octave: number, chordDuration: number, velocity: number, fromTrack: Track | undefined, fromMeasure: Measure | undefined, fromChord: PlacedChord | undefined, pickedChordChroma: string | undefined, pickedChordOctave: number | undefined, pickedTonality: Tonality | undefined): Array<Measure> {
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

    while (chordNumber < generateNbChords) {
      previousPreviousChord = previousChord;
      previousChord = harmonyChord;

      if (pickedTonality) {
        tonality = pickedTonality;
        // Avoid using the bonus table when changing of tonality as no chroma can then be found
        previousChord = undefined;
      }

      // The number of beats of the chords placed in a measure must equal the number of beats of the measure
      if (measure.getPlacedChordsNbBeats() >= measure.getNbBeats()) {
        measureIndex++;
        measure = this.createMeasure(measureIndex);
        measure.placedChords = new Array<PlacedChord>();
        measures.push(measure);
        measureChordIndex = 0;
        if (this.withModulation()) {
          // Do not overwrite the first tonality
          // as it's configured in the settings
          if (chordNumber > 0) {
            const randomTonality: Tonality = this.getSibblingTonality(previousPreviousChord, previousChord, true);
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

    const chromaIndex: number = this.notationService.getChromaIndexInTonality(tonalityChromas, chroma);
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
    const bonusRandom: number = this.settingsService.getSettings().generateBonusRandom;
    // If a minimum bonus is specified then do not consider the chromas that have a lower bonus
    const bonusMin: number = this.settingsService.getSettings().generateBonusMin;

    const previousChromaIndex: number = this.notationService.getChromaIndexInTonality(tonalityChromas, previousChroma);
    const chromaBonuses: Array<number> = this.getChromaBonuses(previousChromaIndex);
    const electedChromas: Array<number> = new Array();
    for (let index = 0; index < chromaBonuses.length; index++) {
      let chromaBonus: number = chromaBonuses[index];
      if ((bonusMin > 0 && chromaBonus >= bonusMin) || 0 === bonusMin) {
        chromaBonus += bonusRandom;
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
