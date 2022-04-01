import { ComponentPortal } from '@angular/cdk/portal';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, InjectionToken, Injector, Input, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';
import { Device } from '@app/model/device';
import { Settings } from '@app/model/settings';
import { Soundtrack } from '@app/model/soundtrack';
import { CustomOverlayRef, OverlayCloseEvent, OverlayService } from '@app/service/overlay.service';
import { Bounding, SheetService } from '@app/service/sheet.service';
import { SettingsStore } from '@app/store/settings-store';
import { SoundtrackStore } from '@app/store/soundtrack-store';
import { ScreenDeviceService } from '@stephaneeybert/lib-core';
import { combineLatest, Observable, ReplaySubject, Subject, Subscription } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MENU_ITEM_REGENERATE, SheetMenuComponent } from './sheet-menu.component';

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

  private boundings?: Array<Bounding>;
  private scrollY: number = 0;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private sheetService: SheetService,
    private screenDeviceService: ScreenDeviceService,
    private soundtrackStore: SoundtrackStore,
    private settingsStore: SettingsStore,
    private overlayService: OverlayService,
    private viewContainerRef: ViewContainerRef,
    private injector: Injector
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
          const soundtrack: Soundtrack = soundtracks[this.soundtrackStore.getSoundtrackIndex(this.soundtrackId)];
          this.createSoundtrackSheet(soundtrack, settings.animatedStave);
          this.boundings = this.sheetService.collectBoundingBoxes(soundtrack);
        }
      });

    this.deviceSubscription = this.device$
      .pipe(delay(0))
      .subscribe((device: Device) => {
        this.initializeWithDeviceId(device);
      });

    window.addEventListener('scroll', this.setScreenScroll, true);
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

    window.removeEventListener('scroll', this.setScreenScroll, true);
  }

  private initScreenWidth(): void {
    this.screenWidth = this.screenDeviceService.getScreenInnerWidth();
  }

  // Retrieving scroll events cannot be implmented with an @HostListener annotation
  private setScreenScroll = (event: Event): void => {
    this.scrollY = (event.target as Element).scrollTop;
  };

  @HostListener('window:resize', ['$event'])
  public onResize(): void {
    this.initScreenWidth();
    // TODO How to recalculate the scroll for the bounding box on screen resize ?
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

  private createPopupMenu(x: number, y: number): void {
    const inputData: string = "Salut mon pote";
    this.customOverlayRef = this.overlayService.create<string, string>(x, y, inputData);
    const dataInjector = this.createInjector(this.customOverlayRef);
    const componentPortal: ComponentPortal<SheetMenuComponent> = new ComponentPortal(SheetMenuComponent, this.viewContainerRef, dataInjector);
    this.customOverlayRef.closeEvents.subscribe((event: OverlayCloseEvent<string>) => {
      if (event.data == MENU_ITEM_REGENERATE) {
        console.log('at x: ' + x + ' y: ' + y);
        if (this.boundings) {
          const [trackId, measureId, placedChordId]: [number, number, number] = this.sheetService.locateMeasureAndChord(this.boundings, x, y + this.scrollY);
//        console.log('for soundtrack ' + this.soundtrackId);
          console.log('Located track: ' + trackId + ' measure: ' + measureId + ' and chord: ' + placedChordId);
        }
      }
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
