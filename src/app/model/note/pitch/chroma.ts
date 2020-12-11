import { ALLOWED_CHROMAS } from '@app/service/notation.constant ';

export class Chroma {

  value: string;

  constructor(value: string) {
    if (ALLOWED_CHROMAS.includes(value)) {
      this.value = value;
    } else {
      throw new Error('A chroma could not be instantiated witht the value ' + value);
    }
  }

  public getChromaIndex(): number {
    const index: number = ALLOWED_CHROMAS.indexOf(this.value);
    if (index < 0) {
      throw new Error('A chroma could not be found witht the value ' + this.value);
    }
    return index;
  }

}
