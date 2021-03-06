import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { SoundtrackValidatorService } from './soundtrack-validator.service';

const REGEX_ALLOWED_CHARS: RegExp = /^[a-z0-9_-]+$/i;

@Injectable({
  providedIn: 'root',
})
export class SoundtrackValidator {

  constructor(
    private soundtrackValidatorService: SoundtrackValidatorService
  ) { }

  validateNamePattern(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!REGEX_ALLOWED_CHARS.test(control.value)) {
        return { invalidPattern: true };
      }
      return null;
    }
  }

  validateNameIsNotAlreadyUsed(soundtrackId: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (this.soundtrackValidatorService.nameIsAlreadyUsed(soundtrackId, control.value)) {
        return { nameIsAlreadyUsed: true };
      }
      return null;
    }
  }

}
