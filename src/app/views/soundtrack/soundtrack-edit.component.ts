import { Component, Input, EventEmitter, Output } from '@angular/core';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { SoundtrackDialogComponent } from './soundtrack-dialog.component';
import { UtilsService } from '@app/core/service/utils.service';
import { Soundtrack } from '@app/model/soundtrack';
import { SoundtrackService } from './soundtrack.service';
import { SoundtrackEdition } from './soundtrack-edition';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'soundtrack-edit',
  templateUrl: './soundtrack-edit.component.html',
  styleUrls: ['./soundtracks.component.css']
})
export class SoundtrackEditComponent {

  @Input()
  public existingSoundtrack?: Soundtrack;
  @Output()
  soundtrackEditedEvent: EventEmitter<Soundtrack> = new EventEmitter<Soundtrack>();

  dialogRef!: MatDialogRef<SoundtrackDialogComponent>;

  constructor(
    private matDialog: MatDialog,
    private utilsService: UtilsService,
    private soundtrackService: SoundtrackService,
    private translateService: TranslateService
  ) { }

  openSoundtrackDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.hasBackdrop = true;
    dialogConfig.data = {
      soundtrack: this.existingSoundtrack
    };

    this.dialogRef = this.matDialog.open<SoundtrackDialogComponent, SoundtrackEdition>(SoundtrackDialogComponent, dialogConfig);

    this.dialogRef
      .afterClosed()
      .subscribe((soundtrackEdition: SoundtrackEdition) => {
        if (soundtrackEdition) {
          if (this.existingSoundtrack) {
            this.existingSoundtrack.name = soundtrackEdition.name;
            this.existingSoundtrack.copyright = soundtrackEdition.copyright;
            this.existingSoundtrack.lyrics = soundtrackEdition.lyrics;

            this.soundtrackService.setSoundtrack(this.existingSoundtrack);
            this.soundtrackEditedEvent.emit(this.existingSoundtrack);
            const message: string = this.translateService.instant('soundtracks.message.updated', { name: this.existingSoundtrack.name });
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

}
