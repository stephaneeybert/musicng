import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { DEFAULT_TIME_SIGNATURES, CHORD_DURATION_UNITS, CHROMAS_MAJOR } from '@app/service/notation.constant ';
import { TempoUnitType } from '@app/model/tempo-unit';
import { Settings } from '@app/model/settings';

type TimeSignatureType = {
  id: number,
  name: string
};

type ChordDurationUnitType = {
  id: TempoUnitType,
  name: string
};

type GenerateTonalityType = {
  id: string,
  name: string
};

@Component({
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.css']
})
export class SettingsDialogComponent implements OnInit {

  settingsEdition: Settings;
  form!: FormGroup;
  timeSignatures: Array<TimeSignatureType> = new Array();
  chordDurationUnits: Array<ChordDurationUnitType> = new Array();
  generateTonalities: Array<GenerateTonalityType> = new Array();

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<SettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    const existingSettings: Settings = data.settings;
    this.settingsEdition = new Settings();
    this.settingsEdition.set(
      existingSettings.generateTempoBpm,
      existingSettings.generateTimeSignatureNumerator,
      existingSettings.generateTimeSignatureDenominator,
      existingSettings.generateChordDuration,
      existingSettings.generateChordDurationUnit,
      existingSettings.generateNoteOctave,
      existingSettings.generateChordWidth,
      existingSettings.generateReverseDissimilarChord,
      existingSettings.generateInpassingNote,
      existingSettings.generateTonality,
      existingSettings.generateModulation,
      existingSettings.generateNbChords,
      existingSettings.generateDoubleChord,
      existingSettings.generateMelody,
      existingSettings.generateHarmony,
      existingSettings.generateDrums,
      existingSettings.generateBass,
      existingSettings.generateVelocityMelody,
      existingSettings.generateVelocityHarmony,
      existingSettings.generateVelocityDrums,
      existingSettings.generateVelocityBass,
      existingSettings.animatedStave,
      existingSettings.showKeyboard,
      existingSettings.showAllNotes,
      existingSettings.allowDarkTheme
    );
  }

  ngOnInit() {
    this.instantiateLists();

    this.form = this.formBuilder.group({
      generateTempoBpm: new FormControl(this.settingsEdition.generateTempoBpm),
      generateTimeSignatureNumerator: new FormControl(this.settingsEdition.generateTimeSignatureNumerator),
      generateTimeSignatureDenominator: new FormControl(this.settingsEdition.generateTimeSignatureDenominator),
      generateChordDuration: new FormControl(this.settingsEdition.generateChordDuration),
      generateChordDurationUnit: new FormControl(this.settingsEdition.generateChordDurationUnit),
      generateNoteOctave: new FormControl(this.settingsEdition.generateNoteOctave),
      generateChordWidth: new FormControl(this.settingsEdition.generateChordWidth),
      generateReverseDissimilarChord: new FormControl(this.settingsEdition.generateReverseDissimilarChord),
      generateInpassingNote: new FormControl({
        value: this.settingsEdition.generateInpassingNote,
        disabled: false
      }),
      generateTonality: new FormControl({
        value: this.settingsEdition.generateTonality,
        disabled: false
      }),
      generateModulation: new FormControl({
        value: this.settingsEdition.generateModulation,
        disabled: false
      }),
      generateNbChords: new FormControl(this.settingsEdition.generateNbChords),
      generateDoubleChord: new FormControl(this.settingsEdition.generateDoubleChord),
      generateMelody: new FormControl(this.settingsEdition.generateMelody),
      generateHarmony: new FormControl(this.settingsEdition.generateHarmony),
      generateDrums: new FormControl({
        value: this.settingsEdition.generateDrums,
        disabled: true
      }),
      generateBass: new FormControl({
        value: this.settingsEdition.generateBass,
        disabled: true
      }),
      generateVelocityMelody: new FormControl(this.settingsEdition.generateVelocityMelody),
      generateVelocityHarmony: new FormControl(this.settingsEdition.generateVelocityHarmony),
      generateVelocityDrums: new FormControl({
        value: this.settingsEdition.generateVelocityDrums,
        disabled: true
      }),
      generateVelocityBass: new FormControl({
        value: this.settingsEdition.generateVelocityBass,
        disabled: true
      }),
      animatedStave: new FormControl(this.settingsEdition.animatedStave),
      showKeyboard: new FormControl(this.settingsEdition.showKeyboard),
      showAllNotes: new FormControl(this.settingsEdition.showAllNotes),
      allowDarkTheme: new FormControl(this.settingsEdition.allowDarkTheme)
    });

    // Have the form fields error messages shown on keystroke
    this.form.markAllAsTouched();
  }

  private instantiateLists(): void {
    DEFAULT_TIME_SIGNATURES.forEach((timeSignature: number) => {
      this.timeSignatures.push({ 'id': timeSignature, 'name': String(timeSignature) });
    });

    CHORD_DURATION_UNITS.forEach((name: string, id: TempoUnitType) => {
      this.chordDurationUnits.push({ 'id': id, 'name': name });
    });

    CHROMAS_MAJOR.forEach((chroma: string) => {
      this.generateTonalities.push({ 'id': chroma, 'name': chroma });
    });
  }

  public hasError(controlName: string, errorName: string): boolean {
    return this.form.controls[controlName].hasError(errorName);
  }

  save(formGroup: FormGroup) {
    this.dialogRef.close(formGroup.value);
  }

  close() {
    this.dialogRef.close();
  }

  compareItemsById(id1: string, id2: string): boolean {
    // Use a == instead of a === so as to ignore the type difference if any
    return id1 == id2;
  }

  formatAsPercentage(value: number) {
    if (value > 0) {
      return value  + '%';
    }
    return value;
  }

}
