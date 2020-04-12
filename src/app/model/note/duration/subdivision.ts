import { Subdivisions } from './subdivisions';

export class Subdivision {

  static readonly HUNDERD_TWENTY_EIGHTH = new Subdivision(Subdivisions.HUNDERD_TWENTY_EIGHTH, 0);
  static readonly DOTTED_HUNDERD_TWENTY_EIGHTH = new Subdivision(Subdivisions.HUNDERD_TWENTY_EIGHTH, Subdivisions.TWO_HUNDRED_FIFTY_SIXTH);
  static readonly SIXTY_FOURTH = new Subdivision(Subdivisions.SIXTY_FOURTH, 0);
  static readonly DOTTED_SIXTY_FOURTH = new Subdivision(Subdivisions.SIXTY_FOURTH, Subdivisions.HUNDERD_TWENTY_EIGHTH);
  static readonly THIRTY_SECOND = new Subdivision(Subdivisions.THIRTY_SECONDTH, 0);
  static readonly DOTTED_THIRTY_SECOND = new Subdivision(Subdivisions.THIRTY_SECONDTH, Subdivisions.SIXTY_FOURTH);
  static readonly SIXTEENTH = new Subdivision(Subdivisions.SIXTEENTH, 0);
  static readonly DOTTED_SIXTEENTH = new Subdivision(Subdivisions.SIXTEENTH, Subdivisions.THIRTY_SECONDTH);
  static readonly EIGHTH = new Subdivision(Subdivisions.EIGHTH, 0);
  static readonly DOTTED_EIGHTH = new Subdivision(Subdivisions.EIGHTH, Subdivisions.SIXTEENTH);
  static readonly QUARTER = new Subdivision(Subdivisions.QUARTER, 0);
  static readonly DOTTED_QUARTER = new Subdivision(Subdivisions.QUARTER, Subdivisions.EIGHTH);
  static readonly HALF = new Subdivision(Subdivisions.HALF, 0);
  static readonly DOTTED_HALF = new Subdivision(Subdivisions.HALF, Subdivisions.QUARTER);
  static readonly WHOLE = new Subdivision(Subdivisions.WHOLE, 0);
  static readonly NONE = new Subdivision(Subdivisions.NONE, 0);

  public readonly left: number;
  public readonly right: number;

  private constructor(left: number, right: number) {
    this.left = left;
    this.right = right;
  }

}
