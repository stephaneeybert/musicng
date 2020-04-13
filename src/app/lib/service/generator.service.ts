import { Injectable } from '@angular/core';
import { Measure } from '../../model/measure/measure';
import { NotationService } from './notation.service';
import { PlacedChord } from '../../model/note/placed-chord';
import { Note } from '../../model/note/note';
import { SoundtrackService } from '../../views/soundtrack/soundtrack.service';
import { CommonService } from './common.service';
import { TranslateService } from '@ngx-translate/core';
import { Soundtrack } from '@app/model/soundtrack';
import { TempoUnit } from '@app/model/tempo-unit';

enum RANDOM_METHOD {
  BASE = 0,
  MALUS_TABLE = 1
}

@Injectable({
  providedIn: 'root'
})
export class GeneratorService {

  constructor(
    private commonService: CommonService,
    private soundtrackService: SoundtrackService,
    private notationService: NotationService,
    private translateService: TranslateService
  ) { }

  NB_CHORDS: number = 120;
  CHROMA_SHIFT_TIMES: number = 2;
  CHORD_WIDTH: number = 3;
  SIMILAR_NOTE_MIN: number = 2;
  CHORD_DURATION = 4; // TODO What duration to use ? Maybe a random duration per chord ?
  NOTE_OCTAVE: number = 4; // TODO What octave to use ?

  public generateSoundtrack(): Soundtrack {
    const generatedChords: Array<PlacedChord> = this.generateChords()
      .map((chord: Array<string>) => {
        let index: number = 0;
        const notes: Array<Note> = chord.map((textNote: string) => {
          const note: Note = this.notationService.createNote(index, textNote, this.NOTE_OCTAVE);
          index++;
          return note;
        })
        return this.notationService.createPlacedChord(this.CHORD_DURATION, TempoUnit.DUPLE, notes); // Maybe have a default chord unit ?
      });

    // Have a few end of track notes as a note may not be played by an unreliable synth
    this.notationService.addEndOfTrackNote(generatedChords);
    this.notationService.addEndOfTrackNote(generatedChords);
    this.notationService.addEndOfTrackNote(generatedChords);

    const measures: Array<Measure> = new Array<Measure>();
    let measure: Measure = this.notationService.createMeasureWithDefaultTempo();
    measure.placedChords = new Array<PlacedChord>();
    measures.push(measure);
    generatedChords
      .map((placedChord: PlacedChord) => {
        if (measure.placedChords) {
          // The number of beats of the chords placed in a measure must equal the number of beats of the measure
          if (measure.getPlacedChordsNbBeats() >= measure.getNbBeats()) {
            measure = this.notationService.createMeasureWithDefaultTempo();
            measure.placedChords = new Array<PlacedChord>();
            measures.push(measure);
          }
          measure.placedChords.push(placedChord);
        } else {
          throw new Error('The measure placed chords array has not been instantiated.');
        }
      });

    const soundtrack: Soundtrack = this.soundtrackService.createSoundtrackFromMeasures(this.assignNewName(), measures);
    return soundtrack;
  }

  private assignNewName(): string {
    return this.translateService.instant('soundtracks.assignedName') + '_' + this.commonService.getRandomString(4);
  }

  private createArrayShiftOnceLeft(items: Array<string>): Array<string> {
    // Make a deep copy
    let shiftedItems: Array<string> = new Array();
    items.map((chroma: string) => {
      shiftedItems.push(chroma);
    })

    // Shift the copy and not the original
    const item: string |undefined = shiftedItems.shift();
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
    const item: string |undefined = shiftedItems.pop();
    shiftedItems.unshift(item!);
    return shiftedItems;
  }

  private createShiftedChromas(chromas: Array<string>): Array<string> {
    for (var i = 0; i < this.CHROMA_SHIFT_TIMES; i++) {
      chromas = this.createArrayShiftOnceLeft(chromas);
    }
    return chromas;
  }

