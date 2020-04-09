import { Injectable } from '@angular/core';
import { Measure } from '../../model/measure/measure';
import { ParseService } from './parse.service';
import { PlacedChord } from '../../model/note/placed-chord';
import { Note } from '../../model/note/note';
import { SoundtrackService } from '../../views/soundtrack/soundtrack.service';
import { CommonService } from './common.service';
import { TranslateService } from '@ngx-translate/core';
import { Soundtrack } from '@app/model/soundtrack';

@Injectable({
  providedIn: 'root'
})
export class GeneratorService {

  constructor(
    private commonService: CommonService,
    private soundtrackService: SoundtrackService,
    private parseService: ParseService,
    private translateService: TranslateService
  ) { }

  NB_CHORDS: number = 50;
  CHROMAS: Array<string> = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
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
          const note: Note = this.parseService.createNote(index, textNote, this.NOTE_OCTAVE);
          index++;
          return note;
        })
        return this.parseService.createPlacedChord(this.CHORD_DURATION, notes)
      });

    this.parseService.addLastOfTrackNote(generatedChords);

    const measures: Array<Measure> = new Array<Measure>();
    let measure: Measure = this.parseService.createMeasureWithDefaultTempo();
    measure.placedChords = new Array<PlacedChord>();
    measures.push(measure);
    generatedChords
      .map((placedChord: PlacedChord) => {
        if (measure.placedChords) {
          if (measure.placedChords.length >= this.CHORDS_PER_MEASURE) {
            measure = this.parseService.createMeasureWithDefaultTempo();
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
      chromas = this.createArrayShiftOnceRight(chromas);
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
    //  Do   Re   Mi   Fa   Sol  La   Si
    // 'C', 'D', 'E', 'F', 'G', 'A', 'B'
    // 'A', 'B', 'C', 'D', 'E', 'F', 'G'
    // 'F', 'G', 'A', 'B', 'C', 'D', 'E'

    // Build the shifted chromas
    shiftedChromas[0] = this.CHROMAS;
    for (let index = 1; index < this.CHORD_WIDTH; index++) {
      shiftedChromas[index] = this.createShiftedChromas(shiftedChromas[index - 1]);
    }

    let previousChord: Array<string> = new Array();
    let nbAddedChord: number = 0;
    while (nbAddedChord < this.NB_CHORDS) {
      const chord: Array<string> = new Array();

      // Randomly pick a chord
      for (let noteIndex = 0; noteIndex < this.CHORD_WIDTH; noteIndex++) {
        const chromaNoteIndex = this.commonService.getRandomIntegerBetween(0, this.CHROMAS.length - 1);
        chord.push(shiftedChromas[noteIndex][chromaNoteIndex]);
      }
      // Consider a chord only if it is similar to its previous one
      if (chords.length == 0 || this.isSimilarToPrevious(previousChord, chord)) {
        chords.push(chord);
        previousChord = chord;
      } else {
        // Create a chord from a variation on the previous one
        // const slidedChord: Array<string> = this.createShiftedChord(previousChord);
        // chords.push(chord);
      }
      nbAddedChord++;
    }
    return chords;
  }

}
