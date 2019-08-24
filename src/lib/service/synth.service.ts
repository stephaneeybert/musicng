import { Injectable } from '@angular/core';
import Tone from 'tone';
import { Track } from 'lib/model/track';
import { Measure } from 'lib/model/measure/measure';
import { Soundtrack } from 'lib/model';
import { KeyboardService } from 'lib/service/keyboard.service';
import { PlacedNote } from 'lib/model/note/placed-note';
import { Note } from 'lib/model/note/note';
import { ParseService } from 'lib/service/parse.service';
import { TempoUnit } from 'lib/model/tempo-unit';

const TRANSPORT_START_DELAY = 10;

@Injectable({
  providedIn: 'root'
})
export class SynthService {

  constructor(
    private parseService: ParseService,
    private keyboardService: KeyboardService
  ) {
    this.startTransport();
  }

  public createSoundtrackSynth(): any {
    return this.createDeviceSynth();
  }

  public createDeviceSynth(): any {
    const synth = new Tone.PolySynth(8, Tone.Synth, {
      oscillator: {
        // type: 'triangle', // sine, square, triangle, or sawtooth
        // partials: [0, 2, 3, 4] // TODO
      },
      envelope : {
        attack : 0.02,
        decay : 0.1,
        sustain : 0.3,
        release : 1
      }
    }).toMaster();

    // synth.voices.forEach((voice: any) => {  // TODO Hard coded values
    //   voice.oscillator.type = 'sawtooth';
    //   voice.envelope.attack = 0.005;
    //   voice.envelope.decay = 0.1;
    //   voice.envelope.sustain = 0.3;
    //   voice.envelope.release = 1;
    // });

    // const distortion = new Tone.Distortion(1.4).toMaster(); // Some distortion
    // synth.connect(distortion);
    return synth;
  }

  // Start the transport
  private startTransport() {
    Tone.Transport.stop();
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
    let previousMeasure: Measure = null;
    console.log('Playing the track ' + track.name + ' of the soundtrack ' + soundtrack.name);

    track.measures.forEach((measure: Measure) => {
      // The first measure is always supposed to have a new tempo and time signature
      if (firstMeasure) {
        this.updateTempo(previousMeasure, measure, false);
        this.updateTimeSignature(measure);
        firstMeasure = false;
      }

      // Schedule each measure independently
      Tone.Transport.schedule((time: any) => {
        this.updateTempo(previousMeasure, measure, true);
        this.updateTimeSignature(measure);

        // The time of notes relative to the start of the current measure
        let relativeTime: number = 0;

        measure.placedNotes.forEach((placedNote: PlacedNote) => {
          const note: Note = placedNote.note;
          const duration = Tone.Time(note.renderDuration()).toSeconds();
          console.log('Sounding note: ' + note.renderAbc() + ' ' + note.velocity + ' ' + duration);
          // If the note is a rest then do not play anything
          if (this.parseService.isNote(note.renderAbc())) {
            let triggerTime = time + relativeTime;
            if (note.time != null) {
              triggerTime = note.time;
            }
            const releaseTime = triggerTime + duration;
            soundtrack.synth.triggerAttack(note.renderAbc(), triggerTime, note.velocity);
            soundtrack.synth.triggerRelease(note.renderAbc(), releaseTime);
            const midiNote = Tone.Frequency(note.renderAbc()).toMidi();
            this.keyboardService.pressKey(soundtrack.keyboard, midiNote);
            // this.sheetService.HighlightNote(soundtrack.sheet, note); TODO
            Tone.Transport.schedule((actualTime: any) => {
              this.keyboardService.unpressKey(soundtrack.keyboard, midiNote);
              // this.sheetService.UnhighlightNote(soundtrack.sheet, note); TODO
            }, releaseTime - TRANSPORT_START_DELAY);
          }
          relativeTime += duration;
        });
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

  private playMeasure(soundtrack: Soundtrack, measure: Measure) {
    measure.placedNotes.forEach(placedNote => {
      Tone.Transport.schedule(time => {
        soundtrack.synth.triggerAttackRelease(placedNote.note.pitch.renderAbc(), placedNote.cursor.toTime(), time);
      }, placedNote.cursor.toTime());
    });
    Tone.Transport.start();
  }

}
