import { Injectable } from '@angular/core';
import Tone from 'tone';
import { Track } from '../../model/track';
import { Measure } from '../../model/measure/measure';
import { Soundtrack } from '../../model/soundtrack';
import { KeyboardService } from '../service/keyboard.service';
import { PlacedChord } from '../../model/note/placed-chord';
import { Note } from '../../model/note/note';
import { NotationService } from './notation.service';
import { TempoUnit } from '../../model/tempo-unit';
import { SheetService } from './sheet.service';
import { SoundtrackService } from '@app/views/soundtrack/soundtrack.service';
import { Observable, interval } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';

// Observation has shown that a delay between creating the service
// and starting the transport is required for the transport to work
const TRANSPORT_START_DELAY = 5;
const TRANSPORT_STATE_STARTED = 'started';

@Injectable({
  providedIn: 'root'
})
export class SynthService {

  constructor(
    private notationService: NotationService,
    private keyboardService: KeyboardService,
    private sheetService: SheetService,
    private soundtrackService: SoundtrackService
  ) {
    this.startTransport();
  }

  public createSoundtrackSynth(): any {
    return this.createDeviceSynth();
  }

  public createDeviceSynth(): any {
    const synth = new Tone.PolySynth(8, Tone.Synth, {
      oscillator: {
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    }).toMaster();

    return synth;
  }

  // Start the transport
  private startTransport() {
    Tone.Transport.stop();
    Tone.Transport.start(TRANSPORT_START_DELAY);
  }

  // Rewind a the position and clear all events if any
  private clearTransport() {
    Tone.Transport.position = 0;
    Tone.Transport.cancel();
  }

  // Stop the transport
  private stopTransport() {
    Tone.Transport.stop();
  }

  public synthTransportIsStarted$(): Observable<boolean>  {
    return interval(1000)
    .pipe(
      map((value: number) => {
        return this.transportIsStarted();
      }),
      filter((isStarted: boolean) => isStarted),
      take(1)
    );
  }

  private transportIsStarted(): boolean {
    return Tone.Transport.state == TRANSPORT_STATE_STARTED;
  }

  public playSoundtrack(soundtrack: Soundtrack) {
    if (soundtrack.hasNotes()) {
      this.clearTransport();
      this.stopAllOtherSoundtracks(soundtrack);
      soundtrack.tracks.forEach((track: Track) => {
        this.play(track, soundtrack);
      });
    } else {
      throw new Error('The soundtrack contains no notes and could not be played.');
    }
  }

  public stopAllOtherSoundtracks(soundtrack: Soundtrack) {
    this.soundtrackService.getSoundtracks().forEach((soundtrack: Soundtrack) => {
      this.stopSoundtrack(soundtrack);
    });
  }

  public stopSoundtrack(soundtrack: Soundtrack) {
    this.setPlaying(soundtrack, false);
    this.clearTransport();
  }

  private setPlaying(soundtrack: Soundtrack, playing: boolean): void {
    soundtrack.nowPlaying = playing;
    this.soundtrackService.setSoundtrack(soundtrack);
  }

  private play(track: Track, soundtrack: Soundtrack) {
    let measureCounter: number = 0;
    let firstMeasure: boolean = true;
    let previousMeasure: Measure;

    if (!this.transportIsStarted()) {
      throw new Error('The soundtrack cannot be played as the tone transport has not started.');
    }

    this.setPlaying(soundtrack, true);

    track.measures.forEach((measure: Measure) => {
      // The first measure is always supposed to have a new tempo and time signature
      if (firstMeasure) {
        this.updateTempo(previousMeasure, measure, false);
        this.updateTimeSignature(measure);
        firstMeasure = false;
      }

      // Schedule each measure independently
      Tone.Transport.scheduleOnce((measureStartTime: any) => {
        this.updateTempo(previousMeasure, measure, true);
        this.updateTimeSignature(measure);

        // The time of notes relative to the start of the current measure
        // Note that a non zero init time is needed to have the first note key press displayed
        let relativeTime: number = 0.01;

        if (measure.placedChords) {
          measure.placedChords.forEach((placedChord: PlacedChord) => {
            const duration: string = placedChord.renderDuration();
            const durationInSeconds = Tone.Time(duration).toSeconds();
            placedChord.notes.forEach((note: Note) => {
              let triggerTime = measureStartTime + relativeTime;
              const releaseTime = triggerTime + durationInSeconds;

              // If the note is a rest then do not play any sound
              if (this.notationService.noteIsNotRest(note)) {
                soundtrack.synth.triggerAttack(note.render(), triggerTime, note.velocity);
                soundtrack.synth.triggerRelease(note.render(), releaseTime);
              }

              const midiNote = Tone.Frequency(note.render()).toMidi();
              Tone.Draw.schedule(() => {
                if (!this.notationService.isEndOfTrackNote(note)) {
                  this.keyboardService.pressKey(soundtrack.keyboard, midiNote);
                  this.sheetService.vexflowHighlightStaveNote(placedChord);
                }
              }, triggerTime);
              Tone.Draw.schedule(() => {
                if (!this.notationService.isEndOfTrackNote(note)) {
                  this.keyboardService.unpressKey(soundtrack.keyboard, midiNote);
                  this.sheetService.vexflowUnhighlightStaveNote(placedChord);
                } else {
                  this.setPlaying(soundtrack, false);
                }
              }, releaseTime);
            });
            relativeTime += durationInSeconds;
          });
        } else {
          throw new Error('The measure placed chords array has not been instantiated.');
        }
      }, measureCounter + TempoUnit.MEASURE);
      measureCounter++;
      previousMeasure = measure;
    });
  }

  /**
   * Apply the tempo to the transport
   * @param Measure measure
   * @param boolean ramp If true, the tempo will ramp up or down otherwise it will change instantly.
   */
  private updateTempo(previousMeasure: Measure, measure: Measure, ramp: boolean) {
    if (previousMeasure == null || previousMeasure.tempo.value !== measure.tempo.value) {
      if (this.notationService.isBpmTempoUnit(measure.tempo)) {
        if (ramp) {
          Tone.Transport.bpm.rampTo(measure.tempo.value, 1);
        } else {
          Tone.Transport.bpm.value = measure.tempo.value;
        }
      }
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

  public noteOn(note: number, velocity: number, synth: any) {
    synth.triggerAttack(note, null, velocity);
  }

  public noteOff(note: number, synth: any) {
    synth.triggerRelease(note);
  }

  public renderDurationInTicks(duration: string): string {
    return Tone.Time(duration).toTicks() + TempoUnit.TICK;
  }

}
