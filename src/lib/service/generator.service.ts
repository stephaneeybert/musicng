import { Injectable } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';

const MIDI_NOTE_MIN = 0;
const MIDI_NOTE_MAX = 128;
const MIDI_NOTE_DURATION = 300;

@Injectable({
  providedIn: 'root'
})
export class GeneratorService {

  constructor() { }

  public getRandomMidiNotes(): Observable<number> {
    return interval(MIDI_NOTE_DURATION)
      .pipe(
        map(data => Math.floor(Math.random() * MIDI_NOTE_MAX) + MIDI_NOTE_MIN)
      );
  }

}
