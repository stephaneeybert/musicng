import { ComponentPortal } from '@angular/cdk/portal';
import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/scrolling';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, InjectionToken, Input, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';
import { Device } from '@app/model/device';
import { Measure } from '@app/model/measure/measure';
import { PlacedChord } from '@app/model/note/placed-chord';
import { Tonality } from '@app/model/note/tonality';
import { Settings } from '@app/model/settings';
import { Soundtrack } from '@app/model/soundtrack';
import { GeneratorService } from '@app/service/generator.service';
import { NotationService } from '@app/service/notation.service';
import { CustomOverlayRef, OverlayCloseEvent, OverlayService } from '@app/service/overlay.service';
import { BoundingChord, BoundingStave, SheetService } from '@app/service/sheet.service';
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

  private harmonyStaveBoundings?: Array<BoundingStave>;
  private chordBoundings?: Array<BoundingChord>;
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
            this.harmonyStaveBoundings = this.sheetService.collectHarmonyStaveBoundingBoxes(this.soundtrack, this.scrollY);
            this.chordBoundings = this.sheetService.collectChordBoundingBoxes(this.soundtrack, this.scrollY);
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

  private createPopupMenu(posX: number, posY: number): void {
    if (this.soundtrack && this.harmonyStaveBoundings && this.chordBoundings) {
      const [trackIndex, measureIndex, placedChordIndex]: [number, number, number] = this.sheetService.locateChord(this.chordBoundings, posX, posY + this.scrollY);
      if (this.notationService.clickedOnPlacedChord(trackIndex, measureIndex, placedChordIndex)) {
        const placedChord: PlacedChord = this.notationService.getPlacedChord(this.soundtrack, trackIndex, measureIndex, placedChordIndex);
        let melodyNotes: Array<string> | undefined = undefined;
        let sibblingTonalities: Array<Tonality> | undefined = undefined;
        if (this.notationService.isMelodyTrack(trackIndex)) {
          const harmonyChord: PlacedChord = this.notationService.getHarmonyChordFromMelodyChord(this.soundtrack, measureIndex, placedChordIndex);
          const melodyChord: PlacedChord | undefined = this.notationService.getPlacedChord(this.soundtrack, trackIndex, measureIndex, placedChordIndex);
          const [previousMeasure, previousChord]: [Measure | undefined, PlacedChord | undefined] = this.notationService.getPreviousPlacedChord(this.soundtrack, trackIndex, measureIndex, placedChordIndex);
          melodyNotes = this.generatorService.collectPossibleMelodyNotesFromHarmonyChord(harmonyChord, previousChord, melodyChord, true);
        } else if (this.notationService.isHarmonyTrack(trackIndex)) {
          const [previousMeasure, previousChord]: [Measure | undefined, PlacedChord | undefined] = this.notationService.getPreviousPlacedChord(this.soundtrack, trackIndex, measureIndex, placedChordIndex);
          let [previousPreviousMeasure, previousPreviousChord]: [Measure | undefined, PlacedChord | undefined] = [undefined, undefined];
          if (previousMeasure && previousChord) {
            [previousPreviousMeasure, previousPreviousChord] = this.notationService.getPreviousPlacedChord(this.soundtrack, trackIndex, previousMeasure.index, previousChord.index);
          }
          sibblingTonalities = this.generatorService.getSibblingTonalities(previousPreviousChord, previousChord, false);
          if (sibblingTonalities.length == 0) {
            sibblingTonalities = this.notationService.getMajorTonalities();
          }
        }
        const inputData: SheetMenuInput = new SheetMenuInput(trackIndex, measureIndex, placedChordIndex, placedChord.tonality, sibblingTonalities, melodyNotes);
        this.customOverlayRef = this.overlayService.create<SheetMenuResponse, SheetMenuInput>(posX, posY, inputData);
        const dataInjector = this.overlayService.createInjector<SheetMenuInput>(this.customOverlayRef, DATA_TOKEN, undefined);
        const componentPortal: ComponentPortal<SheetMenuComponent> = new ComponentPortal(SheetMenuComponent, this.viewContainerRef, dataInjector);
        this.customOverlayRef.closeEvents.subscribe((event: OverlayCloseEvent<SheetMenuResponse>) => {
          if (this.soundtrack) {
            if (event.data) {
              if (event.data.harmonyChordChroma) {
                this.generatorService.regenerateHarmonyTrack(this.soundtrack, measureIndex, placedChordIndex, event.data.harmonyChordChroma, undefined, event.data.recreate);
              } else if (event.data.melodyNoteChroma) {
                this.generatorService.regenerateMelodyTrack(this.soundtrack, measureIndex, placedChordIndex, event.data.melodyNoteChroma, event.data.melodyNoteOctave, event.data.recreate);
              } else if (event.data.tonality) {
                this.generatorService.regenerateOnTonality(this.soundtrack, measureIndex, placedChordIndex, undefined, event.data.tonality);
              }
            }
          }
        });
        this.overlayService.attach<SheetMenuComponent>(this.customOverlayRef, componentPortal);
      } else {
        const [trackIndex, measureIndex]: [number, number] = this.sheetService.locateStave(this.harmonyStaveBoundings, posX, posY + this.scrollY);
        if (this.notationService.clickedOnStave(trackIndex, measureIndex)) {
          const inputData: SheetMenuInput = new SheetMenuInput(trackIndex, measureIndex, undefined, undefined, undefined, undefined);
          this.customOverlayRef = this.overlayService.create<SheetMenuResponse, SheetMenuInput>(posX, posY, inputData);
          const dataInjector = this.overlayService.createInjector<SheetMenuInput>(this.customOverlayRef, DATA_TOKEN, undefined);
          const componentPortal: ComponentPortal<SheetMenuComponent> = new ComponentPortal(SheetMenuComponent, this.viewContainerRef, dataInjector);
          this.customOverlayRef.closeEvents.subscribe((event: OverlayCloseEvent<SheetMenuResponse>) => {
            if (this.soundtrack) {
              if (event.data) {
                if (event.data.addMeasure) {
                  this.generatorService.addMeasureAfter(this.soundtrack, measureIndex);
                }
              }
            }
          });
          this.overlayService.attach<SheetMenuComponent>(this.customOverlayRef, componentPortal);
        }
      }
    }
  }
}
