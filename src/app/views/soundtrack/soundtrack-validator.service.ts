import { Injectable } from '@angular/core';
import { SoundtrackStore } from '@app/lib/store/soundtrack-store';

@Injectable({
  providedIn: 'root',
})
export class SoundtrackValidatorService {

  constructor(
    private soundtrackStore: SoundtrackStore
  ) { }

  public nameIsAlreadyUsed(soundtrackId: string, name: string): boolean {
    if (this.soundtrackStore.findByName(soundtrackId, name)) {
      return true;
    } else {
      return false;
    }
  }

}
