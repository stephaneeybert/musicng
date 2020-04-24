import { Component, Input, ChangeDetectorRef, HostListener, OnInit } from '@angular/core';
import { Device } from '../../model/device';
import { SheetService } from '../service/sheet.service';
import { Soundtrack } from '../../model/soundtrack';
import { Subscription, Subject, ReplaySubject, Observable, combineLatest } from 'rxjs';
import { CommonService } from '../service/common.service';
import { delay } from 'rxjs/operators';
import { Settings } from '@app/model/settings';
import { SettingsStore } from '../store/settings-store';

const NAME_PREFIX_SOUNDTRACK = 'sheet-soundtrack-';
const NAME_PREFIX_DEVICE = 'sheet-device-';

@Component({
  selector: 'app-midi-sheet',
  templateUrl: './sheet.component.html',
  styleUrls: ['./sheet.component.css']
})
export class SheetComponent implements OnInit {

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

  settings$?: Observable<Settings>;
  private settingsSubscription?: Subscription;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private sheetService: SheetService,
    private commonService: CommonService,
    private settingsStore: SettingsStore
  ) { }

  ngOnInit() {
    this.initScreenWidth();

    const soundtrackAndSettings$: Observable<[Soundtrack, Settings]> = combineLatest(
      this.soundtrack$.pipe(delay(0)),
      this.settingsStore.getSettings$()
    );

    this.soundtrackSubscription = soundtrackAndSettings$
      .subscribe(([soundtrack, settings]: [Soundtrack, Settings]) => {
        // The soundtrack sheet is redrawn when the animated stave setting is changed
        this.initializeWithSoundtrackId(soundtrack, settings.animatedStave);
      });

    this.deviceSubscription = this.device$
      .pipe(delay(0))
      .subscribe((device: Device) => {
        this.initializeWithDeviceId(device);
      });
  }

  private initScreenWidth(): void {
    this.screenWidth = this.commonService.getScreenInnerWidth();
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
    if (this.settingsSubscription != null) {
      this.settingsSubscription.unsubscribe();
    }
  }

  // Updating a view model in a subscribe() block requires an explicit call to the change detection
  private detectChanges(id: string): void {
    this.id = id;
    // Detect the change AFTER the id has been set
    this.changeDetector.detectChanges();
  }

  private initializeWithSoundtrackId(soundtrack: Soundtrack, animatedStave: boolean): void {
    if (soundtrack != null) {
      // Refresh the view with its id before creating the sheet
      this.detectChanges(NAME_PREFIX_SOUNDTRACK + soundtrack.id);
      this.createSoundtrackSheet(soundtrack, animatedStave);
    }
  }

  private initializeWithDeviceId(device: Device): void {
    if (device != null) {
      // Refresh the view with its id before creating the sheet
      this.detectChanges(NAME_PREFIX_DEVICE + device.id);
      this.createDeviceSheet(device);
    }
  }

  private createSoundtrackSheet(soundtrack: Soundtrack, animatedStave: boolean): void {
    if (soundtrack != null) {
      if (soundtrack.hasNotes()) {
        this.sheetService.createSoundtrackSheet(this.id, animatedStave, this.screenWidth, soundtrack);
      } else {
        throw new Error('No sheet was created for the soundtrack. Notes should be set to the soundtrack before adding it to the observables data store, ensuring that when the new soundtrack is observed, it has notes and can get a sheet.');
      }
    }
  }

  private createDeviceSheet(device: Device): void {
    if (device != null) {
      this.sheetService.createDeviceSheet(this.id, this.screenWidth, device);
    }
  }

}
