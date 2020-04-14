export class Chroma {

  public static CHROMAS_ALPHABETICAL = ['rest', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  value: string;

  constructor(value: string) {
    if (Chroma.CHROMAS_ALPHABETICAL.includes(value)) {
      this.value = value;
    } else {
      throw new Error('A chroma could not be instantiated witht the value ' + value);
    }
  }

}
