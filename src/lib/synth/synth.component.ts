import { AfterViewInit, Component, Input } from '@angular/core';
import { SynthService } from 'lib/service';
import { Device } from 'lib/model';
import { Soundtrack } from 'lib/model';
import { SoundtrackStore } from 'lib/store';
import { DeviceStore } from 'lib/store';

@Component({
  selector: 'midi-synth',
  templateUrl: './synth.component.html',
  styleUrls: ['./synth.component.css']
})
export class SynthComponent implements AfterViewInit {

  @Input() soundtrack: Soundtrack;
  @Input() device: Device;

  constructor(
    private soundtrackStore: SoundtrackStore,
    private deviceStore: DeviceStore,
    private synthService: SynthService
  ) { }

  ngAfterViewInit() {
    this.createSynth();
    this.play();
  }

  private createSynth() {
    if (this.soundtrack != null) {
      if (this.soundtrack.hasNotes()) {
        const synth = this.synthService.createSoundtrackSynth();
        this.soundtrackStore.setSoundtrackSynth(this.soundtrack, synth);
      }
    } else if (this.device != null) {
      const synth = this.synthService.createDeviceSynth();
      this.deviceStore.setDeviceSynth(this.device, synth);
    }
  }

  private play() {
    if (this.soundtrack != null && this.soundtrack.hasNotes()) {
      this.synthService.playSoundtrack(this.soundtrack);
    }
  }

}
