import { Injectable } from '@angular/core';
import Nexus from 'nexusui';

const KEYBOARD_WIDTH_RATIO: number = 0.9;
const KEYBOARD_HEIGHT: number = 125;
const RANGE_MIN: number = 36;
const RANGE_MAX: number = 95;

@Injectable({
  providedIn: 'root'
})
export class KeyboardService {

  constructor() { }

  public createKeyboard(name: string, screenWidth: number): any {
    // The keyboard width must fit within the screen
    const keeyboardWidth: number = screenWidth * KEYBOARD_WIDTH_RATIO;

    const elementName: string = '#' + name;
    const piano: any = new Nexus.Piano(elementName, {
      size: [ keeyboardWidth, KEYBOARD_HEIGHT ],
      lowNote: RANGE_MIN,
      highNote: RANGE_MAX
    });
    return piano;
  }

  public unpressAll(keyboard: any): void {
    if (keyboard != null) {
      if (keyboard.range && keyboard.range.low && keyboard.range.high) {
        for (let keyIndex: number = 0; keyIndex <= (keyboard.range.high - keyboard.range.low); keyIndex++) {
          keyboard.toggleIndex(keyIndex, false);
        }
      }
    }
  }

  public pressKey(keyboard: any, midiNotes: Array<number>): void {
    this.toggleKey(keyboard, midiNotes, true);
  }

  public unpressKey(keyboard: any, midiNotes: Array<number>): void {
    this.toggleKey(keyboard, midiNotes, false);
  }

  private toggleKey(keyboard: any, midiNotes: Array<number>, isOn: boolean): void {
    midiNotes.forEach((midiNote: number) => {
      if ((RANGE_MIN <= midiNote) && (midiNote <= RANGE_MAX)) {
        if (keyboard != null) {
          keyboard.toggleKey(midiNote, isOn);
        }
      }
    });
  }

}
