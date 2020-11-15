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
import { RANDOM_METHOD, C_TONALITY_CHROMAS } from './notation.constant ';

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

  private createNotesAndPlacedChord(octave: number, chordDuration: number, velocity: number, placedChordIndex: number, chord: Array<string>): PlacedChord {
    let noteIndex: number = 0;
    const notes: Array<Note> = chord.map((textNote: string) => {
      const note: Note = this.notationService.createNote(noteIndex, textNote, octave);
      noteIndex++;
      return note;
    });
    return this.notationService.createPlacedChord(placedChordIndex, chordDuration, TempoUnit.DUPLE, velocity, notes);
  }

  private createMeasures(generatedChords: Array<PlacedChord>): Array<Measure> {
    let measureIndex: number = 0;
    let chordIndex: number = 0;
    const measures: Array<Measure> = new Array<Measure>();
    const tempoBpm: number = this.settingsService.getSettings().generateTempoBpm;
    const timeSignatureNumerator: number = this.settingsService.getSettings().generateTimeSignatureNumerator;
    const timeSignatureDenominator: number = this.settingsService.getSettings().generateTimeSignatureDenominator;
    let measure: Measure = this.notationService.createMeasure(measureIndex, tempoBpm, timeSignatureNumerator, timeSignatureDenominator);
    measure.placedChords = new Array<PlacedChord>();
    generatedChords
      .forEach((placedChord: PlacedChord) => {
        if (measure.placedChords) {
          // The number of beats of the chords placed in a measure must equal the number of beats of the measure
          if (measure.getPlacedChordsNbBeats() >= measure.getNbBeats()) {
            measures.push(measure);
            measure = this.notationService.createMeasure(measureIndex, tempoBpm, timeSignatureNumerator, timeSignatureDenominator);
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
    const harmonyChords: Array<PlacedChord> = this.generateHarmonyChords(randomMethod, octave, chordDuration, harmonyVelocity);

    const melodyVelocity: number = this.settingsService.percentageToVelocity(this.settingsService.getSettings().generateVelocityMelody);
    const melodyChords: Array<PlacedChord> = this.generateMelodyChords(harmonyChords, randomMethod, octave, chordDuration, melodyVelocity);

    this.notationService.addEndOfTrackNote(harmonyChords);
    this.notationService.addEndOfTrackNote(melodyChords);

    const generateMelody: boolean = this.settingsService.getSettings().generateMelody;
    if (generateMelody) {
      const melodyTrack: Track = soundtrack.addTrack(this.createMeasures(melodyChords));
      melodyTrack.name = this.getTrackName(TRACK_TYPES.MELODY);
    }

    const generateHarmony: boolean = this.settingsService.getSettings().generateHarmony;
    if (generateHarmony) {
      const harmonyTrack: Track = soundtrack.addTrack(this.createMeasures(harmonyChords));
      harmonyTrack.name = this.getTrackName(TRACK_TYPES.HARMONY);
      harmonyTrack.displayChordNames = true;
    }

    const generateDrums: boolean = this.settingsService.getSettings().generateDrums;
    if (generateDrums) {
      const drumsChords: Array<PlacedChord> = new Array();
      const drumsTrack: Track = soundtrack.addTrack(this.createMeasures(drumsChords));
      drumsTrack.name = this.getTrackName(TRACK_TYPES.DRUMS);
      drumsTrack.displayChordNames = true;
    }

    const generateBass: boolean = this.settingsService.getSettings().generateBass;
    if (generateBass) {
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
    items.map((chroma: string) => {
      shiftedItems.push(chroma);
    })

    // Shift the copy and not the original
    const item: string | undefined = shiftedItems.shift();
    shiftedItems.push(item!);
    return shiftedItems;
  }

  private createArrayShiftOnceRight(items: Array<string>): Array<string> {
    // Make a deep copy
    let shiftedItems: Array<string> = new Array();
    items.map((chroma: string) => {
      shiftedItems.push(chroma);
    })

    // Shift the copy and not the original
    const item: string | undefined = shiftedItems.pop();
    shiftedItems.unshift(item!);
    return shiftedItems;
  }

  // Create a chromas array shifted from another one
  private createShiftedChromas(chromas: Array<string>): Array<string> {
    for (var i = 0; i < this.CHROMA_SHIFT_TIMES; i++) {
      chromas = this.createArrayShiftOnceLeft(chromas);
    }
    return chromas;
  }

  private getDefaultTonalityChromas(): string[] {
    return C_TONALITY_CHROMAS;
  }

  // Create all the shifted chromas arrays for a chord width
  private createAllShiftedChromas(): Array<Array<string>> {
    const shiftedChromas: Array<Array<string>> = new Array();
    // Create shifted chromas, each starting some notes down the previous chroma
    // The number of shifted chromas is the width of the chord
    //  Do Re.m  Mi.m  Fa  Sol  La.m  Si-
    // 'C', 'D', 'E', 'F', 'G', 'A', 'B'
    // 'E', 'F', 'G', 'A', 'B', 'C', 'D'
    // 'G', 'A', 'B', 'C', 'D', 'E', 'F'

    // Build the shifted chromas
    shiftedChromas[0] = this.getDefaultTonalityChromas();
    const chordWidth: number = this.settingsService.getSettings().generateChordWidth;
    for (let index = 1; index < chordWidth; index++) {
      shiftedChromas[index] = this.createShiftedChromas(shiftedChromas[index - 1]);
    }
    return shiftedChromas;
  }

  // Check if the chord shares a minimum number of notes with its previous chord
  private isSimilarToPrevious(previousChord: Array<string>, chord: Array<string>): boolean {
    let nbSameNotes: number = 0;
    for (var i = 0; i < this.settingsService.getSettings().generateChordWidth; i++) {
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
  private getInpassingNearNotes(harmonyChordChromas: Array<string>, previousMelodyChroma: string, previousMelodyOctave: number): Array<string> {
    const nearNotes: Array<string> = new Array<string>();
    let chromas: Array<string> = this.getDefaultTonalityChromas();
    const previousMelodyNoteIndex: number = this.getDefaultTonalityChromas().indexOf(previousMelodyChroma);

    // The maximum near distance to consider
    const NEAR_MAX: number = 2; // TODO Have this constant as a settings

    // Consider the chromas above the previous melody note chroma
    for (let chromaIndex: number = 0; chromaIndex < NEAR_MAX; chromaIndex++) {
      chromas = this.createArrayShiftOnceLeft(chromas);
      // Consider only notes non added yet
      if (!harmonyChordChromas.includes(chromas[previousMelodyNoteIndex])) {
        // Check if the note is on the upper octave
        let octave = previousMelodyOctave;
        if (previousMelodyNoteIndex + chromaIndex >= this.getDefaultTonalityChromas().length) {
          octave++;
        }
        nearNotes.push(chromas[previousMelodyNoteIndex] + octave);
      } else {
        break;
      }
    }

    // Consider the chromas below the previous melody note chroma
    chromas = this.getDefaultTonalityChromas();
    for (let chromaIndex: number = 0; chromaIndex < NEAR_MAX; chromaIndex++) {
      chromas = this.createArrayShiftOnceRight(chromas);
      // Consider only notes non added yet
      if (!harmonyChordChromas.includes(chromas[previousMelodyNoteIndex])) {
        // Check if the note is on the lower octave
        let octave = previousMelodyOctave;
        if (previousMelodyNoteIndex - chromaIndex <= 0) {
          octave--;
        }
        nearNotes.push(chromas[previousMelodyNoteIndex] + octave);
      } else {
        break;
      }
    }

    return nearNotes;
  }

  private pickInpassingNote(harmonyChordChromas: Array<string>, previousMelodyChroma: string, previousMelodyOctave: number): string {
    // Randomly pick a note from the near ones
    const nearNotes: Array<string> = this.getInpassingNearNotes(harmonyChordChromas, previousMelodyChroma, previousMelodyOctave);
    const nearNoteIndex: number = this.commonService.getRandomIntegerBetween(0, nearNotes.length - 1);
    return nearNotes[nearNoteIndex];
  }

  // Get a note from the source chord that is near the previous melody note
  // The octave remains the same as the one from the source chord
  private getNearNotesFromSourceChord(harmonyChordChromas: Array<string>, previousMelodyChroma: string, previousMelodyOctave: number): Array<[ string, number ]> {
    const nearNoteChromas: Array<[ string, number ]> = new Array<[ string, number ]>();
    let chromas: Array<string> = this.getDefaultTonalityChromas();
    const previousMelodyNoteIndex: number = this.getDefaultTonalityChromas().indexOf(previousMelodyChroma);

    // The maximum near distance to consider
    const NEAR_MAX: number = 2; // TODO Have this constant as a settings

    for (let noteIndex = 0; noteIndex < harmonyChordChromas.length; noteIndex++) {
      const harmonyChordChroma: string = harmonyChordChromas[noteIndex];
      // Avoid the previous chroma
      if (harmonyChordChroma != previousMelodyChroma) {
        if (Math.abs(chromas.indexOf(harmonyChordChroma) - previousMelodyNoteIndex) <= NEAR_MAX) {
          nearNoteChromas.push([ harmonyChordChroma, previousMelodyOctave ]);
        }
      }
    }

    // If no note was near enough to be added then use the previous note
    if (nearNoteChromas.length == 0) {
      nearNoteChromas.push([ previousMelodyChroma, previousMelodyOctave ]);
    }

    return nearNoteChromas;
  }

  // Pick a melody note from the harmony chord that is near the previous melody note
  private pickNearNoteFromSourceChord(harmonyChordChromas: Array<string>, previousMelodyChroma: string | undefined, previousMelodyOctave: number): [ string, number ] {
    if (previousMelodyChroma && previousMelodyOctave) {
      const nearNotes: Array<[ string, number ]> = this.getNearNotesFromSourceChord(harmonyChordChromas, previousMelodyChroma, previousMelodyOctave);
      const nearNoteIndex: number = this.commonService.getRandomIntegerBetween(0, nearNotes.length - 1);
      return nearNotes[nearNoteIndex];
    } else {
      // If no previous note then pick any note from the source chord
      const nearNoteIndex: number = this.commonService.getRandomIntegerBetween(0, harmonyChordChromas.length - 1);
      return [ harmonyChordChromas[nearNoteIndex], previousMelodyOctave ];
    }
  }

  private generateMelodyChords(harmonyChords: Array<PlacedChord>, randomMethod: number, octave: number, chordDuration: number, velocity: number): Array<PlacedChord> {
    const melodyChords: Array<PlacedChord> = new Array();
    let placedChordIndex: number = 0;
    let currentMelodyChroma: string | undefined;
    let currentMelodyOctave: number = octave;

    harmonyChords.forEach((harmonyChord: PlacedChord) => {
      if (RANDOM_METHOD.HARMONY_BASE == randomMethod) {
        // For each source chord of the harmony track, there are two single note chords of half duration in the melody track
        // The first melody note is one of the source chord, and the second melody note is also a note from the same source chord or an inpassing note
        // An inpassing note is one that is not in the source chord but that is between the previous melody note and another note of the source chord even if of another octave
        // So an inpassing note cannot be followed by another inpassing note, but a source chord note can be followed by another source chord note
        // A melody note of a source chord must also be near the previous melody note

        // Get one of the source chord notes
        const [ firstMelodyChroma, firstMelodyOctave ]: [string, number] = this.pickNearNoteFromSourceChord(harmonyChord.getNotesChromas(), currentMelodyChroma, currentMelodyOctave);
        currentMelodyChroma = firstMelodyChroma;
        currentMelodyOctave = firstMelodyOctave;
        // The duration is a quotient base and is thus multiplied by 2 to cut it in half
        const halfDuration: number = chordDuration * 2;
        let placedChord: PlacedChord = this.createNotesAndPlacedChord(octave, halfDuration, velocity, placedChordIndex, [ firstMelodyChroma ]);
        melodyChords.push(placedChord);
        placedChordIndex++;
        if (this.fromInpassingNote()) {
          const inpassingTextNote: string = this.pickInpassingNote(harmonyChord.getNotesChromas(), currentMelodyChroma, currentMelodyOctave);
          const inpassingChromaAndOctave: Array<string> = this.notationService.noteToChromaOctave(inpassingTextNote);
          const inpassingNoteChroma: string = inpassingChromaAndOctave[0];
          let inpassingNoteOctave: number = 0;
          if (inpassingChromaAndOctave.length > 1) {
            inpassingNoteOctave = Number(inpassingChromaAndOctave[1]);
          } else {
            throw new Error('Unspecified octave for the inpassing note: ' + inpassingTextNote + ' with chroma: ' + inpassingNoteChroma);
          }
          placedChord = this.createNotesAndPlacedChord(inpassingNoteOctave, halfDuration, velocity, placedChordIndex, [ inpassingNoteChroma ]);
          melodyChords.push(placedChord);
          currentMelodyChroma = inpassingNoteChroma;
          currentMelodyOctave = inpassingNoteOctave;
        } else {
          // Get one of the source chord notes even the already picked one
          const [ secondMelodyChroma, secondMelodyOctave ]: [string, number] = this.pickNearNoteFromSourceChord(harmonyChord.getNotesChromas(), currentMelodyChroma, currentMelodyOctave);
          if (secondMelodyChroma == firstMelodyChroma && secondMelodyOctave == firstMelodyOctave) {
            // If the second note is the same as the fisrt one then have only one chord
            // but with a duration that is twice as long
            melodyChords[melodyChords.length - 1].duration = this.notationService.createDuration(chordDuration, TempoUnit.DUPLE);
          } else {
            placedChord = this.createNotesAndPlacedChord(secondMelodyOctave, halfDuration, velocity, placedChordIndex, [ secondMelodyChroma ]);
            melodyChords.push(placedChord);
            currentMelodyChroma = secondMelodyChroma;
            currentMelodyOctave = secondMelodyOctave;
          }
        }
      } else {
        // Get the first note of the source chord notes
        const melodyChroma: string = harmonyChord.getNotesChromas()[0];
        const placedChord: PlacedChord = this.createNotesAndPlacedChord(octave, chordDuration, velocity, placedChordIndex, [ melodyChroma ]);
        melodyChords.push(placedChord);
      }
    });
    return melodyChords;
  }

  private generateHarmonyChords(randomMethod: number, octave: number, chordDuration: number, velocity: number): Array<PlacedChord> {
    const placedChords: Array<PlacedChord> = new Array();
    let previousNotes: Array<string> = new Array();
    let previousChromaNoteIndex: number = 0;
    let placedChordIndex: number = 0;

    const shiftedChromas: Array<Array<string>> = this.createAllShiftedChromas();

    const generateNbChords: number = this.settingsService.getSettings().generateNbChords > 0 ? this.settingsService.getSettings().generateNbChords : 1;
    while (placedChordIndex < generateNbChords) {
      const notes: Array<string> = new Array();

      // For each randomly picked chroma, add its chord to an array
      const chromaNoteIndex: number = (placedChordIndex === 0) ? 0 : this.randomlyPickChroma(previousChromaNoteIndex, randomMethod);
      for (let noteIndex = 0; noteIndex < this.settingsService.getSettings().generateChordWidth; noteIndex++) {
        notes.push(shiftedChromas[noteIndex][chromaNoteIndex]);
      }

      // Consider a chord only if it is similar to its previous one
      if (placedChords.length === 0 || this.isSimilarToPrevious(previousNotes, notes)) {
        previousChromaNoteIndex = chromaNoteIndex;
        previousNotes = notes;
        const placedChord: PlacedChord = this.createNotesAndPlacedChord(octave, chordDuration, velocity, placedChordIndex, notes);
        placedChords.push(placedChord);
        placedChordIndex++;
        // Add twice the same chord
        if (this.settingsService.getSettings().generateDoubleChord) {
          const placedChordBis: PlacedChord = this.createNotesAndPlacedChord(octave, chordDuration, velocity, placedChordIndex, notes);
          placedChords.push(placedChordBis);
          placedChordIndex++;
        }
      } else {
        // If the current chord is too dissimilar from its previous one
        // then create a chord from a reversing of the previous one
        if (this.settingsService.getSettings().generateReverseDissimilarChord) {
          const slidedNotes: Array<string> = this.createShiftedChord(previousNotes);
          const placedChord: PlacedChord = this.createNotesAndPlacedChord(octave, chordDuration, velocity, placedChordIndex, slidedNotes);
          placedChords.push(placedChord);
          placedChordIndex++;
        }
      }
    }
    return placedChords;
  }

  private randomlyPickChroma(chromaIndex: number, randomMethod: number): number {
    if (RANDOM_METHOD.BASE == randomMethod) {
      return this.randomlyPickChromaFromBaseChromas(chromaIndex);
    } else if (RANDOM_METHOD.BONUS_TABLE == randomMethod) {
      return this.randomlyPickChromaFromChromasPool(chromaIndex);
    } else if (RANDOM_METHOD.HARMONY_BASE == randomMethod) {
      return this.randomlyPickChromaFromChromasPool(chromaIndex);
    } else {
      throw new Error('The selected generation method does not exist.');
    }
  }

  private randomlyPickChromaFromBaseChromas(chromaIndex: number): number {
    return this.commonService.getRandomIntegerBetweenAndExcept(0, this.getDefaultTonalityChromas().length - 1, [ chromaIndex ])
  }

  // The table of bonus per chroma
  // For a given chroma there is a series of bonus numbers
  // A bonus represents the level of harmony between a chroma and its following chroma
  // The chromas are indexed in the chromas alphabetical array
  private getBonusTable(): Array<Array<number>> {
    const matrix: Array<Array<number>> = [
    //  C  D  E  F  G  A  B
      [ 30, 0, 15, 5, 5, 10, 0 ],
      [ 0, 30, 0, 10, 0, 5, 10 ],
      [ 15, 0, 30, 0, 10, 0, 0 ],
      [ 5, 10, 0, 30, 0, 15, 0 ],
      [ 5, 0, 10, 0, 30, 0, 10 ],
      [ 10, 5, 0, 15, 0, 30, 0 ],
      [ 0, 10, 0, 0, 10, 0, 30 ]
    ];
    return matrix;
  }

  private getChromaBonuses(chromaIndex: number): Array<number> {
    return this.getBonusTable()[chromaIndex];
  }

  private buildUpChromasPoolFromBonuses(chromaIndex: number): Array<number> {
    const RANDOMLINESS: number = 0;
    const MIN_BONUS: number = 3;
    const chromaBonuses: Array<number> = this.getChromaBonuses(chromaIndex);
    let currentChromaIndex: number = 0;
    const chromasPool: Array<number> = new Array();
    chromaBonuses.forEach((chromaBonus: number) => {
      // If a minimum bonus is specified then do not consider the chromas that have a lower bonus
      if ((MIN_BONUS > 0 && chromaBonus >= MIN_BONUS) || 0 === MIN_BONUS) {
        // The higher the more random
        chromaBonus += RANDOMLINESS;
        for (let nb = 0; nb < chromaBonus; nb++) {
          chromasPool.push(currentChromaIndex);
        }
      }
      currentChromaIndex++;
    });
    return chromasPool;
  }

  private randomlyPickChromaFromChromasPool(chromaIndex: number): number {
    const chromasPool: Array<number> = this.buildUpChromasPoolFromBonuses(chromaIndex);
    const randomChromaIndex: number = this.commonService.getRandomIntegerBetween(0, chromasPool.length - 1);
    return chromasPool[randomChromaIndex];
  }

}
