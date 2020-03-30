export class Instrument {

  id: number;
  family: string;
  name: string;
  percussion: boolean;

  constructor(id: number, family: string, name: string, percussion: boolean) {
    this.id = id;
    this.family = family;
    this.name = name;
    this.percussion = percussion;
  }

}
