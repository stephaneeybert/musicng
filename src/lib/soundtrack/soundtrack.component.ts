import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { MelodyService } from 'lib/service';
import { Soundtrack } from 'lib/model';
import { SoundtrackStore } from 'lib/store';

@Component({
  selector: 'midi-soundtracks',
  templateUrl: './soundtrack.component.html',
  styleUrls: ['./soundtrack.component.css']
})
export class SoundtrackComponent implements OnInit {

  soundtracks$: Observable<Array<Soundtrack>>;

  constructor(
    private soundtrackStore: SoundtrackStore,
    private melodyService: MelodyService,
  ) { }

  ngOnInit() {
    this.soundtracks$ = this.soundtrackStore.state$;
    this.melodyService.addSomeMelodies();
  }

}
