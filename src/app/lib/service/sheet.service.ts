import { Injectable } from '@angular/core';
import Vex from 'vexflow';
import * as Tone from 'tone';
import { Soundtrack } from '@app/model/soundtrack';
import { Device } from '@app/model/device';
import { NotationService } from './notation.service';
import { Note } from '@app/model/note/note';
import { Measure } from '@app/model/measure/measure';
import { Clef } from '@app/model/clef';
import { PlacedChord } from '@app/model/note/placed-chord';
import { Track } from '@app/model/track';
import { TranslateService } from '@ngx-translate/core';
import { ScreenDeviceService } from 'lib-core';
import { MaterialService } from '@app/core/service/material.service';

const NAME_PREFIX_SOUNDTRACK: string = 'sheet-soundtrack-';
const NAME_PREFIX_DEVICE: string = 'sheet-device-';

const SHEET_WIDTH_RATIO: number = 0.9;
const VEXFLOW_STAVE_HEIGHT: number = 120;
const VEXFLOW_OCTAVE_SEPARATOR: string = '/';
const VEXFLOW_REST_NOTE: string = 'B/4';
const VEXFLOW_REST_SUFFIX: string = 'r';
const VEXFLOW_TIME_SIGNATURE_SEPARATOR: string = '/';
const VEXFLOW_NOTE_COLOR: string = 'black';
const VEXFLOW_STAVE_BACKGROUND_COLOR: string = 'white';
const VEXFLOW_NOTE_HIGHLIGHT_COLOR: string = 'olivedrab';
const VEXFLOW_FONT_TYPE: string = 'Arial';
const VEXFLOW_FONT_SIZE: number = 10;
const VEXFLOW_FONT_WEIGHT: string = '';
const VEXFLOW_FONT_WEIGHT_BOLD: string = 'Bold';
const VEXFLOW_SVG_OPACITY_TO_SHOW: string = '100';
const VEXFLOW_SVG_OPACITY_TO_HIDE: string = '0';

