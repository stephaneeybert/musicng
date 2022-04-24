import { Pitch } from './pitch/pitch';

export const NOTE_SHARP: string = '#';
export const NOTE_DOUBLE_SHARP: string = '##';
export const NOTE_TRIPLE_SHARP: string = '###';
export const NOTE_FLAT: string = 'b';
export const NOTE_DOUBLE_FLAT: string = 'bb';
export const NOTE_TRIPLE_FLAT: string = 'bbb';

export class Note {

  // TODO note.probability = 0.5; // Events have a probability parameter which allows you to adjust the probability of the event firing each time it is scheduled to.
  // TODO note.humanize = "32n"; // "Humanization" let's you adjust how rigid the callback timing is. If humanize is set to true, the passed-in time parameter will drift back and forth slightly to make the part feel a little more "human". You can also set humanize to a Time value, which will make it drift by that amount.
  index: number;
  pitch: Pitch;
  inpassing: boolean;
  dotted: boolean; // TODO Use it in the synth ?
  // sharp (#) TODO Use it in synth ?
  // double sharp (#) TODO Use it in synth ?
  // flat (b) TODO Use it in synth ?
  // double flat (b) TODO Use it in synth ?

  constructor(index: number, pitch: Pitch, inpassing: boolean) {
    this.index = index;
    this.pitch = pitch;
    this.inpassing = inpassing;
    this.dotted = false;
  }

  public isFirst(): boolean {
    return this.index === 0;
  }

  public renderChroma(): string {
    return this.pitch.renderChroma();
  }

  public renderOctave(): number {
    return this.pitch.renderOctave();
  }

  public renderIntlChromaOctave(): string {
    return this.pitch.renderIntlChromaOctave();
  }

  public render(): string {
    return this.pitch.render();
  }

  public isSharp(): boolean {
    return this.renderChroma().includes(NOTE_SHARP);
  }

  public isDoubleSharp(): boolean {
    return this.renderChroma().includes(NOTE_DOUBLE_SHARP);
  }

  public isTripleSharp(): boolean {
    return this.renderChroma().includes(NOTE_TRIPLE_SHARP);
  }

  public isFlat(): boolean {
    return this.renderChroma().includes(NOTE_FLAT);
  }

  public isDoubleFlat(): boolean {
    return this.renderChroma().includes(NOTE_DOUBLE_FLAT);
  }

  public isTripleFlat(): boolean {
    return this.renderChroma().includes(NOTE_TRIPLE_FLAT);
  }

}
