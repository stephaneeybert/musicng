import { Injectable } from '@angular/core';
import abcjs from 'abcjs/midi';
import * as vexflow from 'vexflow';
// import * as vextab from 'vextab';
import { Soundtrack } from 'lib/model/soundtrack';
import { Device } from 'lib/model/device';
import { ParseService } from 'lib/service/parse.service';
import { Note } from 'lib/model/note/note';
import { Measure } from 'lib/model/measure/measure';
import { Clef } from 'lib/model/clef';

const VEXFLOW_WIDTH = 500;
const VEXFLOW_HEIGHT = 800;
const VEXFLOW_STAVE_HEIGHT = 50;
const VEXFLOW_STAVE_MARGIN = 25;
const VEXFLOW_OCTAVE_SEPARATOR = '/';
const VEXFLOW_EASYSCORE_DURATION_SEPARATOR = '/';
const VEXFLOW_REST_NOTE = 'b/4';
const VEXFLOW_EASYSCORE_REST_NOTE = 'B4';
const VEXFLOW_REST_SUFFIX = 'r';
const VEXFLOW_TIME_SIGNATURE_SEPARATOR = '/';
const VEXFLOW_EASYSCORE_NOTE_SEPARATOR = ',';

const VEXFLOW_DOUBLE_BAR = '||';
const VEXFLOW_REPEAT_BEGIN = '|:';
const VEXFLOW_REPEAT_END = ':|';
const VEXFLOW_DOUBLE_REPEAT = '::';
const VEXFLOW_END_BAR = '|=';

const ABCJS_NOTE_SEPARATOR = '|';
const ABCJS_NOTE_REST = 'z';

@Injectable({
  providedIn: 'root'
})
export class SheetService {

  private VF = vexflow.Flow;

  constructor(
    private parseService: ParseService
  ) { }

  public createSoundtrackSheet(name: string, soundtrack: Soundtrack) {
    // this.renderSoundtrackVexflowEasyScore(name, soundtrack);
    this.renderSoundtrackVexflow(name, soundtrack);
    // this.createSheetAbcjs(name, soundtrack);
  }

  private renderSoundtrackVexflowEasyScore(name: string, soundtrack: Soundtrack) {
    const factory = new this.VF.Factory({ renderer: { elementId: name } });
    const score = factory.EasyScore();
    const system = factory.System();

    if (soundtrack.hasTracks()) {
      for (const track of soundtrack.tracks) {
        if (track.hasMeasures()) {
          for (const measure of track.measures) {
            if (measure.hasNotes()) {
              let strNotes: string = '';
              const voices = new Array<vexflow.Flow.Voice>();
              for (const placedNote of measure.placedNotes) {
                const note: Note = placedNote.note;
                if (strNotes.length > 0) {
                  strNotes += VEXFLOW_EASYSCORE_NOTE_SEPARATOR;
                }
                if (this.parseService.isNote(note.renderAbc())) {
                  strNotes += note.renderAbc() + VEXFLOW_EASYSCORE_DURATION_SEPARATOR + note.renderDuration();
                } else {
                  strNotes += VEXFLOW_EASYSCORE_REST_NOTE
                    + VEXFLOW_EASYSCORE_DURATION_SEPARATOR + note.renderDuration()
                    + VEXFLOW_EASYSCORE_DURATION_SEPARATOR + VEXFLOW_REST_SUFFIX;
                }
              }
              // strNotes = '(E5 Bb4 C5)/4,B#4,A4,G#4'; // TODO Example that works fine
              console.log('strNotes: ' + strNotes);
              const voice = score.voice(score.notes(strNotes));
              voice.setStrict(false);
              voices.push(voice);
              system.addStave({ voices: voices })
              .addClef(Clef.TREBLE).addTimeSignature(this.renderTimeSignature(measure));
            }
          }
        }
      }
      system.addConnector();
      factory.draw();
    }
  }

  public renderDeviceVexflow(name: string, device: Device) {
    // const context = this.renderContext(name, VEXFLOW_WIDTH, VEXFLOW_HEIGHT);
    // this.renderStave(context, device); TODO
  }

