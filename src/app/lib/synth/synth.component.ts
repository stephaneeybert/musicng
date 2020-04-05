import { Component, Input, AfterViewInit } from '@angular/core';
import { SynthService } from '../service/synth.service';
import { Device } from '../../model/device';
import { Soundtrack } from '../../model/soundtrack';
import { SoundtrackStore } from '../store/soundtrack-store';
import { DeviceStore } from '../store/device-store';
import { Subscription, ReplaySubject, Subject } from 'rxjs';

@Component({
  selector: 'midi-synth',
  templateUrl: './synth.component.html',
  styleUrls: ['./synth.component.css']
})
export class SynthComponent implements AfterViewInit {

  private soundtrack$: Subject<Soundtrack> = new ReplaySubject<Soundtrack>();
  // KNOW A setter with the very same name as the variable can be used in place of the variable
  @Input()
  set soundtrack(soundtrack: Soundtrack) {
    this.soundtrack$.next(soundtrack);
  };

  private device$: Subject<Device> = new ReplaySubject<Device>();
  // KNOW A setter with the very same name as the variable can be used in place of the variable
  @Input()
  set device(device: Device) {
    this.device$.next(device);
  };

  private soundtrackSubscription!: Subscription;
  private deviceSubscription!: Subscription;

  constructor(
    private soundtrackStore: SoundtrackStore,
    private deviceStore: DeviceStore,
    private synthService: SynthService
  ) { }

  ngAfterViewInit() {
    this.soundtrackSubscription = this.soundtrack$
    .subscribe((soundtrack: Soundtrack) => {
      this.createSoundtrackSynth(soundtrack);
    });

    this.deviceSubscription = this.device$
    .subscribe((device: Device) => {
      this.createDeviceSynth(device);
    });
  }

  ngOnDestroy() {
    if (this.soundtrackSubscription != null) {
      this.soundtrackSubscription.unsubscribe();
    }
    if (this.deviceSubscription != null) {
      this.deviceSubscription.unsubscribe();
    }
  }

  private createSoundtrackSynth(soundtrack: Soundtrack) {
    if (soundtrack != null) {
      if (soundtrack.hasNotes()) {
        const synth = this.synthService.createSoundtrackSynth();
        this.soundtrackStore.setSoundtrackSynth(soundtrack, synth);
      } else {
        throw new Error('No synth was created for the soundtrack. Notes should be set to the soundtrack before adding it to the observables data store, ensuring that when the new soundtrack is observed, it has notes and can get a synth.');
      }
    }
  }

  private createDeviceSynth(device: Device) {
    if (device != null) {
      const synth = this.synthService.createDeviceSynth();
      this.deviceStore.setDeviceSynth(device, synth);
    }
  }

}
