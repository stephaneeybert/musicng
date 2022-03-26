import { Component, Input, ChangeDetectorRef, HostListener, OnDestroy, ViewChild, ElementRef, AfterViewInit, ViewContainerRef, InjectionToken, Injector } from '@angular/core';
import { Device } from '@app/model/device';
import { SheetService } from '@app/service/sheet.service';
import { Soundtrack } from '@app/model/soundtrack';
import { Subscription, Subject, ReplaySubject, Observable, combineLatest } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Settings } from '@app/model/settings';
import { SettingsStore } from '@app/store/settings-store';
import { SoundtrackStore } from '@app/store/soundtrack-store';
import { ScreenDeviceService } from '@stephaneeybert/lib-core';
import { CustomOverlayRef, OverlayCloseEvent, OverlayService } from '@app/service/overlay.service';
import { ComponentPortal } from '@angular/cdk/portal';
import { SheetMenuComponent } from './sheet-menu.component';

export const DATA_TOKEN = new InjectionToken<{}>('SheetPopupPortalData');

@Component({
  selector: 'app-sheet',
  templateUrl: './sheet.component.html',
  styleUrls: ['./sheet.component.css']
})
export class SheetComponent implements AfterViewInit, OnDestroy {

  @Input()
  soundtrackId?: string;

  private device$: Subject<Device> = new ReplaySubject<Device>();
  // HINT: A setter with the very same name as the variable can be used in place of the variable
  @Input() // TODO NEXT change this into a non observable member variable @Input() deviceId?: string;
  set device(device: Device) {
    this.device$.next(device);
  }

  private soundtrackSubscription?: Subscription;
  private deviceSubscription?: Subscription;

  @ViewChild("sheet") sheetElementRef!: ElementRef;

  screenWidth!: number;

  settings$?: Observable<Settings>;
  private settingsSubscription?: Subscription;

  private customOverlayRef: CustomOverlayRef | undefined;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private sheetService: SheetService,
    private screenDeviceService: ScreenDeviceService,
    private soundtrackStore: SoundtrackStore,
    private settingsStore: SettingsStore,
    private overlayService: OverlayService,
    private viewContainerRef: ViewContainerRef,
    private injector: Injector,
  ) { }

  ngAfterViewInit() {
    this.initScreenWidth();

    const soundtrackAndSettings$: Observable<[Array<Soundtrack>, Settings]> = combineLatest(
      this.soundtrackStore.getSoundtracks$(),
      this.settingsStore.getSettings$()
    );

    this.soundtrackSubscription = soundtrackAndSettings$
      .subscribe(([soundtracks, settings]: [Array<Soundtrack>, Settings]) => {
        // The soundtrack sheet is redrawn when the animated stave setting is changed
        if (this.soundtrackId != null) {
          this.createSoundtrackSheet(soundtracks[this.soundtrackStore.getSoundtrackIndex(this.soundtrackId)], settings.animatedStave);
        }
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

  private detectChanges(id: string): void {
    this.sheetElementRef.nativeElement.id = id;
    // Detect the change AFTER the id has been set
    this.changeDetector.detectChanges();
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
        // Refresh the view with its id before creating the sheet
        this.detectChanges(this.sheetService.buildSoundtrackSheetId(soundtrack));
        this.sheetService.createSoundtrackSheet(this.sheetService.buildSoundtrackSheetId(soundtrack), this.screenWidth, soundtrack, animatedStave);
      } else {
        throw new Error('No sheet was created for the soundtrack. Notes should be set to the soundtrack before adding it to the observables data store, ensuring that when the new soundtrack is observed, it has notes and can get a sheet.');
      }
    }
  }

  private createDeviceSheet(device: Device): void {
    if (device != null) {
      this.sheetService.createDeviceSheet(this.sheetService.buildDeviceSheetId(device), this.screenWidth, device);
    }
  }

  @HostListener('click', ['$event'])
  onSheetEvent(event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.createPopupMenu(event.clientX, event.clientY);
  }

  private createPopupMenu(left: number, top: number): void {
    const inputData: string = "Salut mon pote";
    this.customOverlayRef = this.overlayService.create<string, string>(left, top, inputData);
    const dataInjector = this.createInjector(this.customOverlayRef);
    const componentPortal: ComponentPortal<SheetMenuComponent> = new ComponentPortal(SheetMenuComponent, this.viewContainerRef, dataInjector);
    this.customOverlayRef.closeEvents.subscribe((event: OverlayCloseEvent<string>) => {
      console.log(event);
     });
    this.overlayService.attach<SheetMenuComponent>(this.customOverlayRef, componentPortal);
  }

  private createInjector(customOverlayRef: CustomOverlayRef): Injector {
    return Injector.create({
      parent: this.injector,
      providers: [
        { provide: CustomOverlayRef, useValue: customOverlayRef }
      ]
    })
  }
}
