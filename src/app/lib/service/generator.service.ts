import { Injectable } from '@angular/core';
import { Measure } from '../../model/measure/measure';
import { NotationService } from './notation.service';
import { PlacedChord } from '../../model/note/placed-chord';
import { Note } from '../../model/note/note';
import { SoundtrackService } from '../../views/soundtrack/soundtrack.service';
import { CommonService } from './common.service';
import { TranslateService } from '@ngx-translate/core';
import { Soundtrack } from '@app/model/soundtrack';

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
  CHORDS_PER_MEASURE: number = 4;
  SIMILAR_NOTE_MIN: number = 2;
  CHORD_DURATION = '8'; // TODO What duration to use ?
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
        return this.notationService.createPlacedChord(this.CHORD_DURATION, notes)
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
          if (measure.placedChords.length >= this.CHORDS_PER_MEASURE) {
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

  // The table of malus per chroma
  // For a given chroma there is a series of malus numbers
  // A malus represents the level of dissonance by a following chroma
  // The chromas are indexed in the chromas alphabetical array
  private getMalusTable(): Array<Array<number>> {
    const matrix: Array<Array<number>> = [
    //  C  D  E  F  G  A  B
      [ 0, 5, 1, 3, 3, 2, 5 ],
      [ 5, 0, 5, 2, 4, 3, 2 ],
      [ 1, 5, 0, 4, 2, 5, 4 ],
      [ 3, 2, 4, 0, 6, 1, 4 ],
      [ 3, 4, 2, 6, 0, 5, 2 ],
      [ 2, 3, 5, 1, 5, 0, 5 ],
      [ 5, 2, 4, 4, 2, 5, 0 ]
    ];
    return matrix;
  }

  private getChromaMaluses(chromaIndex: number): Array<number> {
    return this.getMalusTable()[chromaIndex];
  }

  private buildUpChromasPoolFromMaluses(chromaIndex: number): Array<number> {
    // The higher the more random
    const RANDOMLINESS: number = 5;
    const MAX_MALUS: number = 3;
    const chromaMaluses: Array<number> = this.getChromaMaluses(chromaIndex);
    let currentChromaIndex: number = 0;
    const chromasPool: Array<number> = new Array();
    chromaMaluses.forEach((chromaMalus: number) => {
      const chromaBonus: number = RANDOMLINESS - chromaMalus;
      // If a maximum malus is specified then do not consider the chromas that have a higher malus
      if ((MAX_MALUS > 0 && chromaBonus > (RANDOMLINESS - MAX_MALUS)) || 0 == MAX_MALUS) {
        for (let nb = 0; nb < chromaBonus; nb++) {
          chromasPool.push(currentChromaIndex);
        }
      }
      currentChromaIndex++;
    });
    return chromasPool;
  }

  private randomlyPickChromaFromChromasPool(chromaIndex: number): number {
    const chromasPool: Array<number> = this.buildUpChromasPoolFromMaluses(chromaIndex);
    let pickedChromaIndex: number;
    do {
      const random: number = this.commonService.getRandomIntegerBetween(0, chromasPool.length - 1);
      pickedChromaIndex = chromasPool[random];
    // Avoid picking the same chroma as the previous one
    } while (pickedChromaIndex == chromaIndex)
    return pickedChromaIndex;
  }

}
