import { Injectable } from '@angular/core';
import { Measure } from '../../model/measure/measure';
import { SoundtrackStore } from '../../lib/store/soundtrack-store';
import { Soundtrack } from '../../model/soundtrack';
import { CommonService } from '../../lib/service/common.service';

@Injectable({
  providedIn: 'root'
})
export class SoundtrackService {

  NB_MAX: number = 10;

  constructor(
    private commonService: CommonService,
    private soundtrackStore: SoundtrackStore
  ) { }

  public createSoundtrackFromMeasures(name: string, measures: Array<Measure>): Soundtrack {
    const soundtrack: Soundtrack = new Soundtrack(this.commonService.normalizeName(name), name);
    soundtrack.addTrack(measures);
    this.soundtrackStore.add(soundtrack);
    return soundtrack;
  }

  public maximumNotYetReached(): boolean {
    return this.getSoundtracks().length < this.NB_MAX;
  }

  public getSoundtracks(): Array<Soundtrack> {
    return this.soundtrackStore.getSoundtracks();
  }

  public setSoundtrack(soundtrack: Soundtrack) {
    this.soundtrackStore.setSoundtrack(soundtrack);
  }

}
