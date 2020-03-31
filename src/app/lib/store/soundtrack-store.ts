import { Injectable } from '@angular/core';
import { Store } from './store';
import { CommonService } from '../service/common.service';
import { Soundtrack } from '../../model/soundtrack';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SoundtrackStore extends Store<Array<Soundtrack>> {

  constructor(
    private commonService: CommonService
  ) {
    super(new Array<Soundtrack>());
  }

  public getSoundtracks$(): Observable<Array<Soundtrack>> {
    return this.state$!;
  }

  public addSoundtrack(soundtrack: Soundtrack) {
    const index = this.getSoundtrackIndex(soundtrack.id);
    if (index === -1) {
      soundtrack.id = this.commonService.normalizeName(soundtrack.id);
      const devices = this.getState();
      devices.push(soundtrack);
      this.setState(devices);
    }
  }

  public removeSoundtrack(soundtrackName: string) {
    const index = this.getSoundtrackIndex(soundtrackName);
    if (index !== -1) {
      const devices = this.getState();
      devices.splice(index);
      this.setState(devices);
    }
  }

  public setSoundtrackKeyboard(soundtrack: Soundtrack, keyboard: any) {
    const index = this.getSoundtrackIndex(soundtrack.id);
    if (index !== -1) {
      const soundtracks = this.getState();
      const currentSoundtrack: Soundtrack = soundtracks[index];
      currentSoundtrack.keyboard = keyboard;
      soundtracks[index] = currentSoundtrack;
      this.setState(soundtracks);
    }
  }

  public setSoundtrackSynth(soundtrack: Soundtrack, synth: any) {
    const index = this.getSoundtrackIndex(soundtrack.id);
    if (index !== -1) {
      const soundtracks = this.getState();
      const currentSoundtrack: Soundtrack = soundtracks[index];
      currentSoundtrack.synth = synth;
      soundtracks[index] = currentSoundtrack;
      this.setState(soundtracks);
    }
  }

  private getSoundtrackIndex(soundtrackName: string): number {
    return this.getState().findIndex((soundtrack: Soundtrack) => {
      return this.commonService.normalizeName(soundtrack.id) === this.commonService.normalizeName(soundtrackName);
    });
  }

}
