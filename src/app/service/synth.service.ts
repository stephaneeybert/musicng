import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import * as Tone from 'tone';
import { Track } from '@app/model/track';
import { Measure } from '@app/model/measure/measure';
import { Soundtrack } from '@app/model/soundtrack';
import { KeyboardService } from '@app/service/keyboard.service';
import { PlacedChord } from '@app/model/note/placed-chord';
import { NotationService } from './notation.service';
import { TempoUnit } from '@app/model/tempo-unit';
import { SheetService } from './sheet.service';
import { SoundtrackService } from '@app/views/soundtrack/soundtrack.service';
import { Observable, interval, timer, Subscription } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';
import { SettingsService } from '@app/views/settings/settings.service';
import { WakelockService } from '@stephaneeybert/lib-core';
import { NOTE_DOUBLE_SHARP } from '@app/model/note/note';

// Observation has shown that a delay between creating the service
// and starting the transport is required for the transport to work
const TRANSPORT_START_DELAY: number = 5;
const TRANSPORT_STATE_STARTED: string = 'started';
const AUDIO_CONTEXT_RUNNING: string = 'running';
const WHITEWASH_DELAY: number = 3000;
const TEMPO_RAMP_TO_IN_SECONDS: number = 2;
const VELOCITY_MIDI_MAX: number = 127;
const TONEJS_NOTE_SHARP: string = 'x';

// The rest note for the synth is the empty string
const SYNTH_REST_NOTE: string = '';

// Prevent the device screen from locking https://web.dev/wakelock/
const WAKELOCK_TOKEN: string = 'ApKIpnNa3Vl705e8dSRtBi2z7Fu9s3fXFVSejGuj+E9+iUCwuwLqafkLmzsPDqHJCg3qC64K84Fu1boj4Wf68wQAAABteyJvcmlnaW4iOiJodHRwczovL3N0ZXBoYW5lZXliZXJ0LmdpdGh1Yi5pbzo0NDMiLCJmZWF0dXJlIjoiV2FrZUxvY2siLCJleHBpcnkiOjE1OTQxNjYzOTksImlzU3ViZG9tYWluIjp0cnVlfQ==';

@Injectable({
  providedIn: 'root'
})
export class SynthService {

  constructor(
    private environment: environment,
    private notationService: NotationService,
    private keyboardService: KeyboardService,
    private sheetService: SheetService,
    private soundtrackService: SoundtrackService,
    private settingsService: SettingsService,
    private wakelockService: WakelockService
  ) {
    this.startTransport();
    this.wakelockService.setMetaToken(WAKELOCK_TOKEN);
    this.wakelockService.setEnvironment(environment);
  }

  public createSynth(): Tone.PolySynth {
    const synth: Tone.PolySynth = new Tone.PolySynth(Tone.Synth, {
      "volume": 0,
      "detune": 0,
      "portamento": 0,
      "envelope": {
        "attack": 0.005,
        "attackCurve": "linear",
        "decay": 0.1,
        "decayCurve": "exponential",
        "release": 1,
        "releaseCurve": "exponential",
        "sustain": 0.3
      },
      "oscillator": {
        "partialCount": 0,
        "phase": 0,
        "type": "triangle"
      }
    }).toDestination();

    // TODO Have a volume slider synth.volume.value = -6;

    return synth;
  }

