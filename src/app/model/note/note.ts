import { Pitch } from './pitch/pitch';

const VELOCITY_TONEJS_MAX = 1;
const VELOCITY_MIDI_MAX = 127;

export class Note {

  // TODO note.probability = 0.5; // Events have a probability parameter which allows you to adjust the probability of the event firing each time it is scheduled to.
  // TODO note.humanize = "32n"; // "Humanization" let's you adjust how rigid the callback timing is. If humanize is set to true, the passed-in time parameter will drift back and forth slightly to make the part feel a little more "human". You can also set humanize to a Time value, which will make it drift by that amount.
  index: number; // TODO The index is still not used
  pitch: Pitch;
  velocity?: number;
  dotted: boolean;

  constructor(index: number, pitch: Pitch, midiVelocity?: number) {
    this.index = index;
    this.pitch = pitch;
    if (midiVelocity != null) {
      this.velocity = this.velocityMidiToTonejs(midiVelocity);
    } else {
      this.velocity = VELOCITY_TONEJS_MAX;
    }
    this.dotted = false;
  }

  public velocityMidiToTonejs(midiVelocity: number): number {
    if (midiVelocity > VELOCITY_MIDI_MAX) {
      throw new Error('The MIDI velocity ' + midiVelocity + ' is greater than the maximum MIDI velocity ' + VELOCITY_MIDI_MAX);
    }
    return midiVelocity / VELOCITY_MIDI_MAX;
  }

  public velocityTonejsToMidi(tonejsVelocity: number): number {
    return tonejsVelocity * VELOCITY_MIDI_MAX;
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