  // Check if the chord shares a minimum number of notes with its previous chord
  private isSimilarToPrevious(previousChord: Array<string>, chord: Array<string>): boolean {
    let nbSameNotes: number = 0;
    for (var i = 0; i < this.CHORD_WIDTH; i++) {
      if (previousChord.includes(chord[i])) {
        nbSameNotes++;
      }
    }
    return (nbSameNotes >= this.SIMILAR_NOTE_MIN);
  }

  private createShiftedChord(chord: Array<string>): Array<string> {
    return this.createArrayShiftOnceRight(chord);
  }

  private generateChords(): Array<Array<string>> {
    const shiftedChromas: Array<Array<string>> = new Array();
    const chords: Array<Array<string>> = new Array();
    // Create shifted chromas, each starting some notes down the previous chroma
    // The number of shifted chromas is the width of the chord
    //  Do Re.m  Mi.m  Fa  Sol  La.m  Si-
    // 'C', 'D', 'E', 'F', 'G', 'A', 'B'
    // 'A', 'B', 'C', 'D', 'E', 'F', 'G'
    // 'F', 'G', 'A', 'B', 'C', 'D', 'E'

    // Build the shifted chromas
    shiftedChromas[0] = this.notationService.chromasAlphabetical();
    for (let index = 1; index < this.CHORD_WIDTH; index++) {
      shiftedChromas[index] = this.createShiftedChromas(shiftedChromas[index - 1]);
    }

    let previousChord: Array<string> = new Array();
    let previousChromaNoteIndex: number = 0;
    let nbAddedChord: number = 0;
    while (nbAddedChord < this.NB_CHORDS) {
      const chord: Array<string> = new Array();

      // Start on the Do chord and then randomly pick a chord
      // TODO Change all == by ===
      const chromaNoteIndex = (nbAddedChord == 0) ? 0 : this.randomlyPickChroma(previousChromaNoteIndex);
      for (let noteIndex = 0; noteIndex < this.CHORD_WIDTH; noteIndex++) {
        chord.push(shiftedChromas[noteIndex][chromaNoteIndex]);
      }

      // Consider a chord only if it is similar to its previous one
      if (chords.length == 0 || this.isSimilarToPrevious(previousChord, chord)) {
        previousChromaNoteIndex = chromaNoteIndex;
        previousChord = chord;
        // Add twice the same chord
        chords.push(chord);
        nbAddedChord++;
        chords.push(chord); // TODO Do we still double the notes ?
        nbAddedChord++;
      } else {
        // TODO Do we still not reverse the notes ?
        // Create a chord from a variation on the previous one
        // const slidedChord: Array<string> = this.createShiftedChord(previousChord);
        // chords.push(chord);
        // nbAddedChord++;
      }
    }
    return chords;
  }

  private randomlyPickChroma(chromaIndex: number): number {
    const randomMethod: number = RANDOM_METHOD.MALUS_TABLE; // TODO Have a pref to choose the method
    switch (randomMethod) {
      case RANDOM_METHOD.BASE:
        return this.randomlyPickChromaFromBaseChromas(chromaIndex);
      case RANDOM_METHOD.MALUS_TABLE:
        return this.randomlyPickChromaFromChromasPool(chromaIndex);
      default:
        throw new Error('The selected random method does not exist.');
    }
  }

  private randomlyPickChromaFromBaseChromas(chromaIndex: number): number {
    return this.commonService.getRandomIntegerBetweenAndExcept(0, this.notationService.chromasAlphabetical().length - 1, [ chromaIndex ])
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
      if ((MIN_BONUS > 0 && chromaBonus >= MIN_BONUS) || 0 == MIN_BONUS) {
        // The higher the more random
        chromaBonus = RANDOMLINESS + chromaBonus;
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
    const random: number = this.commonService.getRandomIntegerBetween(0, chromasPool.length - 1);
    return chromasPool[random];
  }

}
