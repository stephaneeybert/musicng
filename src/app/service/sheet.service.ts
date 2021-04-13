import { Injectable } from '@angular/core';
import Vex from 'vexflow';
import { Soundtrack } from '@app/model/soundtrack';
import { Device } from '@app/model/device';
import { NotationService } from './notation.service';
import { Note } from '@app/model/note/note';
import { Measure } from '@app/model/measure/measure';
import { Clef } from '@app/model/clef';
import { PlacedChord } from '@app/model/note/placed-chord';
import { Track } from '@app/model/track';
import { TranslateService } from '@ngx-translate/core';
import { MaterialService } from '@app/core/service/material.service';
import { SettingsService } from '@app/views/settings/settings.service';
import { CHORD_CHROMAS_SYLLABIC } from './notation.constant ';

const NAME_PREFIX_SOUNDTRACK: string = 'sheet-soundtrack-';
const NAME_PREFIX_DEVICE: string = 'sheet-device-';

const VEXFLOW_SHEET_WIDTH_RATIO: number = 0.9;
const VEXFLOW_STAVE_HEIGHT: number = 140;
const VEXFLOW_OCTAVE_SEPARATOR: string = '/';
const VEXFLOW_REST_NOTE: string = 'B/4';
const VEXFLOW_ACCIDENTAL_SHARP: string = '#';
const VEXFLOW_ACCIDENTAL_DOUBLE_SHARP: string = '##';
const VEXFLOW_ACCIDENTAL_TRIPLE_SHARP: string = '###'; // TODO See if Vexflow now supports triples
const VEXFLOW_ACCIDENTAL_FLAT: string = 'b';
const VEXFLOW_ACCIDENTAL_DOUBLE_FLAT: string = 'bb';
const VEXFLOW_ACCIDENTAL_TRIPLE_FLAT: string = 'bbb'; // TODO See if Vexflow now supports triples
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
    private settingsService: SettingsService,
    private materialService: MaterialService
  ) { }

  public createSoundtrackSheet(id: string, screenWidth: number, soundtrack: Soundtrack, animatedStave: boolean): void {
    this.renderSoundtrackSheet(id, screenWidth, soundtrack, animatedStave);
  }

  public createDeviceSheet(id: string, screenWidth: number, device: Device): void {
    // TODO
  }

  private renderSoundtrackSheet(id: string, screenWidth: number, soundtrack: Soundtrack, animatedStave: boolean): void {
    // The width must fit within the screen
    const displayWidth: number = screenWidth * VEXFLOW_SHEET_WIDTH_RATIO;

    let sheetWidth: number;
    let sheetHeight: number;
    sheetWidth = displayWidth;
    // Add one more stave space at the bottom
    sheetHeight = (this.getNbStaves(animatedStave, soundtrack) + 1) * VEXFLOW_STAVE_HEIGHT;

    const showAllNotes: boolean = this.settingsService.getSettings().showAllNotes;

    if (soundtrack.sheetContext != null) {
      this.clearSVGContext(soundtrack);
    }
    soundtrack.sheetContext = this.renderSVGContext(id, sheetWidth, sheetHeight);
    const formatter: Vex.Flow.Formatter = new Vex.Flow.Formatter();
    const nbTracks: number = soundtrack.getNbTracks();
    if (soundtrack.hasTracks()) {
      soundtrack.tracks.forEach((track: Track) => {
        if (track.hasMeasures()) {
          let previousNoteName: string = '';
          let measureWithVisibleNotesIndex: number = 0;
          for (const measure of track.getSortedMeasures()) {
            if (measure.placedChords) {
              if (!this.notationService.isOnlyEndOfTrackChords(measure.placedChords)) {
                const staveX: number = this.getStaveX(animatedStave, track.index, measureWithVisibleNotesIndex);
                const staveY: number = this.getStaveY(animatedStave, nbTracks, track.index, measureWithVisibleNotesIndex);

                this.drawTrackNameOnMeasure(track, soundtrack, staveX, staveY);

                const stave: Vex.Flow.Stave = this.drawBareStave(measure, soundtrack, displayWidth, staveX, staveY);
                measure.sheetStave = stave;

                this.drawTonalityNameOnStave(measure, track, soundtrack, animatedStave);

                const voice: Vex.Flow.Voice = this.createBareVoice(measure, stave);

                const staveNotes: Array<Vex.Flow.StaveNote> = new Array<Vex.Flow.StaveNote>();
                for (const placedChord of measure.placedChords) {
                  if (!this.notationService.isEndOfTrackPlacedChord(placedChord)) {
                    const staveNote: Vex.Flow.StaveNote = this.createStaveNoteKeys(placedChord);
                    staveNotes.push(staveNote);
                    // Store the stave note for later access
                    placedChord.staveNote = staveNote;

                    this.addAccidentalOnNotes(placedChord);
                    this.addDotOnNotes(placedChord);
                    this.styleNotes(placedChord);

                    if (showAllNotes) {
                      const noteNames: Array<string> = this.renderAllChordNoteNamesInSyllabic(placedChord);
                      if (noteNames.length > 0) {
                        this.addAllChordNames(placedChord, noteNames);
                        previousNoteName = noteNames[noteNames.length - 1];
                      }
                    }
                    if (track.displayChordNames) {
                      const noteName: string = this.renderChordNameInSyllabic(placedChord) + ' ' + this.notationService.getChordIntlName(placedChord);
                      if (noteName !== previousNoteName) {
                        this.addChordName(placedChord, noteName);
                        previousNoteName = noteName;
                      }
                    }
                  }
                }

                voice.addTickables(staveNotes);
                formatter.joinVoices([voice]);
                formatter.formatToStave([voice], stave);
                if (soundtrack.sheetContext != null) {
                  voice.draw(soundtrack.sheetContext);
                }
                measure.sheetVoice = voice;

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
        soundtrack.tracks.forEach((track: Track) => {
          if (track.hasMeasures()) {
            const trackFirstMeasure: Measure = track.getSortedMeasures()[0];
            this.whitewashStave(soundtrack.sheetContext, soundtrack.getNbTracks(), track.index, trackFirstMeasure.index);
            this.drawTrackFirstMeasure(track, soundtrack, animatedStave);
            this.drawTrackNameOnFirstMeasure(track, soundtrack, animatedStave);
            this.drawTonalityNameOnStave(track.measures[0], track, soundtrack, animatedStave);
          }
        });
      }
    }
  }

  private createStaveNoteKeys(placedChord: PlacedChord): Vex.Flow.StaveNote {
    const chordDuration: string = this.renderDuration(placedChord);
    const staveNote: Vex.Flow.StaveNote = new Vex.Flow.StaveNote({
      keys: this.renderNotesSortedByPitch(placedChord.notes),
      duration: chordDuration,
      auto_stem: true,
      clef: this.renderClef()
    });
    return staveNote;
  }

  private drawBareStave(measure: Measure, soundtrack: Soundtrack, displayWidth: number, staveX: number, staveY: number): Vex.Flow.Stave {
    const stave = new Vex.Flow.Stave(staveX, staveY, displayWidth);
    if (soundtrack.sheetContext != null) {
      stave.setContext(soundtrack.sheetContext);
    }
    if (soundtrack.sheetContext != null) {
      stave.setContext(soundtrack.sheetContext);
    }
    // TODO
    // List the possible Vexflow clef names
    // It looks like a new clef can be set to any chord new Vex.Flow.StaveNote({ clef: "tenor", keys: ["d/3"], duration: "q" })
    // Add a clef property to the measure or the chord model class
    // Draw the measure clef if the first measure or if the current measure clef differs from the previous measure clef
    // See http://www.vexflow.com/build/docs/clef.html
    stave.addClef(this.renderClef());
    stave.addTimeSignature(this.renderTimeSignature(measure));
    stave.draw();
    return stave;
  }

  private createBareVoice(measure: Measure, stave: Vex.Flow.Stave): Vex.Flow.Voice {
    const voice: Vex.Flow.Voice = new Vex.Flow.Voice({
      num_beats: measure.timeSignature.numerator,
      beat_value: measure.timeSignature.denominator,
      resolution: Vex.Flow.RESOLUTION
    });
    voice.setStrict(false);
    voice.setStave(stave);
    return voice;
  }

  private drawTrackNameOnFirstMeasure(track: Track, soundtrack: Soundtrack, animatedStave: boolean): void {
    const staveX: number = this.getStaveX(animatedStave, track.index, 0);
    const staveY: number = this.getStaveY(animatedStave, soundtrack.tracks.length, track.index, 0);
    this.drawTrackNameOnMeasure(track, soundtrack, staveX, staveY);
  }

  private drawTonalityNameOnStave(measure: Measure, track: Track, soundtrack: Soundtrack, animatedStave: boolean): void {
    if (!measure.placedChords) {
      throw new Error('The tonality name could not be drawn as the measure contained no chords.');
    }
    if (!measure.sheetStave) {
      throw new Error('The tonality name could not be drawn as the measure had no stave.');
    }
    // Dp not render the tonality name on the melody track
    // as the tonality name is determined from the harmony chords
    if (this.notationService.isHarmonyChord(measure.placedChords[0])) {
      const tonalityChordNames: Array<string> = this.notationService.getTonalityChordNames(measure.placedChords[0].tonality.range, measure.placedChords[0].tonality.firstChroma);
      const tonalityName: string = this.notationService.renderTonalityNameInSyllabic(tonalityChordNames[0]);
      const staveX: number = this.getStaveX(animatedStave, track.index, 0);
      const staveY: number = measure.sheetStave.getYForBottomText();
      this.drawText(soundtrack.sheetContext, tonalityName, staveX, staveY);
    }
  }

  private drawTrackNameOnMeasure(track: Track, soundtrack: Soundtrack, staveX: number, staveY: number): void {
    if (track.name != null && soundtrack.sheetContext != null) {
      // Display the name of the track above the stave
      this.drawText(soundtrack.sheetContext, track.name, staveX, staveY);
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

  private drawText(sheetContext: any, text: string, x: number, y: number): void {
    const textHeight = sheetContext.measureText(text).height;
    sheetContext.fillText(text, x, y + textHeight);
  }

  public drawTrackFirstMeasure(track: Track, soundtrack: Soundtrack, animatedStave: boolean): void {
    if (track.hasMeasures()) {
      const sortedMeasures: Array<Measure> = track.getSortedMeasures();
      this.drawMeasure(sortedMeasures[0], track, soundtrack, animatedStave);
    }
  }

  public drawFirstSoundtrackMeasure(soundtrack: Soundtrack, animatedStave: boolean): void {
    if (soundtrack.tracks) {
      soundtrack.getSortedTracks().forEach((track: Track) => {
        if (track.hasMeasures()) {
          const sortedMeasures: Array<Measure> = track.getSortedMeasures();
          this.drawMeasure(sortedMeasures[0], track, soundtrack, animatedStave);
        }
      });
    }
  }

  public drawMeasure(measure: Measure, track: Track, soundtrack: Soundtrack, animatedStave: boolean): void {
    if (soundtrack.sheetContext != null) {
      if (measure.sheetStave) {
        try {
          measure.sheetStave.draw();
        } catch (error) {
          this.noCanvasContextError(error);
        }
        this.drawTrackNameOnFirstMeasure(track, soundtrack, animatedStave);
        this.drawTonalityNameOnStave(measure, track, soundtrack, animatedStave);
      }
      if (measure.sheetVoice) {
        try {
          measure.sheetVoice.draw(soundtrack.sheetContext);
        } catch (error) {
          this.noCanvasContextError(error);
        }
      }
    }
  }

  private getStaveX(animatedStave: boolean, trackIndex: number, measureIndex: number): number {
    const staveX: number = 0;
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
          this.noCanvasContextError(error);
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
          this.noCanvasContextError(error);
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

  private noCanvasContextError(error: Error): void {
    this.logMessageError(this.renderCanvasContextErrorMessage(), error);
    throw new Error(error.message);
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

  private renderChordNameInSyllabic(placedChord: PlacedChord): string {
    const chordNameIntl: string = this.notationService.getChordIntlName(placedChord);
    return this.notationService.chordChromaIntlToChromaSyllabic(CHORD_CHROMAS_SYLLABIC, chordNameIntl);
  }

  private renderAllChordNoteNamesInSyllabic(placedChord: PlacedChord): Array<string> {
    const noteNames: Array<string> = new Array();
    const sortedNotes: Array<Note> = placedChord.getNotesSortedByIndex();
    for (let i: number = 0; i < sortedNotes.length; i++) {
      const reverse: number = placedChord.notes.length - i - 1;
      const note: Note = sortedNotes[reverse];
      const name: string = this.notationService.noteChromaLetterToChromaSyllabic(note.renderChroma())
      + ' ' + note.renderChroma() + VEXFLOW_OCTAVE_SEPARATOR + note.renderOctave();

      noteNames.push(name);
    }
    return noteNames;
  }

  // The Vexflow API requires that notes be sorted in ascending order before
  // being added as keys to a stave
  private renderNotesSortedByPitch(notes: Array<Note>): Array<string> {
    const vexflowNotes: Array<string> = new Array<string>();
    this.notationService.sortNotesByFrequency(notes)
      .forEach((note: Note) => {
        vexflowNotes.push(this.renderNote(note));
      });
    return vexflowNotes;
  }

  private renderNotesSortedByIndex(notes: Array<Note>): Array<string> {
    const vexflowNotes: Array<string> = new Array<string>();
    this.notationService.sortNotesByIndex(notes)
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
      // The accidental must not be present in the note
      vexflowNote = this.notationService.removeSharpsAndFlats(note.renderChroma());
      if (note.renderOctave() != null) {
        vexflowNote += VEXFLOW_OCTAVE_SEPARATOR + note.renderOctave();
      }
    }
    return vexflowNote;
  }

  private renderDuration(placedChord: PlacedChord): string {
    if (!this.notationService.placedChordIsNotRest(placedChord)) {
      return placedChord.getDuration() + VEXFLOW_REST_SUFFIX;
    } else {
      return placedChord.renderDuration();
    }
  }

  private renderClef(): string {
    return Clef.TREBLE; // TODO Why is it hard coded ? Where to specify the tonality ? Okay pour tracks harmoy and melody but cle de FA pour les basses
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
                  nbStaves++;
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

  private addChordName(placedChord: PlacedChord, noteName: string): void {
    if (placedChord.staveNote) {
      placedChord.staveNote.addAnnotation(0, this.renderAnnotation(noteName));
    }
  }

  private addAllChordNames(placedChord: PlacedChord, noteNames: Array<string>): void {
    if (placedChord.staveNote) {
      for (let i: number = 0; i < noteNames.length; i++) {
        placedChord.staveNote.addAnnotation(0, this.renderAnnotation(noteNames[i]));
      }
    }
  }

  private addAccidentalOnNotes(placedChord: PlacedChord): void {
    if (placedChord.staveNote) {
      const staveNote: Vex.Flow.StaveNote = placedChord.staveNote;
      let i: number = 0;
      placedChord.notes.forEach((note: Note) => {
        if (note.isTripleSharp()) {
          // TODO See if Vexflow now supports triples
          staveNote.addAccidental(i, new Vex.Flow.Accidental(VEXFLOW_ACCIDENTAL_DOUBLE_SHARP));
          staveNote.addAccidental(i, new Vex.Flow.Accidental(VEXFLOW_ACCIDENTAL_SHARP));
        } else if (note.isDoubleSharp()) {
          staveNote.addAccidental(i, new Vex.Flow.Accidental(VEXFLOW_ACCIDENTAL_DOUBLE_SHARP));
        } else if (note.isSharp()) {
          staveNote.addAccidental(i, new Vex.Flow.Accidental(VEXFLOW_ACCIDENTAL_SHARP));
        } else if (note.isTripleFlat()) {
          // TODO See if Vexflow now supports triples
          staveNote.addAccidental(i, new Vex.Flow.Accidental(VEXFLOW_ACCIDENTAL_DOUBLE_FLAT));
          staveNote.addAccidental(i, new Vex.Flow.Accidental(VEXFLOW_ACCIDENTAL_FLAT));
        } else if (note.isDoubleFlat()) {
          staveNote.addAccidental(i, new Vex.Flow.Accidental(VEXFLOW_ACCIDENTAL_DOUBLE_FLAT));
        } else if (note.isFlat()) {
          staveNote.addAccidental(i, new Vex.Flow.Accidental(VEXFLOW_ACCIDENTAL_FLAT));
        }
        if (note.pitch.accidental) {
          staveNote.addAccidental(i, new Vex.Flow.Accidental(note.pitch.accidental));
        }
        i++;
      })
    }
  }

  private styleNotes(placedChord: PlacedChord): void {
    if (placedChord.staveNote) {
      placedChord.staveNote.setStyle({
        fillStyle: VEXFLOW_NOTE_COLOR,
        strokeStyle: VEXFLOW_NOTE_COLOR
      });
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

  private renderSVGContext(id: string, width: number, height: number): any {
    const domElement: HTMLElement | null = document.getElementById(id);
    if (domElement != null) {
      const renderer: Vex.Flow.Renderer = new Vex.Flow.Renderer(domElement, Vex.Flow.Renderer.Backends.SVG);
      renderer.resize(width, height);
      const sheetContext: any = renderer.getContext();
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
