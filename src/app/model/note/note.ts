import { Pitch } from './pitch/pitch';

const NOTE_VELOCITY_MAX = 127;

export class Note {

  // TODO index: number Maybe have an index to keep the notes sorted in the chord ?
  pitch: Pitch;
  velocity?: number;
  dotted: boolean;

  constructor(pitch: Pitch, velocity?: number) {
    this.pitch = pitch;
    if (velocity != null) {
      if (velocity >= 0 && velocity <= NOTE_VELOCITY_MAX) {
        this.velocity = velocity;
      } else {
        throw new Error('The velocity ' + velocity + ' must be greater or equal to 0 and lesser or equal to ' + NOTE_VELOCITY_MAX);
      }
    }
    this.dotted = false;
  }

  public renderChroma(): string {
    return this.pitch.renderChroma();
  }

  public renderOctave(): number {
    return this.pitch.renderOctave();
  }

  public renderAbc(): string {
    return this.pitch.renderAbc();
  }

  public render() {
    return this.pitch.render();
  }

}
