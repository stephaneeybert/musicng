import { Component, OnInit, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Soundtrack } from '../../model/soundtrack';
import { SoundtrackStore } from '../../lib/store/soundtrack-store';
import { GeneratorService } from '../../lib/service/generator.service';
import { SynthService } from '../../lib/service/synth.service';
import { MelodyService } from '../../lib/service/melody.service';
import { SoundtrackService } from './soundtrack.service';
import { UtilsService } from '@app/core/service/utils.service';
import { MatDialogConfig, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { SoundtrackDialogComponent } from './soundtrack-dialog.component';
import { SoundtrackEdition } from './soundtrack-edition';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'soundtracks',
  templateUrl: './soundtracks.component.html',
  styleUrls: ['./soundtracks.component.css']
})
export class SoundtracksComponent implements OnInit {

  soundtracks$!: Observable<Array<Soundtrack>>;
  soundtracks!: Array<Soundtrack>;

  private soundtracksSubscription!: Subscription;

  dialogRef!: MatDialogRef<SoundtrackDialogComponent>;
  @Output()
  soundtrackEditedEvent: EventEmitter<Soundtrack> = new EventEmitter<Soundtrack>();

  constructor(
    private changeDetector: ChangeDetectorRef,
    private soundtrackStore: SoundtrackStore,
    private generatorService: GeneratorService,
    private melodyService: MelodyService,
    private synthService: SynthService,
    private soundtrackService: SoundtrackService,
    private utilsService: UtilsService,
    private translateService: TranslateService,
    private matDialog: MatDialog
  ) { }

  ngOnInit() {
    this.soundtracks$ = this.soundtrackStore.getSoundtracks$();
    this.observeSoundtracks();
  }

  ngOnDestroy() {
    if (this.soundtracksSubscription != null) {
      this.soundtracksSubscription.unsubscribe();
    }
  }

  generateSoundtrack(): void {
    this.generatorService.generateSoundtrack();
    // this.melodyService.addDummyMelody();
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

  deleteSoundtrack(soundtrack: Soundtrack): void {
    this.soundtrackStore.removeSoundtrack(soundtrack);
  }

  refreshSoundtrack(soundtrack: Soundtrack): void {
    console.log('refreshSoundtrack');
    console.log(soundtrack);
  }

  openSoundtrackDialog(existingSoundtrack: Soundtrack) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.hasBackdrop = true;
    dialogConfig.data = {
      soundtrack: existingSoundtrack
    };

    this.dialogRef = this.matDialog.open<SoundtrackDialogComponent, SoundtrackEdition>(SoundtrackDialogComponent, dialogConfig);

    this.dialogRef
      .afterClosed()
      .subscribe((soundtrackEdition: SoundtrackEdition) => {
        if (soundtrackEdition) {
          if (existingSoundtrack) {
            existingSoundtrack.name = soundtrackEdition.name;
            existingSoundtrack.copyright = soundtrackEdition.copyright;
            existingSoundtrack.lyrics = soundtrackEdition.lyrics;

            this.soundtrackService.setSoundtrack(existingSoundtrack);
            this.soundtrackEditedEvent.emit(existingSoundtrack);
            console.log('Emitted event');
            console.log(existingSoundtrack);
            const message: string = this.translateService.instant('soundtracks.message.updated', { name: existingSoundtrack.name });
            this.utilsService.showSnackBar(message);
          } else {
            const addedSoundtrack: Soundtrack = this.soundtrackService.createSoundtrack(soundtrackEdition.name);
            addedSoundtrack.copyright = soundtrackEdition.copyright;
            addedSoundtrack.lyrics = soundtrackEdition.lyrics;

            this.soundtrackService.setSoundtrack(addedSoundtrack)
            this.soundtrackEditedEvent.emit(addedSoundtrack);
            const message: string = this.translateService.instant('soundtracks.message.added', { name: addedSoundtrack.name });
            this.utilsService.showSnackBar(message);
          }
        }
      });
  }

  // Updating a view model in a subscribe() block requires an explicit call to the change detection
  private detectChanges(): void {
    this.changeDetector.detectChanges();
  }

  private observeSoundtracks(): void {
    this.soundtracksSubscription = this.soundtrackStore.getSoundtracks$()
      .subscribe((soundtracks: Array<Soundtrack>) => {
        this.soundtracks = soundtracks;
        this.detectChanges();
      });
  }

}
