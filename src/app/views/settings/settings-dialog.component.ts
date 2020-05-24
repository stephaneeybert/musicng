import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { SettingsEdition } from './settings-edition';
import { TIME_SIGNATURES, RANDOM_METHOD, CHORD_DURATION_UNITS, GENERATE_METHODS } from '@app/service/notation.constant ';
import { TempoUnit } from '@app/model/tempo-unit';

type TimeSignatureType = {
  id: number,
  name: string
};

type ChordDurationUnitType = {
  id: TempoUnit,
  name: string
};

type GenerateMethodType = {
  id: RANDOM_METHOD,
  name: string
};

@Component({
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.css']
})
export class SettingsDialogComponent implements OnInit {

  settingsEdition: SettingsEdition;
  form!: FormGroup;
  timeSignatures: Array<TimeSignatureType> = new Array();
  chordDurationUnits: Array<ChordDurationUnitType> = new Array();
  generateMethods: Array<GenerateMethodType> = new Array();

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<SettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    const existingSettings: SettingsEdition = data.settings;
    this.settingsEdition = new SettingsEdition(
      existingSettings.generateTempoBpm,
      existingSettings.generateTimeSignatureNumerator,
      existingSettings.generateTimeSignatureDenominator,
      existingSettings.generateChordDuration,
      existingSettings.generateChordDurationUnit,
      existingSettings.generateNoteOctave,
      existingSettings.generateChordWidth,
      existingSettings.generateMethod,
      existingSettings.generateReverseDissimilarChord,
      existingSettings.generateNbChords,
      existingSettings.generateSymphony,
      existingSettings.generateDrums,
      existingSettings.generateBass,
      existingSettings.animatedStave,
      existingSettings.showKeyboard
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
      generateMethod: new FormControl(this.settingsEdition.generateMethod),
      generateReverseDissimilarChord: new FormControl(this.settingsEdition.generateReverseDissimilarChord),
      generateNbChords: new FormControl(this.settingsEdition.generateNbChords),
      generateSymphony: new FormControl(this.settingsEdition.generateSymphony),
      generateDrums: new FormControl(this.settingsEdition.generateDrums),
      generateBass: new FormControl(this.settingsEdition.generateBass),
      animatedStave: new FormControl(this.settingsEdition.animatedStave),
      showKeyboard: new FormControl(this.settingsEdition.showKeyboard)
    });

    // Have the form fields error messages shown on keystroke
    this.form.markAllAsTouched();
  }

  private instantiateLists(): void {
    TIME_SIGNATURES.forEach((timeSignature: number) => {
      console.log(typeof timeSignature);
      this.timeSignatures.push({ 'id': timeSignature, 'name': String(timeSignature) });
    });

    CHORD_DURATION_UNITS.forEach((name: string, id: TempoUnit) => {
      this.chordDurationUnits.push({ 'id': id, 'name': name });
    });

    GENERATE_METHODS.forEach((name: string, id: RANDOM_METHOD) => {
      this.generateMethods.push({ 'id': id, 'name': name });
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

}
