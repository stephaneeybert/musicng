import { Component, AfterViewInit, Input, OnInit } from '@angular/core';
import { KeyboardService } from 'lib/service';
import { SynthService } from 'lib/service';
import { MidiService } from 'lib/service';
import { SoundtrackStore } from 'lib/store';
import { DeviceStore } from 'lib/store';
import { Device } from 'lib/model';
import { Soundtrack } from 'lib/model';

const NAME_PREFIX_SOUNDTRACK = 'keyboard-soundtrack-';
const NAME_PREFIX_DEVICE = 'keyboard-device-';

@Component({
  selector: 'midi-keyboard',
  templateUrl: './keyboard.component.html',
  styleUrls: ['./keyboard.component.css']
})
export class KeyboardComponent implements OnInit, AfterViewInit {

  @Input() soundtrack: Soundtrack;
  @Input() device: Device;
  id: string;

  constructor(
    private soundtrackStore: SoundtrackStore,
    private deviceStore: DeviceStore,
    private keyboardService: KeyboardService,
    private synthService: SynthService,
    private midiService: MidiService
  ) { }

  ngOnInit() {
    this.initializeId();
  }

  ngAfterViewInit() {
    this.createKeyboard();
  }

  private initializeId() {
    if (this.soundtrack != null) {
      this.id = NAME_PREFIX_SOUNDTRACK + this.soundtrack.id;
    } else if (this.device != null) {
      this.id = NAME_PREFIX_DEVICE + this.device.id;
    }
  }

  private createKeyboard() {
    if (this.soundtrack != null) {
      const keyboard = this.keyboardService.createKeyboard(this.id);
      this.soundtrackStore.setSoundtrackKeyboard(this.soundtrack, keyboard);
    } else if (this.device != null) {
      const keyboard = this.keyboardService.createKeyboard(this.id);
      this.deviceStore.setDeviceKeyboard(this.device, keyboard);

      keyboard.on('change', (note: any) => {
        if (note.state) {
          this.synthService.noteOn(note.note, this.midiService.MIDI_VELOCITY_MAX, this.device.synth);
        } else {
          this.synthService.noteOff(note.note, this.device.synth);
        }
      });
    }
  }

}
