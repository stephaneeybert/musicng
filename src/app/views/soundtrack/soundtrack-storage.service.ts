import { Injectable } from '@angular/core';
import { LocalStorageService } from '@app/core/service/local-storage.service';
import { Soundtrack } from '@app/model/soundtrack';

const PREFIX: string = 'musicng-soundtrack-';

@Injectable({
  providedIn: 'root'
})
export class SoundtrackStorageService extends LocalStorageService<Soundtrack> {

  public setSoundtrack(soundtrack: Soundtrack): void {
    this.set(PREFIX + soundtrack.id, soundtrack);
  }

  public getSoundtrack(soundtrackId: string): Soundtrack | null {
    return this.get(PREFIX + soundtrackId);
  }

  public getAllSoundtracks(): Array<Soundtrack> {
    return this.getAll(PREFIX);
  }

  public deleteSoundtrack(soundtrackId: string) {
    this.delete(PREFIX + soundtrackId);
  }

}
