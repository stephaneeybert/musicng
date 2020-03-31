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

  public getSoundtracks(): Array<Soundtrack> {
    return this.getState();
  }

  public addSoundtrack(soundtrack: Soundtrack) {
    const index = this.getSoundtrackIndex(soundtrack.id);
    if (index === -1) {
      soundtrack.id = this.commonService.normalizeName(soundtrack.id);
      const soundtracks = this.getState();
      soundtracks.push(soundtrack);
      this.setState(soundtracks);
    }
  }

  public removeSoundtrack(soundtrack: Soundtrack) {
    const index = this.getSoundtrackIndex(soundtrack.name);
    if (index !== -1) {
      const soundtracks = this.getState();
      soundtracks.splice(index, 1);
      this.setState(soundtracks);
    }
  }

  public setSoundtrackKeyboard(soundtrack: Soundtrack, keyboard: any) {
    soundtrack.keyboard = keyboard;
    this.setSoundtrack(soundtrack);
  }

  public setSoundtrackSynth(soundtrack: Soundtrack, synth: any) {
    soundtrack.synth = synth;
    this.setSoundtrack(soundtrack);
  }

  public setSoundtrack(soundtrack: Soundtrack) {
    const index = this.getSoundtrackIndex(soundtrack.id);
    if (index !== -1) {
      const soundtracks = this.getState();
      soundtracks[index] = soundtrack;
      this.setState(soundtracks);
    }
  }

  private getSoundtrackIndex(soundtrackName: string): number {
    return this.getState().findIndex((soundtrack: Soundtrack) => {
      return this.commonService.normalizeName(soundtrack.id) === this.commonService.normalizeName(soundtrackName);
    });
  }

}
