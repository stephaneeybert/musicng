import { Injectable } from '@angular/core';
import { SoundtrackStore } from '@app/lib/store/soundtrack-store';
import { Soundtrack } from '@app/model/soundtrack';

@Injectable({
  providedIn: 'root',
})
export class SoundtrackValidatorService {

  constructor(
    private soundtrackStore: SoundtrackStore
  ) { }

  public nameIsAlreadyUsed(name: string): boolean {
    if (this.soundtrackStore.findByName(name)) {
      return true;
    } else {
      return false;
    }
  }

}
