import { Injectable } from '@angular/core';
// import abcjs from 'abcjs/midi';
import * as vexflow from 'vexflow';
import * as Tone from 'tone';
import { Soundtrack } from '../../model/soundtrack';
import { Device } from '../../model/device';
import { ParseService } from '../service/parse.service';
import { Note } from '../../model/note/note';
import { Measure } from '../../model/measure/measure';
import { Clef } from '../../model/clef';
import { PlacedChord } from '../../model/note/placed-chord';

const SHEET_WIDTH_RATIO = 0.8;
const VEXFLOW_STAVE_HEIGHT = 50;
const VEXFLOW_STAVE_MARGIN = 25;
const VEXFLOW_OCTAVE_SEPARATOR = '/';
const VEXFLOW_REST_NOTE = 'b/4';
const VEXFLOW_REST_SUFFIX = 'r';
const VEXFLOW_TIME_SIGNATURE_SEPARATOR = '/';
const VEXFLOW_NOTE_COLOR = 'black';
const VEXFLOW_NOTE_HIGHLIGHT_COLOR = 'blue';
const VEXFLOW_FONT_TYPE = 'Arial';
const VEXFLOW_FONT_SIZE = 10;
const VEXFLOW_FONT_WEIGHT = '';
const VEXFLOW_FONT_WEIGHT_BOLD = 'Bold';

const VEXFLOW_DOUBLE_BAR = '||';
const VEXFLOW_REPEAT_BEGIN = '|:';
const VEXFLOW_REPEAT_END = ':|';
const VEXFLOW_DOUBLE_REPEAT = '::';
const VEXFLOW_END_BAR = '|=';

export enum VexfloWAccidental {
  b = 'b',
  o = 'o',
  k = 'k',
  n = 'n',
  bDouble = 'bb',
  hash = '#',
  hashDouble = '##'
}

const ABCJS_CHORD_SEPARATOR = '|';
const ABCJS_NOTE_REST = 'z';

@Injectable({
  providedIn: 'root'
})
export class SheetService {

  constructor(
    private parseService: ParseService
  ) { }

  public createSoundtrackSheet(name: string, screenWidth: number, soundtrack: Soundtrack): void {
    this.vexflowRenderSoundtrack(name, screenWidth, soundtrack);
  }

  public vexflowRenderDevice(name: string, screenWidth: number, device: Device): void {
    // TODO
  }

  private vexflowHeight(soundtrack: Soundtrack): number {
    let nbMeasures: number = 0;
    if (soundtrack.hasTracks()) {
      for (const track of soundtrack.tracks) {
        if (track.hasMeasures()) {
          nbMeasures += track.measures.length;
        }
      }
    }
    return (nbMeasures + 1) * (VEXFLOW_STAVE_HEIGHT + VEXFLOW_STAVE_MARGIN);
  }

  public vexflowHighlightStaveNote(placedChord: PlacedChord): void {
    this.vexflowStyleStaveNote(placedChord, VEXFLOW_NOTE_HIGHLIGHT_COLOR);
  }

  public vexflowUnhighlightStaveNote(placedChord: PlacedChord): void {
    this.vexflowStyleStaveNote(placedChord, VEXFLOW_NOTE_COLOR);
  }

  public vexflowStyleStaveNote(placedChord: PlacedChord, color: string): void {
    if (placedChord.hasNotes()) {
      if (placedChord.staveNote) {
        const staveNote: vexflow.Flow.StaveNote = placedChord.staveNote;
        staveNote.setStyle({
          fillStyle: color,
          strokeStyle: color
        });
        staveNote.draw();
      } else {
        console.warn('The placed chord has no vexflow stave note');
      }
    }
  }

  private addAccidentalOnNotes(placedChord: PlacedChord): void {
    const staveNote: vexflow.Flow.StaveNote = placedChord.staveNote;
      let i: number = 0;
      placedChord.notes.forEach((note: Note) => {
        if (note.pitch.accidental) {
          staveNote.addAccidental(i, new vexflow.Flow.Accidental(note.pitch.accidental));
        }
        i++;
      })
  }

