import { Component, Input, ChangeDetectorRef, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Device } from '@app/model/device';
import { SheetService } from '@app/lib/service/sheet.service';
import { Soundtrack } from '@app/model/soundtrack';
import { Subscription, Subject, ReplaySubject, Observable, combineLatest } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Settings } from '@app/model/settings';
import { SettingsStore } from '@app/lib/store/settings-store';
import { SoundtrackStore } from '../store/soundtrack-store';
import { ScreenDeviceService } from 'lib-core';

@Component({
  selector: 'app-midi-sheet',
  templateUrl: './sheet.component.html',
  styleUrls: ['./sheet.component.css']
})
export class SheetComponent implements OnInit, OnDestroy {

  inputSoundtrack?: Soundtrack;
  private soundtrack$: Subject<Soundtrack> = new ReplaySubject<Soundtrack>();
  // KNOW A setter with the very same name as the variable can be used in place of the variable
  @Input()
  set soundtrack(soundtrack: Soundtrack) {
    this.soundtrack$.next(soundtrack);
    this.inputSoundtrack = soundtrack;
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
    private screenDeviceService: ScreenDeviceService,
    private soundtrackStore: SoundtrackStore,
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
    this.screenWidth = this.screenDeviceService.getScreenInnerWidth();
  }

  @HostListener("window:resize", [])
  public onResize() {
    this.initScreenWidth();
  }

  ngOnDestroy() {
    if (this.inputSoundtrack != null) {
      this.sheetService.clearSVGContext(this.inputSoundtrack);
    }
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
      this.detectChanges(this.sheetService.buildSoundtrackSheetId(soundtrack));
      this.createSoundtrackSheet(soundtrack, animatedStave);
    }
  }

  private initializeWithDeviceId(device: Device): void {
    if (device != null) {
      // Refresh the view with its id before creating the sheet
      this.detectChanges(this.sheetService.buildDeviceSheetId(device));
      this.createDeviceSheet(device);
    }
  }

  private createSoundtrackSheet(soundtrack: Soundtrack, animatedStave: boolean): void {
    if (soundtrack != null) {
      if (soundtrack.hasNotes()) {
        this.sheetService.createSoundtrackSheet(this.id, animatedStave, this.screenWidth, soundtrack);
        this.soundtrackStore.setSoundtrackSheetSVGContext(soundtrack, soundtrack.sheetContext);
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
