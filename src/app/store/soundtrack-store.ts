import { Injectable } from '@angular/core';
import { Store } from './store';
import { Soundtrack } from '@app/model/soundtrack';
import { Observable } from 'rxjs';
import { SoundtrackStorageService } from '@app/views/soundtrack/soundtrack-storage.service';
import { CommonService } from '@stephaneeybert/lib-core';

@Injectable({
  providedIn: 'root'
})
export class SoundtrackStore extends Store<Array<Soundtrack>> {

  constructor(
    private commonService: CommonService,
    private soundtrackStorageService: SoundtrackStorageService
  ) {
    super(new Array<Soundtrack>());
  }

  public loadAllFromStorage(): void {
    const soundtrackJsons: Array<any> = this.soundtrackStorageService.getAllSoundtracks();
    if (soundtrackJsons && soundtrackJsons.length > 0) {
      const soundtracks: Array<Soundtrack> = new Array();
      soundtrackJsons.forEach((soundtrackJson: any) => {
        const soundtrack: Soundtrack = this.soundtrackStorageService.cleanUpInstance(soundtrackJson);
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
    const index: number = this.getSoundtrackIndex(soundtrack.id);
    if (index === -1) {
      soundtrack.id = this.commonService.normalizeName(soundtrack.id);
      const soundtracks: Array<Soundtrack> = this.getState();
      soundtracks.push(soundtrack);
      this.setState(soundtracks);
      this.store(soundtrack);
    }
  }

  public delete(soundtrack: Soundtrack): boolean {
    this.soundtrackStorageService.deleteSoundtrack(soundtrack.id);

    const index: number = this.getSoundtrackIndex(soundtrack.id);
    if (index !== -1) {
      const soundtracks: Array<Soundtrack> = this.getState();
      soundtracks.splice(index, 1);
      this.setState(soundtracks);
      return true;
    } else {
      return false;
    }
  }

  public deleteAll(): boolean {
    this.soundtrackStorageService.deleteAll();

    let allDeleted: boolean = true;
    for (let soundtrack of this.getSoundtracks()) {
      const deleted: boolean = this.delete(soundtrack);
      if (!deleted) {
        allDeleted = false;
      }
    }
    return allDeleted;
  }

  public store(soundtrack: Soundtrack): void {
    const cleanSoundtrack: Soundtrack = this.soundtrackStorageService.cleanUpInstance(soundtrack);
    this.soundtrackStorageService.setSoundtrack(cleanSoundtrack);
  }

  public update(soundtrack: Soundtrack) {
    const index: number = this.getSoundtrackIndex(soundtrack.id);
    if (index !== -1) {
      const soundtracks: Array<Soundtrack> = this.getState();
      soundtracks[index] = soundtrack;
      this.setState(soundtracks);
    }
  }

  public findOtherWithName(soundtrackId: string, name: string): Soundtrack | void {
    for (let soundtrack of this.getSoundtracks()) {
      if (soundtrack.name === name && soundtrack.id !== soundtrackId) {
        return soundtrack;
      }
    }
  }

  public getSoundtrackIndex(soundtrackId: string): number {
    return this.getState().findIndex((soundtrack: Soundtrack) => {
      return this.commonService.normalizeName(soundtrack.id) === this.commonService.normalizeName(soundtrackId);
    });
  }

}
