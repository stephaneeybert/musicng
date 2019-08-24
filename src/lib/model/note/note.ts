import { Pitch } from 'lib/model';
import { TempoUnit } from 'lib/model';

const NOTE_VELOCITY_MAX = 127;

export class Note {

  pitch: Pitch;
  velocity: number;
  ticks: number;
  time: number;
  duration: string; // TODO Maybe the duration should not be stored here
  // but in the cursor of the placed note instead ?

  constructor(pitch: Pitch, velocity: number) {
    this.pitch = pitch;
    if (velocity != null) {
      if (velocity >= 0 && velocity <= NOTE_VELOCITY_MAX) {
        this.velocity = velocity;
      } else {
        throw new Error('The velocity ' + velocity + ' must be greater or equal to 0 and lesser or equal to ' + NOTE_VELOCITY_MAX);
      }
    }
    this.ticks = null;
    this.duration = null;
  }

  public renderAbc(): string {
    return this.pitch.renderAbc();
  }

  public renderDuration(): string {
    if (this.ticks != null) {
      return this.ticks + TempoUnit.TICK;
    } else {
      return this.duration + TempoUnit.DUPLE; // TODO Why is it duple ?
    }
  }

}
