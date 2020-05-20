import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { SettingsEdition } from './settings-edition';

@Component({
  templateUrl: './settings-dialog.component.html',
})
export class SettingsDialogComponent implements OnInit {

  form!: FormGroup;
  settingsEdition: SettingsEdition;

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<SettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
  ) {
    const inputSettingsEdition: SettingsEdition = data.settings;
    this.settingsEdition = new SettingsEdition(
      inputSettingsEdition.animatedStave,
      inputSettingsEdition.showKeyboard
    );
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      animatedStave: new FormControl(this.settingsEdition ? this.settingsEdition.animatedStave : ''),
      showKeyboard: new FormControl(this.settingsEdition ? this.settingsEdition.showKeyboard : '')
    });
    // Have the form fields error messages shown on keystroke
    this.form.markAllAsTouched();
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

}
