import Tone from 'tone';
import { Duration } from './duration/duration';

export class Cursor {

  measureNb: number;
  beatNb: number;
  noteTransportTime: Duration;

  constructor(measureNb: number, beatNb: number, noteTransportTime: Duration) {
    this.measureNb = measureNb;
    this.beatNb = beatNb;
    this.noteTransportTime = noteTransportTime;
  }

  public toTime() {
    return Tone.TransportTime(this.measureNb + ':' + this.beatNb).toSeconds() + this.noteTransportTime.toTime();
  }

}
