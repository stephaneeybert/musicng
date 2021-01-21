import { Component, OnInit, ChangeDetectorRef, EventEmitter, Output, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Observable, ReplaySubject, Subscription } from 'rxjs';
import { Soundtrack } from '@app/model/soundtrack';
import { SoundtrackStore } from '@app/store/soundtrack-store';
import { GeneratorService } from '@app/service/generator.service';
import { SynthService } from '@app/service/synth.service';
import { MelodyService } from '@app/service/melody.service';
import { SoundtrackService } from './soundtrack.service';
import { MatDialogConfig, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { SoundtrackDialogComponent } from './soundtrack-dialog.component';
import { SoundtrackEdition } from './soundtrack-edition';
import { TranslateService } from '@ngx-translate/core';
import { delay, tap } from 'rxjs/operators';
import { MaterialService } from '@app/core/service/material.service';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faLayerPlus as farLayerPlus } from '@stephaneeybert/pro-regular-svg-icons';
import { faLayerPlus as fasLayerPlus } from '@stephaneeybert/pro-solid-svg-icons';
import { MidiService } from '@app/service/midi.service';
import { MIDI_FILE_SUFFIX } from '@app/service/notation.constant ';
import { DownloadService } from '@stephaneeybert/lib-core';
import { Download } from '@stephaneeybert/lib-core/lib/download/download';
import { ProgressTask } from '@stephaneeybert/lib-core/lib/download/progress-task';

@Component({
  selector: 'app-soundtracks',
  templateUrl: './soundtracks.component.html',
  styleUrls: ['./soundtracks.component.css']
})
export class SoundtracksComponent implements OnInit, OnDestroy {

  soundtracks!: Array<Soundtrack>;
  private soundtracksSubscription?: Subscription;

  audioRunning$?: Observable<boolean>;
  audioTransportStarted$?: Observable<boolean>;

  dialogRef!: MatDialogRef<SoundtrackDialogComponent>;
  @Output()
  soundtrackEditedEvent: EventEmitter<Soundtrack> = new EventEmitter<Soundtrack>();

  download$?: Observable<Download>;
  download?: Download; // TODO

