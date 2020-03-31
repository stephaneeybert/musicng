import { Injectable } from '@angular/core';
import Tone from 'tone';
import { Track } from '../../model/track';
import { Measure } from '../../model/measure/measure';
import { Soundtrack } from '../../model/soundtrack';
import { KeyboardService } from '../service/keyboard.service';
import { PlacedChord } from '../../model/note/placed-chord';
import { Note } from '../../model/note/note';
import { ParseService } from '../service/parse.service';
import { TempoUnit } from '../../model/tempo-unit';
import { SheetService } from './sheet.service';

// Observation has shown that a delay between creating the service
// and starting the transport is required for the transport to work
const TRANSPORT_START_DELAY = 5;
const TRANSPORT_STATE_STARTED = 'started';

@Injectable({
  providedIn: 'root'
})
export class SynthService {

  constructor(
    private parseService: ParseService,
    private keyboardService: KeyboardService,
    private sheetService: SheetService
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

  // TODO Create an observable used to enable play button
  private transportIsStarted(): boolean {
    return Tone.Transport.state == TRANSPORT_STATE_STARTED;
  }

  public playSoundtrack(soundtrack: Soundtrack) {
    if (soundtrack.hasNotes()) {
      this.clearTransport();
      soundtrack.tracks.forEach((track: Track) => {
        this.play(track, soundtrack);
      });
    }
  }

  private play(track: Track, soundtrack: Soundtrack) {
    let measureCounter: number = 0;
    let firstMeasure: boolean = true;
    let previousMeasure: Measure;

    if (!this.transportIsStarted()) {
      throw new Error('The soundtrack cannot be played as the tone transport has not started.');
    }

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

        if (measure.hasChords()) {
          measure.placedChords!.forEach((placedChord: PlacedChord) => {
            const duration: string = placedChord.renderDuration();
            const durationInSeconds = Tone.Time(duration).toSeconds();
            placedChord.notes.forEach((note: Note) => {
              // If the note is a rest then do not play anything
              if (this.parseService.noteIsNotRest(note)) {
                let triggerTime = measureStartTime + relativeTime;
                const releaseTime = triggerTime + durationInSeconds;
                soundtrack.synth.triggerAttack(note.render(), triggerTime, note.velocity);
                soundtrack.synth.triggerRelease(note.render(), releaseTime);

                const midiNote = Tone.Frequency(note.render()).toMidi();
                Tone.Draw.schedule(() => {
                  this.keyboardService.pressKey(soundtrack.keyboard, midiNote);
                  this.sheetService.vexflowHighlightStaveNote(placedChord);
                }, triggerTime);
                Tone.Draw.schedule(() => {
                  this.keyboardService.unpressKey(soundtrack.keyboard, midiNote);
                  this.sheetService.vexflowUnhighlightStaveNote(placedChord);
                }, releaseTime);
              }
            });
            relativeTime += durationInSeconds;
          });
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
      if (this.parseService.isBpmTempoUnit(measure.tempo)) {
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
