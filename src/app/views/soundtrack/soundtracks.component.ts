import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Soundtrack } from '../../model/soundtrack';
import { SoundtrackStore } from '../../lib/store/soundtrack-store';
import { GeneratorService } from '../../lib/service/generator.service';
import { SynthService } from '../../lib/service/synth.service';
import { MelodyService } from '../../lib/service/melody.service';

@Component({
  selector: 'soundtracks',
  templateUrl: './soundtracks.component.html',
  styleUrls: ['./soundtracks.component.css']
})
export class SoundtracksComponent implements OnInit {

  soundtracks$!: Observable<Array<Soundtrack>>;
  soundtracks!: Array<Soundtrack>;

  private soundtracksSubscription!: Subscription;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private soundtrackStore: SoundtrackStore,
    private generatorService: GeneratorService,
    private melodyService: MelodyService,
    private synthService: SynthService
  ) { }

  ngOnInit() {
    this.soundtracks$ = this.soundtrackStore.getSoundtracks$();
    this.observeSoundtracks();
  }

  generateSoundtrack() {
    this.generatorService.generateSoundtrack();
    // this.melodyService.addDummyMelody();
  }

  playSoundtrack(soundtrack: Soundtrack) {
    this.synthService.playSoundtrack(soundtrack);
  }

  stopSoundtrack(soundtrack: Soundtrack) {
    this.synthService.stopSoundtrack(soundtrack);
  }

  replaySoundtrack(soundtrack: Soundtrack) {
    this.synthService.stopSoundtrack(soundtrack);
    this.synthService.playSoundtrack(soundtrack);
  }

  isNowPlaying(soundtrack: Soundtrack): boolean {
    return soundtrack.nowPlaying;
  }

  deleteSoundtrack(soundtrack: Soundtrack) {
    this.soundtrackStore.removeSoundtrack(soundtrack);
  }

  ngOnDestroy() {
    if (this.soundtracksSubscription != null) {
      this.soundtracksSubscription.unsubscribe();
    }
  }

  // Updating a view model in a subscribe() block requires an explicit call to the change detection
  private detectChanges(): void {
    this.changeDetector.detectChanges();
  }

  private observeSoundtracks(): void {
    this.soundtracksSubscription = this.soundtrackStore.getSoundtracks$()
      .subscribe((soundtracks: Array<Soundtrack>) => {
        this.soundtracks = soundtracks;
        this.detectChanges();
      });
  }

}
