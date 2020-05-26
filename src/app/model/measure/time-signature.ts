export class TimeSignature {

  // The number of beats in a measure
  numerator: number;
  // The type of note (1 = whole, 2 = half, 4 = quarter) that gets one beat
  denominator: number;

  constructor(numerator: number, denominator: number) {
    this.numerator = numerator;
    this.denominator = denominator;
  }

}
