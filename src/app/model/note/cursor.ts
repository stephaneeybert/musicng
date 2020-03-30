import { Duration } from './duration/duration';

export class Cursor {

  noteDuration: Duration;

  constructor(noteDuration: Duration) {
    this.noteDuration = noteDuration;
  }

  public render(): string {
    return this.noteDuration.render();
  }

}
