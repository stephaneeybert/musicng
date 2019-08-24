import { Injectable } from '@angular/core';
import Nexus from 'nexusui';

const RANGE_MIN = 36;
const RANGE_MAX = 95;

@Injectable({
  providedIn: 'root'
})
export class KeyboardService {

  constructor() { }

  public createKeyboard(name: string): any {
    const elementName: string = '#' + name;
    const piano = new Nexus.Piano(elementName, {
      lowNote: RANGE_MIN,
      highNote: RANGE_MAX
    });
    return piano;
  }

  public pressKey(keyboard: any, midiNote: number) {
    this.toggleKey(keyboard, midiNote, true);
  }

  public unpressKey(keyboard: any, midiNote: number) {
    this.toggleKey(keyboard, midiNote, false);
  }

  private toggleKey(keyboard: any, midiNote: number, isOn: boolean) {
    if ((RANGE_MIN <= midiNote) && (midiNote <= RANGE_MAX)) {
      if (keyboard != null) {
        keyboard.toggleKey(midiNote, isOn);
      }
    }
  }

}
