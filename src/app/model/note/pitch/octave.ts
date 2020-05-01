const OCTAVES: Array<number> = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export class Octave {

  value: number;

  constructor(value: number) {
    if (OCTAVES.includes(value)) {
      this.value = value;
    } else {
      throw new Error('An octave could not be instantiated with the value ' + value);
    }
  }

}