const VEXFLOW_DOUBLE_BAR: string = '||';
const VEXFLOW_REPEAT_BEGIN: string = '|:';
const VEXFLOW_REPEAT_END: string = ':|';
const VEXFLOW_DOUBLE_REPEAT: string = '::';
const VEXFLOW_END_BAR: string = '|=';

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
    private notationService: NotationService,
    private translateService: TranslateService,
    private screenDeviceService: ScreenDeviceService,
    private materialService: MaterialService
  ) { }

  public createSoundtrackSheet(id: string, animatedStave: boolean, screenWidth: number, soundtrack: Soundtrack): void {
    this.renderSoundtrackSheet(id, animatedStave, screenWidth, soundtrack);
  }

  public createDeviceSheet(id: string, screenWidth: number, device: Device): void {
    // TODO
  }

  private renderSoundtrackSheet(id: string, animatedStave: boolean, screenWidth: number, soundtrack: Soundtrack): void {
    // The width must fit within the screen
    const displayWidth: number = screenWidth * SHEET_WIDTH_RATIO;
    let previousNoteName: string = '';

    let sheetWidth: number;
    let sheetHeight: number;
    sheetWidth = displayWidth;
    sheetHeight = this.getNbStaves(animatedStave, soundtrack) * VEXFLOW_STAVE_HEIGHT;

    if (soundtrack.sheetContext != null) {
      this.clearSVGContext(soundtrack);
    }
    soundtrack.sheetContext = this.renderSVGContext(id, sheetWidth, sheetHeight);
    const formatter: Vex.Flow.Formatter = new Vex.Flow.Formatter();
    const voices: Array<Vex.Flow.Voice> = new Array<Vex.Flow.Voice>();
    const nbTracks: number = soundtrack.getNbTracks();
    if (soundtrack.hasTracks()) {
      soundtrack.tracks.forEach((track: Track) => {
        if (track.hasMeasures()) {
          let measureWithVisibleNotesIndex: number = 0;
          for (const measure of track.getSortedMeasures()) {
            if (measure.placedChords) {
              if (!this.notationService.isOnlyEndOfTrackChords(measure.placedChords)) {
                const stave = new Vex.Flow.Stave(this.getStaveX(animatedStave, track.index, measureWithVisibleNotesIndex), this.getStaveY(animatedStave, nbTracks, track.index, measureWithVisibleNotesIndex), displayWidth);
                if (soundtrack.sheetContext != null) {
                  stave.setContext(soundtrack.sheetContext);
                }
                stave.addClef(Clef.TREBLE); // TODO Should the clef be determined from the time signature of the measure ?
                stave.addTimeSignature(this.renderTimeSignature(measure));
                if (!animatedStave) {
                  stave.draw();
                }
                measure.sheetStave = stave;

                const staveNotes: Array<Vex.Flow.StaveNote> = new Array<Vex.Flow.StaveNote>();

                const voice: Vex.Flow.Voice = new Vex.Flow.Voice({
                  num_beats: measure.timeSignature.numerator,
                  beat_value: measure.timeSignature.denominator,
                  resolution: Vex.Flow.RESOLUTION
                });
                voice.setStrict(false);
                voice.setStave(stave);
                for (const placedChord of measure.placedChords) {
                  if (!this.notationService.isEndOfTrackPlacedChord(placedChord)) {
                    const chordDuration: string = this.renderDuration(placedChord);
                    const staveNote: Vex.Flow.StaveNote = new Vex.Flow.StaveNote({
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

                    if (track.displayChordNames) {
                      const noteName: string = this.renderChordNoteInSyllabic(placedChord);
                      if (noteName !== previousNoteName) {
                        staveNote.addAnnotation(0, this.renderAnnotation(noteName));
                        previousNoteName = noteName;
                      }
                    }

                    // Store the stave note for later access
                    placedChord.staveNote = staveNote;

                    staveNotes.push(staveNote);
                  }
                }

                voice.addTickables(staveNotes);
                formatter.joinVoices([voice]);
                formatter.formatToStave([voice], stave);
                if (soundtrack.sheetContext != null) {
                  voice.draw(soundtrack.sheetContext);
                }
                measure.sheetVoice = voice;
                voices.push(voice);
                measureWithVisibleNotesIndex++;
              }
            } else {
              throw new Error('The measure placed chords array has not been instantiated.');
            }
          }
        }
      });
      if (animatedStave) {
        this.whitewashSheetContext(soundtrack.sheetContext);
        this.drawFirstMeasure(soundtrack);
      }
    }
  }

  public clearSVGContext(soundtrack: Soundtrack): void {
    if (soundtrack.sheetContext != null) {
      soundtrack.sheetContext.clear();
      soundtrack.sheetContext = undefined;
      this.removeSheetDomElement(soundtrack);
    }
  }

  private removeSheetDomElement(soundtrack: Soundtrack): void {
    const sheetElement = document.getElementById(this.buildSoundtrackSheetId(soundtrack));
    if (sheetElement != null) {
      while (sheetElement.hasChildNodes()) {
        if (sheetElement.lastChild != null) {
          const childNode: Node = sheetElement.lastChild;
          sheetElement.removeChild(childNode);
        }
      }
    }
  }

  private resizeSVGContext(soundtrack: Soundtrack, width: number, height: number): void {
    if (soundtrack.sheetContext != null) {
      soundtrack.sheetContext.resize(width, height);
    }
  }

  public drawFirstMeasure(soundtrack: Soundtrack): void {
    if (soundtrack.tracks) {
      soundtrack.getSortedTracks().forEach((track: Track) => {
        if (track.hasMeasures()) {
          const sortedMeasures: Array<Measure> = track.getSortedMeasures();
          this.drawMeasure(sortedMeasures[0], soundtrack.sheetContext);
        }
      });
    }
  }

  public drawMeasure(measure: Measure, sheetContext: any): void {
    if (measure.sheetStave && sheetContext != null) {
      try {
        measure.sheetStave.draw();
      } catch (error) {
        this.logNoCanvasContextError(error);
        this.screenDeviceService.reloadPage();
      }
    }
    if (measure.sheetVoice && sheetContext != null) {
      try {
        measure.sheetVoice.draw(sheetContext);
      } catch (error) {
        this.logNoCanvasContextError(error);
        this.screenDeviceService.reloadPage();
      }
    }
  }

  private getStaveX(animatedStave: boolean, trackIndex: number, measureIndex: number): number {
    let staveX: number;
    if (animatedStave) {
      staveX = 0;
    } else {
      staveX = 0;
    }
    return staveX;
  }

  private getStaveY(animatedStave: boolean, nbTracks: number, trackIndex: number, measureIndex: number): number {
    let staveY: number;
    if (animatedStave) {
      staveY = trackIndex * VEXFLOW_STAVE_HEIGHT;
    } else {
      staveY = (trackIndex + (nbTracks * measureIndex)) * VEXFLOW_STAVE_HEIGHT;
    }
    return staveY;
  }

  public whitewashStave(sheetContext: any, nbTracks: number, trackIndex: number, measureIndex: number): void {
    if (sheetContext != null) {
      this.whitewash(sheetContext, this.getStaveX(true, trackIndex, measureIndex), this.getStaveY(true, nbTracks, trackIndex, measureIndex), sheetContext.width, VEXFLOW_STAVE_HEIGHT);
    }
  }

  public whitewashSheetContext(sheetContext: any): void {
    if (sheetContext != null) {
      this.whitewash(sheetContext, 0, 0, sheetContext.width, sheetContext.height);
    }
  }

  private whitewash(sheetContext: any, x: number, y: number, width: number, height: number): void {
    sheetContext.save();
    sheetContext.setFillStyle(VEXFLOW_STAVE_BACKGROUND_COLOR);
    sheetContext.setLineWidth(0);
    sheetContext.fillRect(x, y, width, height);
    sheetContext.restore();
  }

  public unhighlightAllStaveChords(soundtrack: Soundtrack): void {
    soundtrack.tracks.forEach((track: Track) => {
      track.getSortedMeasures().forEach((measure: Measure) => {
        measure.getSortedChords().forEach((placedChord: PlacedChord) => {
          this.unhighlightStaveNote(placedChord, soundtrack);
        });
      });
    });
  }

  public highlightStaveNote(placedChord: PlacedChord, soundtrack: Soundtrack): void {
    if (soundtrack.sheetContext != null) {
      if (soundtrack.nowPlaying) {
        try {
          const staveNote: Vex.Flow.StaveNote = this.styleStaveNote(placedChord, VEXFLOW_NOTE_HIGHLIGHT_COLOR);
          staveNote.draw();
        } catch (error) {
          this.logNoCanvasContextError(error);
          this.screenDeviceService.reloadPage();
        }
      }
    }
  }

  public unhighlightStaveNote(placedChord: PlacedChord, soundtrack: Soundtrack): void {
    if (soundtrack.sheetContext != null) {
      if (soundtrack.nowPlaying) {
        try {
          const staveNote: Vex.Flow.StaveNote = this.styleStaveNote(placedChord, VEXFLOW_NOTE_COLOR);
          staveNote.draw();
        } catch (error) {
          this.logNoCanvasContextError(error);
          this.screenDeviceService.reloadPage();
        }
      }
    }
  }

  private showCanvasContextErrorMessage(): void {
    this.materialService.showSnackBar(this.renderCanvasContextErrorMessage());
  }

  private renderCanvasContextErrorMessage(): string {
    return this.translateService.instant('sheet.error.noSheetDrawing')
    + ' ' + this.translateService.instant('message.error.reloadApp');
  }

  private logNoCanvasContextError(error: Error): void {
    this.logMessageError(this.renderCanvasContextErrorMessage(), error);
  }

  private logMessageError(message: string, error: Error): void {
    console.log(message);
    console.log(error.message);
    console.log(error.stack);
    console.trace();
  }

  private styleStaveNote(placedChord: PlacedChord, color: string): Vex.Flow.StaveNote {
    if (placedChord.staveNote != null) {
      placedChord.staveNote.setStyle({
        fillStyle: color,
        strokeStyle: color
      });
      return placedChord.staveNote;
    } else {
      throw new Error('The placed chord has no vexflow stave note when styling');
    }
  }

  private renderChordNoteInSyllabic(placedChord: PlacedChord): string {
    return this.notationService.chromaLetterToChromaSyllabic(placedChord.renderFirstNoteChroma());
  }

  private getNoteFrequency(note: Note): number {
    // The accidental must not be present in the note when getting the frequency
    return Tone.Frequency(note.renderAbc()).toFrequency(); // TODO Move to synth service
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

  private renderAnnotation(textNote: string): Vex.Flow.Annotation {
    return (
      new Vex.Flow.Annotation(textNote))
      .setFont(VEXFLOW_FONT_TYPE, VEXFLOW_FONT_SIZE, VEXFLOW_FONT_WEIGHT)
      .setJustification(Vex.Flow.Annotation.Justify.CENTER_STEM)
      .setVerticalJustification(Vex.Flow.Annotation.VerticalJustify.BOTTOM);
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

  private getNbStaves(animatedStave: boolean, soundtrack: Soundtrack): number {
    let nbStaves: number = 0;
    if (animatedStave) {
      nbStaves = soundtrack.tracks ? soundtrack.tracks.length : 0;
    } else {
      if (soundtrack.hasTracks()) {
        soundtrack.tracks.forEach((track: Track) => {
          if (track.hasMeasures()) {
            track.measures.forEach((measure: Measure) => {
              if (measure.placedChords) {
                if (!this.notationService.isOnlyEndOfTrackChords(measure.placedChords)) {
                  nbStaves++;;
                }
              } else {
                throw new Error('The measure placed chords array has not been instantiated.');
              }
            });
          }
        });
      }
    }
    return nbStaves;
  }

  private addAccidentalOnNotes(placedChord: PlacedChord): void {
    if (placedChord.staveNote) {
      const staveNote: Vex.Flow.StaveNote = placedChord.staveNote;
      let i: number = 0;
      placedChord.notes.forEach((note: Note) => {
        if (note.pitch.accidental) {
          staveNote.addAccidental(i, new Vex.Flow.Accidental(note.pitch.accidental));
        }
        i++;
      })
    }
  }

  private addDotOnNotes(placedChord: PlacedChord): void {
    if (placedChord.staveNote) {
      const staveNote: Vex.Flow.StaveNote = placedChord.staveNote;
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

  private renderSVGContext(id: string, width: number, height: number): any { // TODO Replace all these any types
    const domElement: HTMLElement | null = document.getElementById(id);
    if (domElement != null) {
      const renderer: Vex.Flow.Renderer = new Vex.Flow.Renderer(domElement, Vex.Flow.Renderer.Backends.SVG);
      renderer.resize(width, height);
      const sheetContext: any = renderer.getContext();
      // sheetContext.setFont('Arial', 10, 0).setBackgroundFillStyle('#eed'); // TODO Hard coded font
      return sheetContext;
    } else {
      throw new Error('The sheet context could not be created');
    }
  }

  public buildSoundtrackSheetId(soundtrack: Soundtrack): string {
    return NAME_PREFIX_SOUNDTRACK + soundtrack.id;
  }

  public buildDeviceSheetId(device: Device): string {
    return NAME_PREFIX_DEVICE + device.id;
  }

}
