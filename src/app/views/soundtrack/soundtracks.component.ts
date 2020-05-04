import { Component, OnInit, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Soundtrack } from '@app/model/soundtrack';
import { SoundtrackStore } from '@app/lib/store/soundtrack-store';
import { GeneratorService } from '@app/lib/service/generator.service';
import { SynthService } from '@app/lib/service/synth.service';
import { MelodyService } from '@app/lib/service/melody.service';
import { SoundtrackService } from './soundtrack.service';
import { ScreenDeviceService } from '@app/core/service/screen-device.service';
import { MatDialogConfig, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { SoundtrackDialogComponent } from './soundtrack-dialog.component';
import { SoundtrackEdition } from './soundtrack-edition';
import { TranslateService } from '@ngx-translate/core';
import { delay } from 'rxjs/operators';

@Component({
  selector: 'app-soundtracks',
  templateUrl: './soundtracks.component.html',
  styleUrls: ['./soundtracks.component.css']
})
export class SoundtracksComponent implements OnInit {

  soundtracks!: Array<Soundtrack>;
  private soundtracksSubscription?: Subscription;

  audioRunning$?: Observable<boolean>;
  audioTransportStarted$?: Observable<boolean>;

  dialogRef!: MatDialogRef<SoundtrackDialogComponent>;
  @Output()
  soundtrackEditedEvent: EventEmitter<Soundtrack> = new EventEmitter<Soundtrack>();

  private dialogEmitterSubscription?: Subscription;
  private dialogSubscription?: Subscription;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private soundtrackStore: SoundtrackStore,
    private generatorService: GeneratorService,
    private melodyService: MelodyService,
    private synthService: SynthService,
    private soundtrackService: SoundtrackService,
    private screenDeviceService: ScreenDeviceService,
    private translateService: TranslateService,
    private matDialog: MatDialog
  ) { }

  ngOnInit() {
    this.observeSoundtracks();

    this.audioRunning$ = this.synthService.audioIsRunning$();
    this.audioTransportStarted$ = this.synthService.audioTransportIsStarted$();

    this.soundtrackStore.loadAllFromStorage();
  }

  ngOnDestroy() {
    if (this.soundtracksSubscription != null) {
      this.soundtracksSubscription.unsubscribe();
    }
    if (this.dialogSubscription) {
      this.dialogSubscription.unsubscribe();
    }
    if (this.dialogEmitterSubscription) {
      this.dialogEmitterSubscription.unsubscribe();
    }
  }

  generateSoundtrack(): void {
    if (this.soundtrackService.maximumNotYetReached()) {
      // const soundtrack2: Soundtrack = this.melodyService.addDummyMelody();
      const soundtrack: Soundtrack = this.generatorService.generateSoundtrack();
      const message: string = this.translateService.instant('soundtracks.message.added', { name: soundtrack.name });
      this.screenDeviceService.showSnackBar(message);
    } else {
      const message: string = this.translateService.instant('soundtracks.message.maxNbReached');
      this.screenDeviceService.showSnackBar(message);
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
      this.screenDeviceService.showSnackBar(message);
    } else {
      const message: string = this.translateService.instant('soundtracks.message.notFound', { name: soundtrack.name });
      this.screenDeviceService.showSnackBar(message);
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
            this.soundtrackService.setAndStoreSoundtrack(existingSoundtrack);

            this.soundtrackEditedEvent.emit(existingSoundtrack);
            const message: string = this.translateService.instant('soundtracks.message.updated', { name: existingSoundtrack.name });
            this.screenDeviceService.showSnackBar(message);
          }
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

}
