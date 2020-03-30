import { Subscription } from 'rxjs';

export class Device {

  id: string;
  name: string;
  mute: boolean;
  keyboard: any;
  synth: any;
  midiMessageSubscription?: Subscription;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.mute = false;
  }

}
