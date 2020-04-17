import { Pitch } from './pitch/pitch';

export class Note {

  // TODO note.probability = 0.5; // Events have a probability parameter which allows you to adjust the probability of the event firing each time it is scheduled to.
  // TODO note.humanize = "32n"; // "Humanization" let's you adjust how rigid the callback timing is. If humanize is set to true, the passed-in time parameter will drift back and forth slightly to make the part feel a little more "human". You can also set humanize to a Time value, which will make it drift by that amount.
  index: number; // TODO The index is still not used
  pitch: Pitch;
  velocity?: number; // TODO
  dotted: boolean;

  constructor(index: number, pitch: Pitch) {
    this.index = index;
    this.pitch = pitch;
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
