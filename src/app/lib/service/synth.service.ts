import { Injectable } from '@angular/core';
import * as Tone from 'tone';
import { Track } from '@app/model/track';
import { Measure } from '@app/model/measure/measure';
import { Soundtrack } from '@app/model/soundtrack';
import { KeyboardService } from '@app/lib/service/keyboard.service';
import { PlacedChord } from '@app/model/note/placed-chord';
import { NotationService } from './notation.service';
import { TempoUnit } from '@app/model/tempo-unit';
import { SheetService } from './sheet.service';
import { SoundtrackService } from '@app/views/soundtrack/soundtrack.service';
import { Observable, interval, timer, Subscription } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';
import { CommonService } from '@app/core/service/common.service';
import { SettingsService } from '@app/views/settings/settings.service';

// Observation has shown that a delay between creating the service
// and starting the transport is required for the transport to work
const TRANSPORT_START_DELAY = 5;
const TRANSPORT_STATE_STARTED = 'started';
const AUDIO_CONTEXT_RUNNING: string = 'running';
const PLAY_START_DELAY = 0;
const CHORD_WIDTH: number = 3;
const WHITEWASH_DELAY: number = 3000;
const TEMPO_RAMP_TO_IN_SECONDS: number = 2;

// The rest note for the synth is the empty string
const SYNTH_REST_NOTE: string = '';

@Injectable({
  providedIn: 'root'
})
export class SynthService {

  constructor(
    private notationService: NotationService,
    private keyboardService: KeyboardService,
    private sheetService: SheetService,
    private soundtrackService: SoundtrackService,
    private settingsService: SettingsService,
    private commonService: CommonService
  ) {
    this.startTransport();
  }

  public createSoundtrackSynth(): any {
    return this.createDeviceSynth();
  }

  public createDeviceSynth(): any {

    const synth: any = new Tone.PolySynth(CHORD_WIDTH, Tone.Synth, {
      oscillator: {
        type: 'sine',
      }
    }).toMaster();

    // var synth = new Tone.PolySynth(3, Tone.Synth, {
    //   "oscillator" : {
    //     "type" : "fatsawtooth",
    //     "count" : 3,
    //     "spread" : 30
    //   },
    //   "envelope": {
    //     "attack": 0.01,
    //     "decay": 0.1,
    //     "sustain": 0.5,
    //     "release": 0.4,
    //     "attackCurve" : "exponential"
    //   },
    // }).toMaster();

    // const synth: any = new Tone.PolySynth(4, Tone.Synth, {
    //   "volume" : -8,
    //   "oscillator" : {
    //       "partials" : [1, 2, 5],
    //   },
    //   "portamento" : 0.005
    // }).toMaster()

    // const synthFilter: any = new Tone.Filter(300, 'lowpass').connect(
    //   new Tone.Gain(0.4).toMaster()
    // );
    // const synthConfig: any = {
    //   oscillator: {
    //     type: 'fattriangle'
    //   },
    //   envelope: {
    //     attack: 3,
    //     sustain: 1,
    //     release: 1
    //   }
    // };
    // const synth: any = new Tone.PolySynth(CHORD_WIDTH, Tone.Synth, synthConfig)
    // .connect(synthFilter)
    // .toMaster();

    // const synth: any = new Tone.Synth(synthConfig)
    // .connect(synthFilter);

    return synth;
  }

  // Start the transport
  public startTransport(): void {
    Tone.Transport.start(TRANSPORT_START_DELAY);
    console.log('Started the transport');
  }

  // Rewind a the position and clear all events if any
  private clearTransport(): void {
    Tone.Transport.position = 0;
    Tone.Transport.cancel();
    console.log('Cleared the transport');
  }

  // Stop the transport
  private stopTransport(): void {
    Tone.Transport.stop();
    console.log('Stopped the transport');
  }

  public audioTransportIsStarted$(): Observable<boolean> {
    return interval(1000)
      .pipe(
        map((value: number) => {
          return this.isTransportStarted();
        }),
        filter((isStarted: boolean) => isStarted),
        take(1)
      );
  }

  private isTransportStarted(): boolean {
    console.log('Tone Transport: ' + Tone.Transport.state);
    return Tone.Transport.state === TRANSPORT_STATE_STARTED;
  }

