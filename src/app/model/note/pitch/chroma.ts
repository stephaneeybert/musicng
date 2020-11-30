export class Chroma {

  public static CHROMAS_ALPHABETICAL = ['rest', 'end', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  value: string;

  constructor(value: string) {
    if (Chroma.CHROMAS_ALPHABETICAL.includes(value)) {
      this.value = value;
    } else {
      throw new Error('A chroma could not be instantiated witht the value ' + value);
    }
  }

  public getChromaIndex(): number {
    const index: number = Chroma.CHROMAS_ALPHABETICAL.indexOf(this.value);
    if (index < 0) {
      throw new Error('A chroma could not be found witht the value ' + this.value);
    }
    return index;
  }

}
