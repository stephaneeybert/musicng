import { Component, Input, AfterViewInit, OnDestroy } from '@angular/core';
import * as Tone from 'tone';
import { SynthService } from '@app/service/synth.service';
import { Device } from '@app/model/device';
import { Soundtrack } from '@app/model/soundtrack';
import { DeviceStore } from '@app/store/device-store';
import { Subscription, ReplaySubject, Subject, Observable } from 'rxjs';
import { Settings } from '@app/model/settings';

@Component({
  selector: 'app-synth',
  templateUrl: './synth.component.html',
  styleUrls: ['./synth.component.css']
})
export class SynthComponent implements AfterViewInit, OnDestroy {

  private soundtrack$: Subject<Soundtrack> = new ReplaySubject<Soundtrack>();
  // HINT: A setter with the very same name as the variable can be used in place of the variable
  @Input()
  set soundtrack(soundtrack: Soundtrack) {
    this.soundtrack$.next(soundtrack);
  };

  private device$: Subject<Device> = new ReplaySubject<Device>();
  // HINT: A setter with the very same name as the variable can be used in place of the variable
  @Input()
  set device(device: Device) {
    this.device$.next(device);
  };

  private soundtrackSubscription?: Subscription;
  private deviceSubscription?: Subscription;

  settings$?: Observable<Settings>;
  private settingsSubscription?: Subscription;

  constructor(
    private deviceStore: DeviceStore,
    private synthService: SynthService,
  ) { }

  ngAfterViewInit() {
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
    if (this.settingsSubscription != null) {
      this.settingsSubscription.unsubscribe();
    }
  }

  private createDeviceSynth(device: Device) {
    if (device != null) {
      const synth: Tone.PolySynth = this.synthService.createSynth();
      this.deviceStore.setDeviceSynth(device, synth);
    }
  }

}