  public audioIsRunning$(): Observable<boolean> {
    return interval(1000)
      .pipe(
        map((value: number) => {
          return this.isAudioContextRunning();
        }),
        filter((isRunning: boolean) => isRunning),
        take(1)
      );
  }

  private isAudioContextRunning(): boolean {
    console.log('Audio Context: ' + Tone.context.state);
    return Tone.context.state === AUDIO_CONTEXT_RUNNING;
  }

  public playSoundtrack(soundtrack: Soundtrack) {
    if (soundtrack.hasNotes()) {
      this.commonService.requestWakeLock();
      // The transport needs to be reset right before playing
      // otherwise the transport time has aready run away
      // and by the time the playing starts some notes scheduled times
      // may have already passed
      this.clearTransport();
      this.stopOtherSoundtracks(soundtrack);

      soundtrack.tracks.forEach((track: Track) => {
        this.play(track, soundtrack);
      });
    } else {
      throw new Error('The soundtrack contains no notes and could not be played.');
    }
  }

  private stopOtherSoundtracks(playSoundtrack: Soundtrack): void {
    this.soundtrackService.getSoundtracks()
    .filter((soundtrack: Soundtrack) => soundtrack.id != playSoundtrack.id)
    .forEach((soundtrack: Soundtrack) => {
      this.stopSoundtrack(soundtrack);
    });
  }

  public stopSoundtrack(soundtrack: Soundtrack): void {
    this.setPlaying(soundtrack, false);
    this.releaseAllSoundtrackNotes(soundtrack);
    this.keyboardService.unpressAll(soundtrack.keyboard);
    this.clearTransport();

    const animatedStave: boolean = this.settingsService.getSettings().animatedStave;
    if (animatedStave) {
      const subscription: Subscription = timer(WHITEWASH_DELAY).subscribe((time: number) => { // TODO Missing unsubscribe
        this.sheetService.whitewashSheetContext(soundtrack.sheetContext);
        this.sheetService.drawFirstMeasure(soundtrack);
        subscription.unsubscribe();
      });
    }
  }

  // Some release events may not be processed when stopping the play
  // resulting in notes that keep playing for ever
  private releaseAllSoundtrackNotes(soundtrack: Soundtrack): void {
    if (soundtrack.synth != null) {
      soundtrack.synth.releaseAll();
    }
  }

  private setPlaying(soundtrack: Soundtrack, playing: boolean): void {
    soundtrack.nowPlaying = playing;
    this.soundtrackService.setSoundtrack(soundtrack);
  }

