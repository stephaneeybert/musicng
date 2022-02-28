import { Injectable } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonService } from '@stephaneeybert/lib-core';

const MIDI_NOTE_MIN: number = 0;
const MIDI_NOTE_MAX: number = 128;
const MIDI_NOTE_DURATION: number = 300;

@Injectable({
  providedIn: 'root'
})
export class MelodyService {

  constructor(
    private commonService: CommonService,
  ) { }

  public getRandomMidiNotes$(): Observable<number> {
    return interval(MIDI_NOTE_DURATION)
      .pipe(
        map(data => this.commonService.getRandomIntegerBetween(MIDI_NOTE_MIN, MIDI_NOTE_MAX - 1))
      );
  }

}