  private addDotOnNotes(placedChord: PlacedChord): void {
    const staveNote: vexflow.Flow.StaveNote = placedChord.staveNote;
    if (placedChord.dottedAll) {
      staveNote.addDotToAll();
    } else {
      let i: number = 0;
      placedChord.notes.forEach((note: Note) => {
        if (note.dotted) {
          staveNote.addDot(i);
        }
        i++;
      })
    }
  }

  private vexflowRenderSoundtrack(name: string, screenWidth: number, soundtrack: Soundtrack): void {
    // The sheet width must fit within the screen
    const sheetWidth = screenWidth * SHEET_WIDTH_RATIO;

    const context = this.renderVexflowContext(name, sheetWidth, this.vexflowHeight(soundtrack));

    const voices: Array<vexflow.Flow.Voice> = new Array<vexflow.Flow.Voice>();
    if (soundtrack.hasTracks()) {
      let staveIndex: number = 0;
      for (const track of soundtrack.tracks) {
        if (track.hasMeasures()) {
          for (const measure of track.measures) {
            if (measure.hasChords()) {
              const stave = new vexflow.Flow.Stave(0, staveIndex * (VEXFLOW_STAVE_HEIGHT + VEXFLOW_STAVE_MARGIN), sheetWidth);
              staveIndex++;
              stave.setContext(context);
              stave.addClef(Clef.TREBLE);
              stave.addTimeSignature(this.renderTimeSignature(measure));
              stave.draw();

              const staveNotes = new Array<vexflow.Flow.StaveNote>();

              const voice: vexflow.Flow.Voice = new vexflow.Flow.Voice({
                num_beats: measure.timeSignature.numerator,
                beat_value: measure.timeSignature.denominator,
                resolution: vexflow.Flow.RESOLUTION
              });
              voice.setStrict(false);
              voice.setStave(stave);
              for (const placedChord of measure.placedChords!) {
                const chordDuration: string = this.renderDuration(placedChord);
                const staveNote: vexflow.Flow.StaveNote = new vexflow.Flow.StaveNote({
                  keys: this.renderNotesSortedByFrequency(placedChord.notes),
                  duration: chordDuration,
                  auto_stem: true,
                  clef: Clef.TREBLE
                });

                // Store the stave note for later access
                placedChord.staveNote = staveNote;

                this.addAccidentalOnNotes(placedChord);
                this.addDotOnNotes(placedChord);

                staveNote.setStyle({
                  fillStyle: VEXFLOW_NOTE_COLOR,
                  strokeStyle: VEXFLOW_NOTE_COLOR
                });

                staveNote.addAnnotation(0, this.renderAnnotation(placedChord.renderAbc()));

                staveNotes.push(staveNote);
              }
              voice.addTickables(staveNotes);
              voices.push(voice);
            }
          }
          const formatter = new vexflow.Flow.Formatter();
          if (voices.length > 0) {
            formatter.joinVoices(voices).format(voices, sheetWidth);
            for (const voice of voices) {
              console.log('Min voice width: ' + formatter.getMinTotalWidth());
              voice.draw(context);
            }
          }
        }
      }
    }
  }

  private getNoteFrequency(note: Note): number {
    // The accidental must not be present in the note when getting the frequency
    return Tone.Frequency(note.renderAbc()).toFrequency();
  }

  private sortNotesByPitch(notes: Array<Note>): Array<Note> {
    return notes.sort((noteA: Note, noteB: Note) => {
      // TODO I'll strip the # accidental from the note if any then, so as to get E4 from E#4 as a note, before getting the frequency. 
      return this.getNoteFrequency(noteA) - this.getNoteFrequency(noteB);
    });
  }