  private renderSoundtrackVexflow(name: string, soundtrack: Soundtrack) {
    const context = this.renderVexflowContext(name, VEXFLOW_WIDTH, VEXFLOW_HEIGHT);
    context.setFont('Arial', 10, '').setBackgroundFillStyle('#eed'); // TODO Hard coded values

    const voices: Array<vexflow.Flow.Voice> = new Array<vexflow.Flow.Voice>();
    if (soundtrack.hasTracks()) {
      let staveIndex: number = 0;
      for (const track of soundtrack.tracks) {
        if (track.hasMeasures()) {
          for (const measure of track.measures) {
            if (measure.hasNotes()) {
              const stave = new this.VF.Stave(0, staveIndex * (VEXFLOW_STAVE_HEIGHT + VEXFLOW_STAVE_MARGIN), VEXFLOW_WIDTH);
              staveIndex++;
              stave.setContext(context);
              stave.addClef(Clef.TREBLE);
              stave.addTimeSignature(this.renderTimeSignature(measure));
              stave.draw();

              const notes = new Array<vexflow.Flow.StaveNote>();
              const voice = new this.VF.Voice();
              voice.setStrict(false);
              voice.setContext(context);
              voice.setStave(stave);
              for (const placedNote of measure.placedNotes) {
                const note: Note = placedNote.note;
                console.log('Provided duration: ' + this.renderDuration(note));
                notes.push(new this.VF.StaveNote({ keys: [ this.renderAbc(note) ], duration: this.renderDuration(note) }));
                console.log('Added note to sheet');
              }
              voice.addTickables(notes);
              voices.push(voice);
            }
          }
          const formatter = new this.VF.Formatter();
          if (voices.length > 0) {
            formatter.joinVoices(voices).format(voices, VEXFLOW_WIDTH);
            for (const voice of voices) {
              voice.draw();
              console.log('Min voice width: ' + formatter.getMinTotalWidth(voice));
            }
          }
        }
      }
    }
  }

  private renderAbc(note: Note): string {
    let abc: string = note.pitch.chroma.value;
    if (!this.parseService.isNote(abc)) {
      abc = VEXFLOW_REST_NOTE;
    } else {
      if (note.pitch.octave != null) {
        abc += VEXFLOW_OCTAVE_SEPARATOR + note.pitch.octave.value;
      }
    }
    return abc;
  }

  private renderDuration(note: Note): string {
    if (!this.parseService.isNote(note.pitch.chroma.value)) {
      return note.renderDuration() + VEXFLOW_REST_SUFFIX;
    } else {
      return note.renderDuration();
    }
  }

  private renderTimeSignature(measure: Measure): string {
    return measure.timeSignature.numerator + VEXFLOW_TIME_SIGNATURE_SEPARATOR + measure.timeSignature.denominator;
  }

  private renderVexflowContext(name: string, width: number, height: number): any {
    const element = document.getElementById(name);
    const renderer = new this.VF.Renderer(element, this.VF.Renderer.Backends.SVG);
    renderer.resize(width, height);
    return renderer.getContext();
  }

  private createSheetAbcjs(name: string, soundtrack: Soundtrack) {
    let strNotes: string = '';
    if (soundtrack.hasTracks()) {
      for (const track of soundtrack.tracks) {
        if (track.hasMeasures()) {
          for (const measure of track.measures) {
            if (measure.hasNotes()) {
              for (const placedNote of measure.placedNotes) {
                if (strNotes.length > 0) {
                  strNotes += ABCJS_NOTE_SEPARATOR;
                }
                if (this.parseService.isNote(placedNote.note.renderAbc())) {
                  strNotes += placedNote.note.renderAbc();
                } else {
                  strNotes += ABCJS_NOTE_REST;
                }
              }
            }
          }
        }
      }
    }

    const sheetAbc = abcjs.renderAbc(name, strNotes, {
      add_classes: true
      // animate: { listener: this.sheetMidiAnimate, target: strNotes[0], qpm: 120 }
     });

    const element = document.getElementById(name);
    abcjs.startAnimation(element, sheetAbc[0], { showCursor: true });

    // const timer = new abcjs.TimingCallbacks(name, {
    //   beatCallback: this.beatCallbackIntercept,
    //   eventCallback: this.eventCallbackIntercept,
    //   lineEndCallback: this.lineEndCallbackIntercept,
    // });
    // timer.start();

    // https://stackoverflow.com/questions/56418769/no-moving-cursor-when-playing-the-abcjs-animation/56473767#56473767
    // const sheetMidi = abcjs.renderMidi(name, strNotes, {
    //   animate: { listener: this.sheetMidiAnimate, target: strNotes[0], qpm: 120 }
    // });
    // abcjs.midi.startPlaying(element);
  }

  private beatCallbackIntercept(note: number) {
    // console.log('Sheet callback beat note: ' + note);
  }

  private eventCallbackIntercept(event: any) {
    // console.log('Sheet callback event: ' + event);
  }

  private lineEndCallbackIntercept(stuff: any) {
    // console.log('Sheet callback line end: ');
    // console.log(stuff);
  }

  private sheetMidiAnimate(abcjsElement, currentEvent, context) {
    console.log(abcjsElement);
    console.log(currentEvent);
    console.log(context);
  }

  private doStuff(abcElem, tuneNumber, classes) {
    console.log('Doing stuff');
    console.log(abcElem);
    console.log(tuneNumber);
    console.log(classes);
  }

}
