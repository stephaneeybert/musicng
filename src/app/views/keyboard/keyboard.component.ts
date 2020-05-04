import { Component, AfterViewInit, Input, ChangeDetectorRef, HostListener } from '@angular/core';
import { KeyboardService } from '@app/lib/service/keyboard.service';
import { SynthService } from '@app/lib/service/synth.service';
import { SoundtrackStore } from '@app/lib/store/soundtrack-store';
import { DeviceStore } from '@app/lib/store/device-store';
import { Subscription, ReplaySubject, Subject } from 'rxjs';
import { CommonService } from '@app/core/service/common.service';
import { Soundtrack } from '@app/model/soundtrack';
import { Device } from '@app/model/device';
import { delay } from 'rxjs/operators';
import { UIService } from '@app/core/service/ui.service';

const NAME_PREFIX_SOUNDTRACK: string = 'keyboard-soundtrack-';
const NAME_PREFIX_DEVICE: string = 'keyboard-device-';
const LIVE_KEYBOARD_MIDI_VELOCITY: number = 127;

@Component({
  selector: 'app-midi-keyboard',
  templateUrl: './keyboard.component.html'
})
export class KeyboardComponent implements AfterViewInit {

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

  private soundtrackSubscription?: Subscription;
  private deviceSubscription?: Subscription;

  id!: string;

  screenWidth!: number;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private soundtrackStore: SoundtrackStore,
    private deviceStore: DeviceStore,
    private keyboardService: KeyboardService,
    private synthService: SynthService,
    private uiService: UIService,
    private commonService: CommonService
  ) { }

  ngAfterViewInit() {
    this.initScreenWidth();

    this.soundtrackSubscription = this.soundtrack$
    // Wait for a change detection so as to get the soundtracks at loading time
    // See https://stackoverflow.com/q/61043063/958373
    .pipe(delay(0))
    .subscribe((soundtrack: Soundtrack) => {
      this.initializeWithSoundtrackId(soundtrack);
    });

    this.deviceSubscription = this.device$
    .pipe(delay(0))
    .subscribe((device: Device) => {
      this.initializeWithDeviceId(device);
    });
  }

  private initScreenWidth(): void {
    this.screenWidth = this.uiService.getScreenInnerWidth();
  }

  @HostListener("window:resize", [])
  public onResize() {
    this.initScreenWidth();
  }

  ngOnDestroy() {
    if (this.soundtrackSubscription != null) {
      this.soundtrackSubscription.unsubscribe();
    }
    if (this.deviceSubscription != null) {
      this.deviceSubscription.unsubscribe();
    }
  }

  // Updating a view model in a subscribe() block requires an explicit call to the change detection
  private setIdAndDetectChanges(id: string): void {
    this.id = id;
    // Detect the change AFTER the id has been set
    this.changeDetector.detectChanges();
  }

  private initializeWithSoundtrackId(soundtrack: Soundtrack): void {
    if (soundtrack != null) {
      // Refresh the view with its id before creating the keyboard
      this.setIdAndDetectChanges(NAME_PREFIX_SOUNDTRACK + soundtrack.id);
      this.createSoundtrackKeyboard(soundtrack);
    }
  }

  private initializeWithDeviceId(device: Device): void {
    if (device != null) {
      // Refresh the view with its id before creating the keyboard
      this.setIdAndDetectChanges(NAME_PREFIX_DEVICE + device.id);
      this.createDeviceKeyboard(device);
    }
  }

  private createSoundtrackKeyboard(soundtrack: Soundtrack): void {
    const keyboard: any = this.keyboardService.createKeyboard(this.id, this.screenWidth);
    this.soundtrackStore.setSoundtrackKeyboard(soundtrack, keyboard);
  }

  private createDeviceKeyboard(device: Device): void {
    const keyboard: any = this.keyboardService.createKeyboard(this.id, this.screenWidth);
    this.deviceStore.setDeviceKeyboard(device, keyboard);
    this.playSoundFromKeyboard(keyboard, device.synth);
  }

  private playSoundFromKeyboard(keyboard: any, synth: any) {
    keyboard.on('change', (note: any) => {
      if (note.state) {
        this.synthService.noteOn(note.note, LIVE_KEYBOARD_MIDI_VELOCITY, synth);
      } else {
        this.synthService.noteOff(note.note, synth);
      }
    });
  }
}