  private dialogEmitterSubscription?: Subscription;
  private dialogSubscription?: Subscription;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private soundtrackStore: SoundtrackStore,
    private generatorService: GeneratorService,
    private melodyService: MelodyService,
    private synthService: SynthService,
    private soundtrackService: SoundtrackService,
    private materialService: MaterialService,
    private translateService: TranslateService,
    private matDialog: MatDialog,
    private faIconLibrary: FaIconLibrary,
    private midiService: MidiService,
    private downloadService: DownloadService
  ) {
    this.faIconLibrary.addIcons(farLayerPlus, fasLayerPlus);
  }

  ngOnInit() {
    this.observeSoundtracks();

    this.audioRunning$ = this.synthService.audioContextIsRunning$();
    this.audioTransportStarted$ = this.synthService.audioTransportIsStarted$();

    this.soundtrackStore.loadAllFromStorage();
  }

  ngOnDestroy() {
    if (this.soundtracksSubscription != null) {
      this.soundtracksSubscription.unsubscribe();
    }
    if (this.dialogSubscription != null) {
      this.dialogSubscription.unsubscribe();
    }
    if (this.dialogEmitterSubscription != null) {
      this.dialogEmitterSubscription.unsubscribe();
    }
  }

  generateSoundtrack(): void {
    if (this.soundtrackService.maximumNotYetReached()) {
      // const soundtrack2: Soundtrack = this.melodyService.addDummyMelody();
      const soundtrack: Soundtrack = this.generatorService.generateSoundtrack();
      const message: string = this.translateService.instant('soundtracks.message.added', { name: soundtrack.name });
      this.materialService.showSnackBar(message);
    } else {
      const message: string = this.translateService.instant('soundtracks.message.maxNbReached');
      this.materialService.showSnackBar(message);
    }
  }

  startTransport(): void {
    this.synthService.startTransport();
  }

  playSoundtrack(soundtrack: Soundtrack): void {
    this.synthService.playSoundtrack(soundtrack);
  }

  stopSoundtrack(soundtrack: Soundtrack): void {
    this.synthService.stopSoundtrack(soundtrack);
  }

  replaySoundtrack(soundtrack: Soundtrack): void {
    this.synthService.stopSoundtrack(soundtrack);
    this.synthService.playSoundtrack(soundtrack);
  }

  isNowPlaying(soundtrack: Soundtrack): boolean {
    return soundtrack.nowPlaying;
  }

  getNbSoundtracks(): number {
    return this.soundtracks != null ? this.soundtracks.length : 0;
  }

  deleteSoundtrack(soundtrack: Soundtrack): void {
    this.stopSoundtrack(soundtrack);
    if (this.soundtrackStore.delete(soundtrack)) {
      const message: string = this.translateService.instant('soundtracks.message.deleted', { name: soundtrack.name });
      this.materialService.showSnackBar(message);
    } else {
      const message: string = this.translateService.instant('soundtracks.message.notFound', { name: soundtrack.name });
      this.materialService.showSnackBar(message);
    }
  }

  openSoundtrackDialog(existingSoundtrack: Soundtrack) {
    const dialogConfig: MatDialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.hasBackdrop = true;
    dialogConfig.data = {
      soundtrack: existingSoundtrack
    };

    this.dialogRef = this.matDialog.open<SoundtrackDialogComponent>(SoundtrackDialogComponent, dialogConfig);

    this.dialogSubscription = this.dialogRef
      .afterClosed()
      .subscribe((soundtrackEdition: SoundtrackEdition) => {
        if (soundtrackEdition) {
          if (existingSoundtrack) {
            existingSoundtrack.name = soundtrackEdition.name;
            existingSoundtrack.copyright = soundtrackEdition.copyright;
            existingSoundtrack.lyrics = soundtrackEdition.lyrics;
            // TODO The soundtrackEdition should be saved
            this.soundtrackService.setAndStoreSoundtrack(existingSoundtrack);

            this.soundtrackEditedEvent.emit(existingSoundtrack);
          }
          const message: string = this.translateService.instant('soundtracks.message.updated', { name: soundtrackEdition.name });
          this.materialService.showSnackBar(message);
        }
      });

    this.dialogEmitterSubscription = this.soundtrackEditedEvent
      .subscribe((soundtrack: Soundtrack) => {
        this.refreshSoundtrack(soundtrack);
      });
  }

  refreshSoundtrack(soundtrack: Soundtrack): void {
    console.log(soundtrack);
  }

  // Updating a view model in a subscribe() block requires an explicit call to the change detection
  private detectChanges(): void {
    this.changeDetector.detectChanges();
  }

  private observeSoundtracks(): void {
    this.soundtracksSubscription = this.soundtrackStore.getSoundtracks$()
      .pipe(
        delay(500)
      ).subscribe((soundtracks: Array<Soundtrack>) => {
        this.soundtracks = soundtracks;
        this.detectChanges();
      });
  }

  progressSubject$: BehaviorSubject<number> = new BehaviorSubject(0);
  testProgress(): void {
    console.log('Called the testProgress method');
    interval(1000)
    .subscribe((value: number) => {
      this.progressSubject$.next(value);
      this.detectChanges();
      console.log('The progress: ' + value);
    });
  }

  pg$: Observable<number> = this.progressSubject$.asObservable();
  downloadSoundtrack(soundtrack: Soundtrack): void {
    const fileName: string = soundtrack.name + '.' + MIDI_FILE_SUFFIX;
    // const progress$: Observable<ProgressTask<Uint8Array>> = this.midiService.progressiveCreateSoundtrackMidi$(soundtrack);
    const progress$: BehaviorSubject<ProgressTask<Uint8Array>> = this.midiService.progressiveCreateSoundtrackMidiRS$(soundtrack);  // With BehaviorSubject - not working
    console.log('Created the observable');

    // progress$
    // .subscribe((progressTask: ProgressTask<Uint8Array>) => {
    //   this.progressSubject$.next(progressTask.loaded);
    //   this.detectChanges();
    //   console.log('Loaded: ' + progressTask.loaded);
    // });

    const piper$: Observable<ProgressTask<Uint8Array>> = progress$
    .pipe(
      tap((pTask: ProgressTask<Uint8Array>) => {
        this.progressSubject$.next(pTask.loaded);
        this.detectChanges();
        console.log('Loaded: ' + pTask.loaded);
      })
    );

    // piper$
    // .subscribe((pTask: ProgressTask<Uint8Array>) => {
    //   this.progressSubject$.next(pTask.loaded);
    //   this.detectChanges();
    //   console.log('Subscribing: ' + pTask.loaded);
    // });
    this.download$ = this.downloadService.downloadObservableDataAsBlobWithProgressAndSaveInFile(piper$, fileName);

    // const promise: Promise<Uint8Array> = this.midiService.createSoundtrackMidi(soundtrack, progress$);
    // console.log('Controller method call complete');
    // promise.then((uint8Array: Uint8Array) => {
    //   console.log('Then is done');
    // });
    this.midiService.createSoundtrackMidi(soundtrack, progress$);
  }

  // downloadSoundtrack(soundtrack: Soundtrack): void {
  //   const fileName: string = soundtrack.name + '.' + MIDI_FILE_SUFFIX;

  //   const progress$: Observable<ProgressTask<Uint8Array>> = this.midiService.progressiveCreateSoundtrackMidi$(soundtrack);
  //   console.log('Created the observable');
  //   // progress$.pipe(
  //   //   tap((progressTask: ProgressTask<Uint8Array>) => {
  //   //     console.log('Loaded: ' + progressTask.loaded);
  //   //   })
  //   // );
  //   this.downloadService.downloadObservableDataAsBlobWithProgressAndSaveInFile(progress$, fileName)
  //   .subscribe((download: Download) => {
  //     this.download = download;
  //     this.progress = download.progress;
  //     console.log('Progress: ' + download.progress);
  //     this.detectChanges();
  //   });

    // TODO See https://stackoverflow.com/q/64801947/958373
  //   console.log('Controller method call complete');
  // }

  // <mat-icon (click)="downloadDemo()" matTooltip="{{ 'soundtracks.download.tip' | translate }}"
  // class="soundtrack-action">arrow_downward</mat-icon>
  // TODO See https://stackoverflow.com/q/64801947/958373
  // showMe: boolean = false;
  // downloadDemo(): void {
  //   this.download$ = this.downloadService.downloadUrlAsBlobWithProgressAndSaveInFile('assets/skypeforlinux-64.deb', 'demo')
  //   this.showMe = true;
  //   this.download$.subscribe((download: Download) => {
  //     console.log('Progress: ' + download.progress);
  //   });
  //   console.log('Call done');
  // }

}
