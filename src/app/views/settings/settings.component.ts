import { Component, OnInit, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Settings } from '@app/model/settings';
import { SettingsStore } from '@app/lib/store/settings-store';
import { UIService } from '@app/core/service/ui.service';
import { MatDialogConfig, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { SettingsDialogComponent } from './settings-dialog.component';
import { SettingsEdition } from './settings-edition';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {

  settings$?: Observable<Settings>;
  settings!: Settings;
  private settingsSubscription?: Subscription;

  dialogRef!: MatDialogRef<SettingsDialogComponent>;
  @Output()
  settingsEditedEvent: EventEmitter<Settings> = new EventEmitter<Settings>();

  private dialogEmitterSubscription?: Subscription;
  private dialogSubscription?: Subscription;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private settingsStore: SettingsStore,
    private uiService: UIService,
    private translateService: TranslateService,
    private matDialog: MatDialog
  ) { }

  ngOnInit() {
    this.settings$ = this.settingsStore.getSettings$();
    this.observeSettingss();

    this.settingsStore.loadFromStorage();
  }

  ngOnDestroy() {
    if (this.settingsSubscription != null) {
      this.settingsSubscription.unsubscribe();
    }
    if (this.dialogSubscription) {
      this.dialogSubscription.unsubscribe();
    }
    if (this.dialogEmitterSubscription) {
      this.dialogEmitterSubscription.unsubscribe();
    }
  }

  openSettingsDialog() {
    const existingSettings: Settings = this.settingsStore.getSettings();

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.hasBackdrop = true;
    dialogConfig.data = {
      settings: existingSettings
    };

    this.dialogRef = this.matDialog.open<SettingsDialogComponent>(SettingsDialogComponent, dialogConfig);

    this.dialogSubscription = this.dialogRef
      .afterClosed()
      .subscribe((settingsEdition: SettingsEdition) => {
        if (settingsEdition) {
          if (existingSettings) {
            existingSettings.animatedStave = settingsEdition.animatedStave;
            this.settingsStore.setAndStoreSettings(existingSettings);

            const message: string = this.translateService.instant('settings.message.saved');
            this.uiService.showSnackBar(message);
          }
        }
      });
  }

  // Updating a view model in a subscribe() block requires an explicit call to the change detection
  private detectChanges(): void {
    this.changeDetector.detectChanges();
  }

  private observeSettingss(): void {
    this.settingsSubscription = this.settingsStore.getSettings$()
      .subscribe((settings: Settings) => {
        this.settings = settings;
        this.detectChanges();
      });
  }

}
