import { Component, Input, AfterViewInit } from '@angular/core';
import { SynthService } from '@app/service/synth.service';
import { Device } from '@app/model/device';
import { Soundtrack } from '@app/model/soundtrack';
import { SoundtrackStore } from '@app/store/soundtrack-store';
import { DeviceStore } from '@app/store/device-store';
import { Subscription, ReplaySubject, Subject, Observable } from 'rxjs';
import { SettingsStore } from '@app/store/settings-store';
import { Settings } from '@app/model/settings';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-midi-synth',
  templateUrl: './synth.component.html',
  styleUrls: ['./synth.component.css']
})
export class SynthComponent implements AfterViewInit {

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
    private soundtrackStore: SoundtrackStore,
    private deviceStore: DeviceStore,
    private synthService: SynthService,
    private settingsStore: SettingsStore
  ) { }

  ngAfterViewInit() {
    const soundtrackAndSettings$: Observable<[Soundtrack, Settings]> = combineLatest(
      this.soundtrack$,
      this.settingsStore.getSettings$()
    );

    this.soundtrackSubscription = soundtrackAndSettings$
    .subscribe(([soundtrack, settings]: [Soundtrack, Settings]) => {
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
    if (this.settingsSubscription != null) {
      this.settingsSubscription.unsubscribe();
    }
  }

  private createSoundtrackSynth(soundtrack: Soundtrack) {
    if (soundtrack != null) {
      if (soundtrack.hasNotes()) {
        if (soundtrack.synth != null) {
          // The soundtrack play is stopped when the animated stave setting is changed
          this.synthService.stopSoundtrack(soundtrack);
        } else {
          const synth: any = this.synthService.createSoundtrackSynth();
          this.soundtrackStore.setSoundtrackSynth(soundtrack, synth);
        }
      } else {
        throw new Error('No synth was created for the soundtrack. Notes should be set to the soundtrack before adding it to the observables data store, ensuring that when the new soundtrack is observed, it has notes and can get a synth.');
      }
    }
  }

  private createDeviceSynth(device: Device) {
    if (device != null) {
      const synth: any = this.synthService.createDeviceSynth();
      this.deviceStore.setDeviceSynth(device, synth);
    }
  }

}
