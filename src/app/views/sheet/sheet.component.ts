import { ComponentPortal } from '@angular/cdk/portal';
import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/scrolling';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, InjectionToken, Injector, Input, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';
import { Device } from '@app/model/device';
import { Measure } from '@app/model/measure/measure';
import { PlacedChord } from '@app/model/note/placed-chord';
import { Settings } from '@app/model/settings';
import { Soundtrack } from '@app/model/soundtrack';
import { GeneratorService } from '@app/service/generator.service';
import { NotationService } from '@app/service/notation.service';
import { CustomOverlayRef, OverlayCloseEvent, OverlayService } from '@app/service/overlay.service';
import { Bounding, SheetService } from '@app/service/sheet.service';
import { SettingsStore } from '@app/store/settings-store';
import { SoundtrackStore } from '@app/store/soundtrack-store';
import { ScreenDeviceService } from '@stephaneeybert/lib-core';
import { combineLatest, Observable, ReplaySubject, Subject, Subscription } from 'rxjs';
import { delay } from 'rxjs/operators';
import { SheetMenuComponent, SheetMenuInput, SheetMenuResponse } from './sheet-menu.component';

export const DATA_TOKEN = new InjectionToken<{}>('SheetPopupPortalData');

@Component({
  selector: 'app-sheet',
  templateUrl: './sheet.component.html',
  styleUrls: ['./sheet.component.css']
})
export class SheetComponent implements AfterViewInit, OnDestroy {

  @Input()
  soundtrackId?: string;

  private soundtrack?: Soundtrack;

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
  private scrollSubscription?: Subscription;
  private scrollY: number = 0;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private sheetService: SheetService,
    private notationService: NotationService,
    private generatorService: GeneratorService,
    private screenDeviceService: ScreenDeviceService,
    private soundtrackStore: SoundtrackStore,
    private settingsStore: SettingsStore,
    private overlayService: OverlayService,
    private viewContainerRef: ViewContainerRef,
    private injector: Injector,
    private scrollDispatcher: ScrollDispatcher
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
          this.soundtrack = soundtracks[this.soundtrackStore.getSoundtrackIndex(this.soundtrackId)];
          if (this.soundtrack) {
            this.createSoundtrackSheet(this.soundtrack, settings.animatedStave);
            this.boundings = this.sheetService.collectBoundingBoxes(this.soundtrack);
          }
        }
      });

    this.deviceSubscription = this.device$
      .pipe(delay(0))
      .subscribe((device: Device) => {
        this.initializeWithDeviceId(device);
      });

    // Retrieving scroll events cannot be implmented with an @HostListener annotation
    this.scrollSubscription = this.scrollDispatcher.scrolled()
      .subscribe((cdk: CdkScrollable | void) => {
        this.scrollY = (cdk as CdkScrollable).getElementRef().nativeElement.scrollTop || 0;
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
    if (this.scrollSubscription != null) {
      this.scrollSubscription.unsubscribe();
    }
  }

  private initScreenWidth(): void {
    this.screenWidth = this.screenDeviceService.getScreenInnerWidth();
  }

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

  private clickedOnPlacedChord(trackIndex: number, measureIndex: number, placedChordIndex: number): boolean {
    return (trackIndex >=0 && measureIndex >= 0 && placedChordIndex >= 0);
  }

  private createPopupMenu(posX: number, posY: number): void {
    if (this.soundtrack && this.boundings) {
      const [trackIndex, measureIndex, placedChordIndex]: [number, number, number] = this.sheetService.locateMeasureAndChord(this.boundings, posX, posY + this.scrollY);
      if (this.clickedOnPlacedChord(trackIndex, measureIndex, placedChordIndex)) {
        console.log('trackIndex: ' + trackIndex + ' measureIndex: ' + measureIndex + ' placedChordIndex: ' + placedChordIndex);
        const placedChord: PlacedChord = this.notationService.getPlacedChord(this.soundtrack, trackIndex, measureIndex, placedChordIndex);
        let melodyNotes: Array<string> | undefined = undefined;
          if (this.notationService.isMelodyTrack(trackIndex)) {
          const measure: Measure = this.notationService.getMeasure(this.soundtrack, trackIndex, measureIndex);
          const harmonyChord: PlacedChord = this.notationService.getHarmonyChordFromMelodyChord(this.soundtrack, measure.index, placedChord.index);
          const previousPlacedChord: PlacedChord | undefined = this.notationService.getPlacedChord(this.soundtrack, trackIndex, measureIndex, placedChordIndex);
          melodyNotes = this.generatorService.collectPossibleMelodyNotesFromHarmonyChord(harmonyChord, previousPlacedChord, false);
        }
        const inputData: SheetMenuInput | undefined = new SheetMenuInput(trackIndex, measureIndex, placedChordIndex, placedChord.tonality.firstChroma, melodyNotes);
        this.customOverlayRef = this.overlayService.create<SheetMenuResponse, SheetMenuInput>(posX, posY, inputData);
        const injectedData: string = '';
        const dataInjector = this.createInjector<string>(this.customOverlayRef, injectedData);
        const componentPortal: ComponentPortal<SheetMenuComponent> = new ComponentPortal(SheetMenuComponent, this.viewContainerRef, dataInjector);
        this.customOverlayRef.closeEvents.subscribe((event: OverlayCloseEvent<SheetMenuResponse>) => {
          if (this.soundtrack && this.boundings) {
            if (event.data) {
              if (event.data.harmonyChordChroma) {
                this.generatorService.recreateSoundtrack(this.soundtrack, trackIndex, measureIndex, placedChordIndex, event.data.harmonyChordChroma, undefined, undefined, undefined, event.data.recreate);
              } else if (event.data.melodyNoteChroma) {
                this.generatorService.recreateSoundtrack(this.soundtrack, trackIndex, measureIndex, placedChordIndex, undefined, event.data.melodyNoteChroma, event.data.melodyNoteOctave, undefined, event.data.recreate);
              } else if (event.data.tonality) {
                this.generatorService.recreateSoundtrack(this.soundtrack, trackIndex, measureIndex, placedChordIndex, undefined, undefined, undefined, event.data.tonality, event.data.recreate);
              }
            }
          }
        });
        this.overlayService.attach<SheetMenuComponent>(this.customOverlayRef, componentPortal);
      }
    }
  }

  private createInjector<T>(customOverlayRef: CustomOverlayRef, data: T): Injector {
    return Injector.create({
      parent: this.injector,
      providers: [
        { provide: CustomOverlayRef, useValue: customOverlayRef },
        { provide: DATA_TOKEN, useValue: data },
      ]
    })
  }
}
