import { Component, EventEmitter, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { Settings } from '@app/model/settings';
import { SettingsStore } from '@app/store/settings-store';
import { MatDialogConfig, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { MaterialService } from '@app/core/service/material.service';
import { SettingsResetDialogComponent } from './settings-reset-dialog.component';

@Component({
  selector: 'app-settings-reset',
  templateUrl: './settings-reset.component.html'
})
export class SettingsResetComponent {

  dialogRef!: MatDialogRef<SettingsResetDialogComponent>;
  @Output()
  settingsEditedEvent: EventEmitter<Settings> = new EventEmitter<Settings>();

  private dialogEmitterSubscription?: Subscription;
  private dialogSubscription?: Subscription;

  constructor(
    private settingsStore: SettingsStore,
    private materialService: MaterialService,
    private translateService: TranslateService,
    private matDialog: MatDialog
  ) { }

  ngOnDestroy() {
    if (this.dialogSubscription != null) {
      this.dialogSubscription.unsubscribe();
    }
    if (this.dialogEmitterSubscription != null) {
      this.dialogEmitterSubscription.unsubscribe();
    }
  }

  resetSettingsDialog() {
    const dialogConfig: MatDialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.hasBackdrop = true;
    dialogConfig.restoreFocus = false;
    this.dialogRef = this.matDialog.open<SettingsResetDialogComponent>(SettingsResetDialogComponent, dialogConfig);

    this.dialogSubscription = this.dialogRef
      .afterClosed()
      .subscribe((reset: boolean) => {
        if (reset) {
          this.settingsStore.delete();

          const message: string = this.translateService.instant('settings.message.reset-ed');
          this.materialService.showSnackBar(message);
        }
      });
  }

}