  // Start the transport
  public startTransport(): void {
    Tone.start();
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

  public audioContextIsRunning$(): Observable<boolean> {
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
    return Tone.context.state === AUDIO_CONTEXT_RUNNING;
  }

  public playSoundtrack(soundtrack: Soundtrack) {
    if (soundtrack.hasNotes()) {
      this.wakelockService.requestWakeLock();
      // The transport needs to be reset right before playing
      // otherwise the transport time has aready run away
      // and by the time the playing starts some notes scheduled times
      // may have already passed
      this.clearTransport();
      this.stopOtherSoundtracks(soundtrack);

      if (!this.isTransportStarted()) {
        throw new Error('The soundtrack cannot be played as the tone transport has not started.');
      }

      const animatedStave: boolean = this.settingsService.getSettings().animatedStave;

      this.createSoundtrackSynths(soundtrack);

      soundtrack.tracks.forEach((track: Track) => {
        this.play(track, soundtrack, animatedStave);
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
    this.wakelockService.releaseWakeLock();

    const animatedStave: boolean = this.settingsService.getSettings().animatedStave;
    if (animatedStave) {
      const subscription: Subscription = timer(WHITEWASH_DELAY).subscribe((time: number) => {
        this.sheetService.whitewashSheetContext(soundtrack.sheetContext);
        this.sheetService.drawAllFirstMeasures(soundtrack, animatedStave);
        subscription.unsubscribe();
      });
    }
  }

  private createSoundtrackSynths(soundtrack: Soundtrack): void {
    soundtrack.getSortedTracks().forEach((track: Track) => {
      if (track.synth == null) {
        track.synth = this.createSynth();
      }
    });
  }

  // Some release events may not be processed when stopping the play
  // resulting in notes that keep playing for ever
  private releaseAllSoundtrackNotes(soundtrack: Soundtrack): void {
    soundtrack.getSortedTracks().forEach((track: Track) => {
      if (track.synth != null) {
        track.synth.releaseAll();
      }
    });
  }

  private setPlaying(soundtrack: Soundtrack, playing: boolean): void {
    soundtrack.nowPlaying = playing;
    this.soundtrackService.updateSoundtrack(soundtrack);
  }

  private play(track: Track, soundtrack: Soundtrack, animatedStave: boolean): void {
    let previousScheduledMeasure: Measure;
    let firstMeasure: Measure;

    // By starting at 1 instead of 0 the first measure is never skipped when playing
    let measureCounter: number = 1;

    this.setPlaying(soundtrack, true);

    track.getSortedMeasures().forEach((measure: Measure) => {
      // Wait for user idleness before starting playing
      let relativeTime: number = 0;

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
      Tone.Transport.scheduleOnce((measureStartTime: number) => {
        // The time of notes relative to the start of the current measure
        // Note that a non zero init time is needed to have the first note key press displayed
        relativeTime += 0.01;

        if (measure.placedChords) {
          measure.getSortedChords().forEach((placedChord: PlacedChord) => {
            const duration: string = placedChord.renderDuration();
            const durationInSeconds: number = Tone.Time(duration).toSeconds();
            let triggerTime = measureStartTime + relativeTime;
            const releaseTime = triggerTime + durationInSeconds;

            if (!placedChord.isEndOfTrackPlacedChord()) {
              const textNotes: Array<string> = this.noteToSynthNote(placedChord.renderIntlChromaOctave());
              track.synth!.triggerAttack(textNotes, triggerTime, placedChord.velocity);
              track.synth!.triggerRelease(textNotes, releaseTime);
              Tone.Draw.schedule(() => {
                if (placedChord.isFirst()) {
                  if (animatedStave) {
                    this.sheetService.whitewashStave(soundtrack.sheetContext, soundtrack.getNbTracks(), track.index, measure.index);
                    this.sheetService.drawMeasure(measure, track, soundtrack, animatedStave);
                  }
                }
                this.sheetService.highlightStaveNote(placedChord, soundtrack);
                this.keyboardService.pressKey(soundtrack.keyboard, this.textToMidiNotes(placedChord.renderIntlChromaOctave()));
              }, triggerTime);
              Tone.Draw.schedule(() => {
                this.sheetService.unhighlightStaveNote(placedChord, soundtrack);
                this.keyboardService.unpressKey(soundtrack.keyboard, this.textToMidiNotes(placedChord.renderIntlChromaOctave()));
              }, releaseTime);
            } else {
              Tone.Draw.schedule(() => {
                if (animatedStave) {
                  this.sheetService.whitewashStave(soundtrack.sheetContext, soundtrack.getNbTracks(), track.index, measure.index);
                  this.sheetService.drawMeasure(firstMeasure, track, soundtrack, animatedStave);
                }
                track.playingComplete = true;
                if (this.allTracksCompletedPlaying(soundtrack)) {
                  this.stopSoundtrack(soundtrack);
                }
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
    if (previousMeasure == null || previousMeasure.tempo !== measure.tempo) {
      if (previousMeasure != null) {
        console.log(previousMeasure.tempo);
        console.log('Ramp up tempo ' + measure.getTempo());
      }
      Tone.Transport.bpm.rampTo(measure.getTempo(), TEMPO_RAMP_TO_IN_SECONDS);
    } else {
      console.log('Change tempo to ' + measure.getTempo());
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

  public noteOn(midiNote: number, midiVelocity: number, synth: Tone.PolySynth): void {
    const textNote: string = this.midiToTextNote(midiNote);
    synth.triggerAttack(textNote, Tone.context.currentTime, this.velocityMidiToTonejs(midiVelocity));
  }

  public noteOff(midiNote: number, synth: Tone.PolySynth): void {
    const textNote: string = this.midiToTextNote(midiNote);
    synth.triggerRelease(textNote);
  }

  public velocityMidiToTonejs(midiVelocity: number): number {
    if (midiVelocity > VELOCITY_MIDI_MAX) {
      throw new Error('The MIDI velocity ' + midiVelocity + ' is greater than the maximum MIDI velocity ' + VELOCITY_MIDI_MAX);
    }
    return midiVelocity / VELOCITY_MIDI_MAX;
  }

  public velocityTonejsToMidi(tonejsVelocity: number): number {
    return tonejsVelocity * VELOCITY_MIDI_MAX;
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

  private noteToSynthNote(textNotes: Array<string>): Array<string> {
    return textNotes
      .map((textNote: string) => {
        if (!this.notationService.abcNoteIsNotRest(textNote)) {
          return SYNTH_REST_NOTE;
        } else {
          // Replace all double sharp accidentals by x characters
          let synthTextNote: string = textNote.replace(NOTE_DOUBLE_SHARP, TONEJS_NOTE_SHARP);
          return synthTextNote;
        }
      });
  }

  private allTracksCompletedPlaying(soundtrack: Soundtrack): boolean {
    const complete: boolean = soundtrack.tracks
      .every((track: Track) => {
        return track.playingComplete;
      });
    return complete;
  }

}
