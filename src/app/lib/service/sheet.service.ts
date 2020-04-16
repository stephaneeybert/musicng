import { Injectable } from '@angular/core';
import * as vexflow from 'vexflow';
import * as Tone from 'tone';
import { Soundtrack } from '../../model/soundtrack';
import { Device } from '../../model/device';
import { NotationService } from './notation.service';
import { Note } from '../../model/note/note';
import { Measure } from '../../model/measure/measure';
import { Clef } from '../../model/clef';
import { PlacedChord } from '../../model/note/placed-chord';

const SHEET_WIDTH_RATIO = 0.8;
const VEXFLOW_STAVE_HEIGHT = 50;
const VEXFLOW_STAVE_MARGIN = 30;
const VEXFLOW_OCTAVE_SEPARATOR = '/';
const VEXFLOW_REST_NOTE = 'B/4';
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
  sharp = '#',
  flat = 'b',
  o = 'o',
  k = 'k',
  natural = 'n',
  doubleFlat = 'bb',
  doubleSharp = '##'
}

@Injectable({
  providedIn: 'root'
})
export class SheetService {

  constructor(
    private notationService: NotationService
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
          for (const measure of track.measures) {
            if (measure.placedChords) {
              if (!this.notationService.isOnlyEndOfTrackChords(measure.placedChords)) {
                nbMeasures++;;
              }
            } else {
              throw new Error('The measure placed chords array has not been instantiated.');
            }
          }
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
        throw new Error('The placed chord has no vexflow stave note');
      }
    }
  }

  private addAccidentalOnNotes(placedChord: PlacedChord): void {
    if (placedChord.staveNote) {
      const staveNote: vexflow.Flow.StaveNote = placedChord.staveNote;
      let i: number = 0;
      placedChord.notes.forEach((note: Note) => {
        if (note.pitch.accidental) {
          staveNote.addAccidental(i, new vexflow.Flow.Accidental(note.pitch.accidental));
        }
        i++;
      })
    }
  }

  private addDotOnNotes(placedChord: PlacedChord): void {
    if (placedChord.staveNote) {
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
  }

  private vexflowRenderSoundtrack(name: string, screenWidth: number, soundtrack: Soundtrack): void {
    // The sheet width must fit within the screen
    const sheetWidth = screenWidth * SHEET_WIDTH_RATIO;
    let previousNoteName: string = '';

    const context = this.renderVexflowContext(name, sheetWidth, this.vexflowHeight(soundtrack));
    const formatter = new vexflow.Flow.Formatter();
    const voices: Array<vexflow.Flow.Voice> = new Array<vexflow.Flow.Voice>();
    if (soundtrack.hasTracks()) {
      let staveIndex: number = 0;
      for (const track of soundtrack.tracks) {
        if (track.hasMeasures()) {
          for (const measure of track.measures) {
            if (measure.placedChords) {
              if (!this.notationService.isOnlyEndOfTrackChords(measure.placedChords)) {
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
                for (const placedChord of measure.placedChords) {
                  if (!this.notationService.isEndOfTrackPlacedChord(placedChord)) {
                    const chordDuration: string = this.renderDuration(placedChord);
                    const staveNote: vexflow.Flow.StaveNote = new vexflow.Flow.StaveNote({
                      keys: this.renderNotesSortedByFrequency(placedChord.notes),
                      duration: chordDuration,
                      auto_stem: true,
                      clef: Clef.TREBLE
                    });

                    this.addAccidentalOnNotes(placedChord);
                    this.addDotOnNotes(placedChord);

                    staveNote.setStyle({
                      fillStyle: VEXFLOW_NOTE_COLOR,
                      strokeStyle: VEXFLOW_NOTE_COLOR
                    });

                    const noteName: string = this.renderChordNoteInSyllabic(placedChord);
                    if (noteName !== previousNoteName) {
                      staveNote.addAnnotation(0, this.renderAnnotation(noteName));
                      previousNoteName = noteName;
                    }

                    // Store the stave note for later access
                    placedChord.staveNote = staveNote;

                    staveNotes.push(staveNote);
                  }
                }
                voice.addTickables(staveNotes);
                formatter.joinVoices([voice]);
                formatter.formatToStave([voice], stave);
                voice.draw(context);
                voices.push(voice);
              }
            } else {
              throw new Error('The measure placed chords array has not been instantiated.');
            }
          }
        }
      }
    }
  }

  private renderChordNoteInSyllabic(placedChord: PlacedChord): string {
    return this.notationService.chromaLetterToChromaSyllabic(placedChord.renderFirstNoteChroma());
  }

  private getNoteFrequency(note: Note): number {
    // The accidental must not be present in the note when getting the frequency
    return Tone.Frequency(note.renderAbc()).toFrequency();
  }

  private sortNotesByPitch(notes: Array<Note>): Array<Note> {
    return notes.sort((noteA: Note, noteB: Note) => {
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
      .setJustification(vexflow.Flow.Annotation.Justify.CENTER_STEM)
      .setVerticalJustification(vexflow.Flow.Annotation.VerticalJustify.BOTTOM);
  }

  private renderNote(note: Note): string {
    let vexflowNote: string = '';
    if (!this.notationService.noteIsNotRest(note)) {
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
    if (!this.notationService.placedChordIsNotRest(placedChord)) {
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

}