  // The Vexflow API requires that notes be sorted in ascending order before
  // being added as keys to a stave
  private renderNotesSortedByFrequency(notes: Array<Note>): Array<string> {
    const vexflowNotes: Array<string> = new Array<string>();
    this.sortNotesByPitch(notes)
    .forEach((note: Note) => {
      vexflowNotes.push(this.renderNote(note));
    });
    return vexflowNotes;
  }

  private renderAnnotation(textNote: string): vexflow.Flow.Annotation {
    return (
      new vexflow.Flow.Annotation(textNote))
      .setFont(VEXFLOW_FONT_TYPE, VEXFLOW_FONT_SIZE, VEXFLOW_FONT_WEIGHT)
      .setJustification(vexflow.Flow.Annotation.Justify.RIGHT)
      .setVerticalJustification(vexflow.Flow.Annotation.VerticalJustify.CENTER);
  }

  private renderNote(note: Note): string {
    let vexflowNote: string = '';
    if (!this.parseService.noteIsNotRest(note)) {
      vexflowNote = VEXFLOW_REST_NOTE;
    } else {
      vexflowNote = note.renderChroma();
      if (note.renderOctave() != null) {
        vexflowNote += VEXFLOW_OCTAVE_SEPARATOR + note.renderOctave();
      }
    }
    return vexflowNote;
  }

  private renderDuration(placedChord: PlacedChord): string {
    if (!this.parseService.placedChordIsNotRest(placedChord)) {
      return placedChord.renderDuration() + VEXFLOW_REST_SUFFIX;
    } else {
      return placedChord.renderDuration();
    }
  }

  private renderTimeSignature(measure: Measure): string {
    return measure.timeSignature.numerator + VEXFLOW_TIME_SIGNATURE_SEPARATOR + measure.timeSignature.denominator;
  }

  private renderVexflowContext(name: string, width: number, height: number): any {
    const element = document.getElementById(name);
    const renderer = new vexflow.Flow.Renderer(element!, vexflow.Flow.Renderer.Backends.SVG);
    renderer.resize(width, height);
    return renderer.getContext();
  }

  private createSheetAbcjs(name: string, soundtrack: Soundtrack): void {
    let strNotes: string = '';
    if (soundtrack.hasTracks()) {
      for (const track of soundtrack.tracks) {
        if (track.hasMeasures()) {
          for (const measure of track.measures) {
            if (measure.hasChords()) {
              for (const placedChord of measure.placedChords!) {
                if (strNotes.length > 0) {
                  strNotes += ABCJS_CHORD_SEPARATOR;
                }
                placedChord.notes.forEach((note: Note) => {
                  if (this.parseService.noteIsNotRest(note)) {
                    strNotes += note.render();
                  } else {
                    strNotes += ABCJS_NOTE_REST;
                  }
                });
              }
            }
          }
        }
      }
    }

    // const sheetAbc = abcjs.renderAbc(name, strNotes, {
    //   add_classes: true
    //   // animate: { listener: this.sheetMidiAnimate, target: strNotes[0], qpm: 120 }
    //  });

    // const element = document.getElementById(name);
    // abcjs.startAnimation(element, sheetAbc[0], { showCursor: true });

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

  private beatCallbackIntercept(note: number): void {
    // console.log('Sheet callback beat note: ' + note);
  }

  private eventCallbackIntercept(event: any): void {
    // console.log('Sheet callback event: ' + event);
  }

  private lineEndCallbackIntercept(stuff: any): void {
    // console.log('Sheet callback line end: ');
    // console.log(stuff);
  }

  private sheetMidiAnimate(abcjsElement: any, currentEvent: any, context: any): void {
    console.log(abcjsElement);
    console.log(currentEvent);
    console.log(context);
  }

  private doStuff(abcElem: any, tuneNumber: any, classes: any): void {
    console.log('Doing stuff');
    console.log(abcElem);
    console.log(tuneNumber);
    console.log(classes);
  }

}
