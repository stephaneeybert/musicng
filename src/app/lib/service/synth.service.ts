import { Injectable } from '@angular/core';
import Tone from 'tone';
import { Track } from '../../model/track';
import { Measure } from '../../model/measure/measure';
import { Soundtrack } from '../../model/soundtrack';
import { KeyboardService } from '../service/keyboard.service';
import { PlacedChord } from '../../model/note/placed-chord';
import { NotationService } from './notation.service';
import { TempoUnit } from '../../model/tempo-unit';
import { SheetService } from './sheet.service';
import { SoundtrackService } from '@app/views/soundtrack/soundtrack.service';
import { Observable, interval } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';
import { CommonService } from './common.service';

// Observation has shown that a delay between creating the service
// and starting the transport is required for the transport to work
const TRANSPORT_START_DELAY = 5;
const TRANSPORT_STATE_STARTED = 'started';
const AUDIO_CONTEXT_RUNNING: string = 'running';
const PLAY_START_DELAY = 0;
const CHORD_WIDTH: number = 3;
const VELOCITY_TONEJS: number = 0.5;

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
  public startTransport() {
    Tone.Transport.start(TRANSPORT_START_DELAY);
    console.log('Started the transport');
  }

  // Rewind a the position and clear all events if any
  private clearTransport() {
    Tone.Transport.position = 0;
    Tone.Transport.cancel();
    console.log('Cleared the transport');
  }

  // Stop the transport
  private stopTransport() {
    Tone.Transport.stop();
    console.log('Stopped the transport');
  }

  public synthTransportIsStarted$(): Observable<boolean> {
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
    this.commonService.requestWakeLock();
    if (soundtrack.hasNotes()) {
      this.stopAllSoundtracks();
      soundtrack.tracks.forEach((track: Track) => {
        this.play(track, soundtrack);
      });
    } else {
      throw new Error('The soundtrack contains no notes and could not be played.');
    }
  }

  public stopAllSoundtracks() {
    this.soundtrackService.getSoundtracks().forEach((soundtrack: Soundtrack) => {
      this.stopSoundtrack(soundtrack);
    });
  }

  public stopSoundtrack(soundtrack: Soundtrack) {
    this.setPlaying(soundtrack, false);
    this.clearTransport();
    this.sheetService.hideSoundtrackPlacedChords(soundtrack);
  }

  private setPlaying(soundtrack: Soundtrack, playing: boolean): void {
    soundtrack.nowPlaying = playing;
    this.soundtrackService.setSoundtrack(soundtrack);
  }

  private play(track: Track, soundtrack: Soundtrack) {
    let previousScheduledMeasure: Measure;
    let previousDrawnMeasure: Measure;
    let firstMeasure: Measure;

    // By starting at 1 instead of 0 the first measure is never skipped when playing
    let measureCounter: number = 1;

    if (!this.isTransportStarted()) {
      throw new Error('The soundtrack cannot be played as the tone transport has not started.');
    }

    this.setPlaying(soundtrack, true);

    track.getSortedMeasures().forEach((measure: Measure) => {
      // Wait for user idleness before starting playing
      let relativeTime: number = PLAY_START_DELAY;

      // Schedule each measure independently
      Tone.Transport.scheduleOnce((measureStartTime: any) => {
        // The first measure is always supposed to have a new tempo and time signature
        if (measure.isFirst()) {
          this.updateTempo(previousScheduledMeasure, measure, false);
          this.updateTimeSignature(measure);
          firstMeasure = measure;
        } else {
          this.updateTempo(previousScheduledMeasure, measure, true);
          this.updateTimeSignature(measure);
        }

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
              soundtrack.synth.triggerAttack(textNotes, triggerTime, VELOCITY_TONEJS);
              soundtrack.synth.triggerRelease(textNotes, releaseTime);
              Tone.Draw.schedule((actualTime: any) => {
                if (placedChord.isFirst()) {
                  if (previousDrawnMeasure != null) {
                    // this.sheetService.removeMeasure(previousDrawnMeasure, soundtrack.sheetContext);
                    this.sheetService.hideMeasure(previousDrawnMeasure);
                    // this.sheetService.whitewashStave(soundtrack.sheetContext);
                  }
                  if (!measure.isFirst()) {
                    this.sheetService.showMeasure(measure);
                  }
                }
                this.keyboardService.pressKey(soundtrack.keyboard, this.textToMidiNotes(placedChord.renderAbc()));
                this.sheetService.vexflowHighlightStaveNote(placedChord, soundtrack.sheetContext);
                previousDrawnMeasure = measure;
              }, triggerTime);
              Tone.Draw.schedule((actualTime: any) => {
                this.keyboardService.unpressKey(soundtrack.keyboard, this.textToMidiNotes(placedChord.renderAbc()));
                this.sheetService.vexflowUnhighlightStaveNote(placedChord, soundtrack.sheetContext);
              }, releaseTime);
            } else {
              Tone.Draw.schedule((actualTime: any) => {
                if (previousDrawnMeasure != null) {
                  this.sheetService.hideMeasure(previousDrawnMeasure);
                  // this.sheetService.whitewashStave(soundtrack.sheetContext);
                  this.sheetService.showMeasure(firstMeasure);
                }
                this.setPlaying(soundtrack, false);
                this.keyboardService.unpressAll(soundtrack.keyboard);
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
  private updateTempo(previousMeasure: Measure, measure: Measure, ramp: boolean) {
    if (previousMeasure == null || previousMeasure.tempo.subdivision.left !== measure.tempo.subdivision.left || previousMeasure.tempo.subdivision.right !== measure.tempo.subdivision.right) {
      if (this.notationService.isBpmTempoUnit(measure.tempo)) {
        if (ramp) {
          Tone.Transport.bpm.rampTo(measure.getTempo(), 1);
        } else {
          Tone.Transport.bpm.value = measure.getTempo();
        }
      }
    }
  }

  // TODO
  private isAnotherMeasure(previousMeasure: Measure, measure: Measure): boolean {
    if (previousMeasure == null || previousMeasure.index !== measure.index) {
      return true;
    } else {
      return false;
    }
  }

  private updateTimeSignature(measure: Measure) {
    if (measure.timeSignature != null) {
      Tone.Transport.timeSignature = [
        measure.timeSignature.numerator,
        measure.timeSignature.denominator
      ];
    }
  }

  public noteOn(midiNote: number, velocity: number, synth: any) {
    const textNote: string = this.midiToTextNote(midiNote);
    synth.triggerAttack(textNote, Tone.Context.currentTime, this.notationService.velocityMidiToTonejs(velocity));
  }

  public noteOff(midiNote: number, synth: any) {
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
