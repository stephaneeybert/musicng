import { Injectable } from '@angular/core';
import { SoundtrackStore } from 'lib/store/soundtrack-store';
import { Soundtrack } from 'lib/model/soundtrack';
import { Measure } from 'lib/model/measure/measure';
import { ParseService } from './parse.service';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root'
})
export class MelodyService {

  constructor(
    private soundtrackStore: SoundtrackStore,
    private parseService: ParseService,
    private commonService: CommonService
  ) { }

  public addSomeMelodies() {
    const textMeasures = ['rest/4 B4/16 A4/16 G#4/16 A4/16',
    'C5/8 rest/8 D5/16 C5/16 B4/16 C5/16',
    'E5/8 rest/8 F5/16 E5/16 D#5/16 E5/16',
    'B5/16 A5/16 G#5/16 A5/16 B5/16 A5/16 G#5/16 A5/16',
    'C6/4 A5/8 C6/8',
    'B5/8 A5/8 G5/8 A5/8',
    'B5/8 A5/8 G5/8 A5/8',
    'B5/8 A5/8 G5/8 F#5/8',
    'E5/4'];

    const soundtrackName = 'Demo soundtrack';
    this.addSoundtrack(soundtrackName, textMeasures);
  }

  private addSoundtrack(name: string, textMeasures: Array<string>) {
    const measures: Array<Measure> = this.parseService.parseMeasuresDefaultTempo(textMeasures);
    const soundtrack: Soundtrack = new Soundtrack(this.commonService.normalizeName(name), name);
    soundtrack.addTrack(measures);
    this.soundtrackStore.addSoundtrack(soundtrack);
  }

  private generateNotes() {
    // Using the 7 chromas, have 3 to 5 arrays, each starting 2 notes later,
    // get the first chord
    // get the next chord to the previous and count the number of common chromas
    // if the number is above a threshold then keep the note in an array
  }

}
