import { Injectable } from '@angular/core';
import { Store } from './store';
import { CommonService } from '../service/common.service';
import { Soundtrack } from '../../model/soundtrack';
import { Observable } from 'rxjs';
import { SoundtrackStorageService } from '@app/views/soundtrack/soundtrack-storage.service';
import { ParseService } from '../service/parse.service';

@Injectable({
  providedIn: 'root'
})
export class SoundtrackStore extends Store<Array<Soundtrack>> {

  constructor(
    private commonService: CommonService,
    private parseService: ParseService,
    private soundtrackStorageService: SoundtrackStorageService
  ) {
    super(new Array<Soundtrack>());
  }

  public loadAllFromStorage(): void {
    const soundtrackObjs: Array<any> = this.soundtrackStorageService.getAllSoundtracks();
    if (soundtrackObjs && soundtrackObjs.length > 0) {
      const soundtracks: Array<Soundtrack> = new Array();
      soundtrackObjs.forEach((soundtrackObj: any) => {
        const soundtrack: Soundtrack = this.parseService.objectToNewSoundtrack(soundtrackObj);
        soundtracks.push(soundtrack);
      });
      this.setState(soundtracks);
    }
  }

  public getSoundtracks$(): Observable<Array<Soundtrack>> {
    return this.state$!;
  }

  public getSoundtracks(): Array<Soundtrack> {
    return this.getState();
  }

  public add(soundtrack: Soundtrack) {
    const index = this.getSoundtrackIndex(soundtrack.id);
    if (index === -1) {
      soundtrack.id = this.commonService.normalizeName(soundtrack.id);
      const soundtracks = this.getState();
      soundtracks.push(soundtrack);
      this.setState(soundtracks);

      // Create a clean soundtrack before storing it
      const cleanSoundtrack: Soundtrack = this.parseService.objectToNewSoundtrack(soundtrack);
      this.soundtrackStorageService.setSoundtrack(cleanSoundtrack);
    }
  }

  public remove(soundtrack: Soundtrack): boolean {
    const index = this.getSoundtrackIndex(soundtrack.name);
    if (index !== -1) {
      const soundtracks = this.getState();
      soundtracks.splice(index, 1);
      this.setState(soundtracks);

      this.soundtrackStorageService.deleteSoundtrack(soundtrack.id);
      return true;
    } else {
      return false;
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
