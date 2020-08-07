import { Subscription } from 'rxjs';
import * as Tone from 'tone';

export class Device {

  id: string;
  name: string;
  mute: boolean;
  keyboard: any;
  synth?: Tone.PolySynth;
  midiMessageSubscription?: Subscription;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.mute = false;
  }

}
