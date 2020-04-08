import { Injectable } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { Measure } from '../../model/measure/measure';
import { ParseService } from './parse.service';
import { SoundtrackService } from '../../views/soundtrack/soundtrack.service';
import { Soundtrack } from '@app/model/soundtrack';
import { CommonService } from './common.service';

const MIDI_NOTE_MIN = 0;
const MIDI_NOTE_MAX = 128;
const MIDI_NOTE_DURATION = 300;

@Injectable({
  providedIn: 'root'
})
export class MelodyService {

  constructor(
    private soundtrackService: SoundtrackService,
    private commonService: CommonService,
    private parseService: ParseService,
  ) { }

  public addDummyMelody() {
    const textMeasures = ['rest/4 B4|A4|F5/16 A4|A5|B5/16 G#4|C6|G5/16 A4/16',
      'C5/8 rest/8 D5/16 C5/16 B4/16 C5/16',
      'E5/8 rest/8 F5/16 E5/16 D#5/16 E5/16',
      'B5/16 A5/16 G#5/16 A5/16 B5/16 A5/16 G#5/16 A5/16',
      'C6/4 A5/8 C6/8',
      'B5/8 A5/8 G5/8 A5/8',
      'B5/8 A5/8 G5/8 A5/8',
      'B5/8 A5/8 G5/8 F#5/8',
      'E5/4'];

    const soundtrackName = 'Demo soundtrack';
    const measures: Array<Measure> = this.parseService.parseMeasures(textMeasures);
    const soundtrack: Soundtrack = this.soundtrackService.createSoundtrackFromMeasures(soundtrackName, measures);
  }

  public getRandomMidiNotes$(): Observable<number> {
    return interval(MIDI_NOTE_DURATION)
      .pipe(
        map(data => this.commonService.getRandomIntegerBetween(MIDI_NOTE_MIN, MIDI_NOTE_MAX))
      );
  }

}
