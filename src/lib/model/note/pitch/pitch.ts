import { Chroma } from 'lib/model';
import { Octave } from 'lib/model';

export class Pitch {

  chroma: Chroma;
  octave: Octave;

  constructor(chroma: Chroma, octave: Octave) {
    this.chroma = chroma;
    this.octave = octave;
  }

  public renderAbc(): string {
    let abc: string = this.chroma.value;
    if (this.octave != null) {
      abc += this.octave.value;
    }
    return abc;
  }

}
