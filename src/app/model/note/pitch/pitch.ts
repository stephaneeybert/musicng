import { Chroma } from './chroma';
import { Octave } from './octave';

export class Pitch {

  chroma: Chroma;
  accidental: string;
  octave: Octave;

  constructor(chroma: Chroma, octave: Octave) {
    this.chroma = chroma;
    this.octave = octave;
    this.accidental = '';
  }

  public renderChroma(): string {
    return this.chroma.value;
  }

  public renderOctave(): number {
    return this.octave.value;
  }

  public renderIntlChromaOctave(): string {
    let abc: string = this.chroma.value;
    if (this.octave != null) {
      abc += this.octave.value;
    }
    return abc;
  }

  public render(): string {
    let abc: string = this.chroma.value;
    if (this.accidental != null) {
      abc += this.accidental;
    }
    if (this.octave != null) {
      abc += this.octave.value;
    }
    return abc;
  }

}