  private play(track: Track, soundtrack: Soundtrack): void {
    let previousScheduledMeasure: Measure;
    let previousDrawnMeasure: Measure;
    let firstMeasure: Measure;

    // By starting at 1 instead of 0 the first measure is never skipped when playing
    let measureCounter: number = 1;

    if (!this.isTransportStarted()) {
      throw new Error('The soundtrack cannot be played as the tone transport has not started.');
    }

    this.setPlaying(soundtrack, true);

    const animatedStave: boolean = this.settingsService.getSettings().animatedStave;

    track.getSortedMeasures().forEach((measure: Measure) => {
      // Wait for user idleness before starting playing
      let relativeTime: number = PLAY_START_DELAY;

      // The first measure is always supposed to have a new tempo and time signature
      if (measure.isFirst()) {
        this.updateTempo(previousScheduledMeasure, measure);
        this.updateTimeSignature(measure);
        firstMeasure = measure;
      } else {
        this.updateTempo(previousScheduledMeasure, measure);
        this.updateTimeSignature(measure);
      }

      // Schedule each measure independently
      Tone.Transport.scheduleOnce((measureStartTime: any) => {
        // The time of notes relative to the start of the current measure
        // Note that a non zero init time is needed to have the first note key press displayed
        relativeTime += 0.01;

        if (measure.placedChords) {
          measure.getSortedChords().forEach((placedChord: PlacedChord) => {
            const duration: string = placedChord.renderDuration();
            const durationInSeconds = Tone.Time(duration).toSeconds();
            let triggerTime = measureStartTime + relativeTime;
            const releaseTime = triggerTime + durationInSeconds;

            if (!this.notationService.isEndOfTrackPlacedChord(placedChord)) {
              const textNotes: Array<string> = this.restToSynthRest(placedChord.renderAbc());
              soundtrack.synth.triggerAttack(textNotes, triggerTime, placedChord.velocity);
              soundtrack.synth.triggerRelease(textNotes, releaseTime);
              Tone.Draw.schedule((actualTime: any) => {
                if (placedChord.isFirst()) {
                  if (animatedStave) {
                    this.sheetService.whitewashStave(soundtrack.sheetContext, soundtrack.getNbTracks(), track.index, measure.index);
                    this.sheetService.drawMeasure(measure, soundtrack.sheetContext);
                  }
                }
                this.sheetService.highlightStaveNote(placedChord, soundtrack);
                this.keyboardService.pressKey(soundtrack.keyboard, this.textToMidiNotes(placedChord.renderAbc()));
                previousDrawnMeasure = measure;
              }, triggerTime);
              Tone.Draw.schedule((actualTime: any) => {
                this.sheetService.unhighlightStaveNote(placedChord, soundtrack);
                this.keyboardService.unpressKey(soundtrack.keyboard, this.textToMidiNotes(placedChord.renderAbc()));
              }, releaseTime);
            } else {
              Tone.Draw.schedule((actualTime: any) => {
                if (animatedStave) {
                  this.sheetService.whitewashStave(soundtrack.sheetContext, soundtrack.getNbTracks(), track.index, measure.index);
                  this.sheetService.drawMeasure(firstMeasure, soundtrack.sheetContext);
                }
                this.keyboardService.unpressAll(soundtrack.keyboard);
                this.setPlaying(soundtrack, false);
                this.commonService.releaseWakeLock();
              }, releaseTime);
            }
            relativeTime += durationInSeconds;
          });
        } else {
          throw new Error('The measure placed chords array has not been instantiated.');
        }
        previousScheduledMeasure = measure;
      }, measureCounter + TempoUnit.MEASURE);
      measureCounter++;
    });
  }

  /**
   * Apply the tempo to the transport
   * @param Measure measure
   * @param boolean ramp If true, the tempo will ramp up or down, otherwise it will change instantly.
   */
  private updateTempo(previousMeasure: Measure, measure: Measure): void {
    if (previousMeasure == null || previousMeasure.tempo.subdivision.left !== measure.tempo.subdivision.left || previousMeasure.tempo.subdivision.right !== measure.tempo.subdivision.right && this.notationService.isBpmTempoUnit(measure.tempo)) {
      // console.log('Ramp up tempo ' + measure.getTempo());
      Tone.Transport.bpm.value = measure.getTempo();
      // Tone.Transport.bpm.rampTo(measure.getTempo(), TEMPO_RAMP_TO_IN_SECONDS);
    } else {
      // console.log('Change tempo to ' + measure.getTempo());
      Tone.Transport.bpm.value = measure.getTempo();
    }
  }

  private updateTimeSignature(measure: Measure): void {
    if (measure.timeSignature != null) {
      // console.log('Updated time signature to ' + measure.timeSignature.numerator + ' / ' + measure.timeSignature.denominator);
      Tone.Transport.timeSignature = [
        measure.timeSignature.numerator,
        measure.timeSignature.denominator
      ];
    }
  }

  public noteOn(midiNote: number, midiVelocity: number, synth: any): void {
    const textNote: string = this.midiToTextNote(midiNote);
    synth.triggerAttack(textNote, Tone.Context.currentTime, this.notationService.velocityMidiToTonejs(midiVelocity));
  }

  public noteOff(midiNote: number, synth: any): void {
    const textNote: string = this.midiToTextNote(midiNote);
    synth.triggerRelease(textNote, Tone.Context.currentTime);
  }

  public midiToTextNote(midiNote: number): string {
    return Tone.Midi(midiNote).toNote();
  }

  public textToMidiNote(textNote: string): number {
    return Tone.Midi(textNote).toMidi();
  }

  private textToMidiNotes(textNotes: Array<string>): Array<number> {
    return textNotes
      .map((textNote: string) => {
        return this.textToMidiNote(textNote);
      });
  }

  private restToSynthRest(textNotes: Array<string>): Array<string> {
    return textNotes
      .map((textNote: string) => {
        if (!this.notationService.abcNoteIsNotRest(textNote)) {
          return SYNTH_REST_NOTE;
        } else {
          return textNote;
        }
      });
  }

}
