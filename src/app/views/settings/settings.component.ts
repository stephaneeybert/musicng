import { Component, OnInit, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Settings } from '@app/model/settings';
import { SettingsStore } from '@app/store/settings-store';
import { MatDialogConfig, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { SettingsDialogComponent } from './settings-dialog.component';
import { MaterialService } from '@app/core/service/material.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit, OnDestroy {

  settings$?: Observable<Settings>;
  settings!: Settings;
  private settingsSubscription?: Subscription;

  dialogRef!: MatDialogRef<SettingsDialogComponent>;
  @Output() // TODO Why this event emitter ? It seems it's not being used..
  settingsEditedEvent: EventEmitter<Settings> = new EventEmitter<Settings>();

  private dialogEmitterSubscription?: Subscription;
  private dialogSubscription?: Subscription;

  constructor(
    private settingsStore: SettingsStore,
    private materialService: MaterialService,
    private translateService: TranslateService,
    private matDialog: MatDialog
  ) { }

  ngOnInit() {
    this.settings$ = this.settingsStore.getSettings$();
    this.observeSettings();

    this.settingsStore.loadFromStorage();
  }

  ngOnDestroy() {
    if (this.settingsSubscription != null) {
      this.settingsSubscription.unsubscribe();
    }
    if (this.dialogSubscription != null) {
      this.dialogSubscription.unsubscribe();
    }
    if (this.dialogEmitterSubscription != null) {
      this.dialogEmitterSubscription.unsubscribe();
    }
  }

  openSettingsDialog() {
    const existingSettings: Settings = this.settingsStore.getSettings();

    const dialogConfig: MatDialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;
    dialogConfig.hasBackdrop = true;
    dialogConfig.restoreFocus = false;
    dialogConfig.data = {
      settings: existingSettings
    };

    this.dialogRef = this.matDialog.open<SettingsDialogComponent>(SettingsDialogComponent, dialogConfig);

    this.dialogSubscription = this.dialogRef
      .afterClosed()
      .subscribe((settingsEdition: Settings) => {
        if (settingsEdition) {
          if (existingSettings) {
            existingSettings.generateTempoBpm = settingsEdition.generateTempoBpm;
            existingSettings.generateTimeSignatureNumerator = settingsEdition.generateTimeSignatureNumerator;
            existingSettings.generateTimeSignatureDenominator = settingsEdition.generateTimeSignatureDenominator;
            existingSettings.generateChordDuration = settingsEdition.generateChordDuration;
            existingSettings.generateChordDurationUnit = settingsEdition.generateChordDurationUnit;
            existingSettings.generateNoteOctave = settingsEdition.generateNoteOctave;
            existingSettings.generateChordWidth = settingsEdition.generateChordWidth;
            existingSettings.generateReverseDissimilarChord = settingsEdition.generateReverseDissimilarChord;
            existingSettings.generateInpassingNote = settingsEdition.generateInpassingNote;
            existingSettings.generateNbSemiTonesNearNotes = settingsEdition.generateNbSemiTonesNearNotes;
            existingSettings.generateTonality = settingsEdition.generateTonality;
            existingSettings.generateOnlyMajorTonalities = settingsEdition.generateOnlyMajorTonalities;
            existingSettings.generateModulation = settingsEdition.generateModulation;
            existingSettings.generateNbChords = settingsEdition.generateNbChords;
            existingSettings.generateDoubleChord = settingsEdition.generateDoubleChord;
            existingSettings.generateBonusMin = settingsEdition.generateBonusMin;
            existingSettings.generateBonusRandom = settingsEdition.generateBonusRandom;
            existingSettings.generateMelody = settingsEdition.generateMelody;
            existingSettings.generateHarmony = settingsEdition.generateHarmony;
            existingSettings.generateDrums = settingsEdition.generateDrums;
            existingSettings.generateBass = settingsEdition.generateBass;
            existingSettings.generateVelocityMelody = settingsEdition.generateVelocityMelody;
            existingSettings.generateVelocityHarmony = settingsEdition.generateVelocityHarmony;
            existingSettings.generateVelocityDrums = settingsEdition.generateVelocityDrums;
            existingSettings.generateVelocityBass = settingsEdition.generateVelocityBass;
            existingSettings.animatedStave = settingsEdition.animatedStave;
            existingSettings.showKeyboard = settingsEdition.showKeyboard;
            existingSettings.showAllNotes = settingsEdition.showAllNotes;
            existingSettings.allowDarkTheme = settingsEdition.allowDarkTheme;
            this.settingsStore.store(existingSettings);
            this.settingsStore.update(existingSettings);

            const message: string = this.translateService.instant('settings.message.saved');
            this.materialService.showSnackBar(message);
          }
        }
      });
  }

  private observeSettings(): void {
    this.settingsSubscription = this.settingsStore.getSettings$()
      .subscribe((settings: Settings) => {
        this.settings = settings;
      });
  }

}
