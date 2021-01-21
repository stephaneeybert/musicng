import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { SoundtrackEdition } from './soundtrack-edition';
import { SoundtrackValidator } from './soundtrack-validator';

const NAME_MAX_LENGTH: number = 15;

@Component({
  templateUrl: './soundtrack-dialog.component.html'
})
export class SoundtrackDialogComponent implements OnInit {

  form!: FormGroup;
  soundtrackEdition: SoundtrackEdition;

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<SoundtrackDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private soundtrackValidator: SoundtrackValidator
  ) {
    const inputSoundtrackEdition: SoundtrackEdition = data.soundtrack;
    this.soundtrackEdition = new SoundtrackEdition(inputSoundtrackEdition.id, inputSoundtrackEdition.name, inputSoundtrackEdition.copyright, inputSoundtrackEdition.lyrics);
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      name: new FormControl(this.soundtrackEdition ? this.soundtrackEdition.name : '', [ Validators.required, Validators.maxLength(NAME_MAX_LENGTH), this.soundtrackValidator.validateNamePattern(), this.soundtrackValidator.validateNameIsNotAlreadyUsed(this.soundtrackEdition.id) ]),
      copyright: new FormControl(this.soundtrackEdition ? this.soundtrackEdition.copyright : ''),
      lyrics: new FormControl(this.soundtrackEdition ? this.soundtrackEdition.lyrics : ''),
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
