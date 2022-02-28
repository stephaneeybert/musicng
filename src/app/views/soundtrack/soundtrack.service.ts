import { Injectable } from '@angular/core';
import { SoundtrackStore } from '@app/store/soundtrack-store';
import { Soundtrack } from '@app/model/soundtrack';
import { CommonService } from '@stephaneeybert/lib-core';

const NB_SOUNDTRACKS_MAX: number = 10;

@Injectable({
  providedIn: 'root'
})
export class SoundtrackService {

  constructor(
    private commonService: CommonService,
    private soundtrackStore: SoundtrackStore
  ) { }

  public createSoundtrack(id: string, name: string): Soundtrack {
    return new Soundtrack(this.commonService.normalizeName(id), name);
  }

  public add(soundtrack: Soundtrack): void {
    if (soundtrack.hasTracks()) {
      this.soundtrackStore.add(soundtrack);
    } else {
      throw new Error('The soundtrack has no track. Add a track before storing the soundtrack.');
    }
  }

  public maximumNotYetReached(): boolean {
    return this.getSoundtracks().length < NB_SOUNDTRACKS_MAX;
  }

  public getSoundtracks(): Array<Soundtrack> {
    return this.soundtrackStore.getSoundtracks();
  }

  public updateSoundtrack(soundtrack: Soundtrack) {
    this.soundtrackStore.update(soundtrack);
  }

  public storeSoundtrack(soundtrack: Soundtrack) {
    this.soundtrackStore.store(soundtrack);
  }

}
