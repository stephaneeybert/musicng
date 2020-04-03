import { AbstractControl } from '@angular/forms';

const REGEX_ALLOWED_CHARS: any = /^[a-z0-9]+$/i;

export function ValidateSoundtrackNameCharacters(control: AbstractControl) {
  if (!REGEX_ALLOWED_CHARS.test(control.value)) {
    return { invalidPattern: true };
  }
  return null;
}
