import { Injectable } from '@angular/core';
import { MaterialService } from '@app/core/service/material.service';
import { Clef } from '@app/model/clef';
import { Device } from '@app/model/device';
import { Measure } from '@app/model/measure/measure';
import { Note } from '@app/model/note/note';
import { PlacedChord } from '@app/model/note/placed-chord';
import { Soundtrack } from '@app/model/soundtrack';
import { Track } from '@app/model/track';
import { SettingsService } from '@app/views/settings/settings.service';
import { TranslateService } from '@ngx-translate/core';
import { Accidental, Annotation, AnnotationHorizontalJustify, AnnotationVerticalJustify, BoundingBox, Dot, Flow, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import { CHORD_CHROMAS_SYLLABIC, OCTAVE_SEPARATOR } from './notation.constant ';
import { NotationService } from './notation.service';

const NAME_PREFIX_SOUNDTRACK: string = 'sheet-soundtrack-';
const NAME_PREFIX_DEVICE: string = 'sheet-device-';

const VEXFLOW_SHEET_WIDTH_RATIO: number = 0.9;
const VEXFLOW_STAVE_HEIGHT: number = 140;
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

const VEXFLOW_BOUNDING_BOX_PADDING: number = 5;

export enum VexfloWAccidental {
  sharp = '#',
  flat = 'b',
  o = 'o',
  k = 'k',
  natural = 'n',
  doubleFlat = 'bb',
  doubleSharp = '##'
}

export class Bounding {
  top: number;
  left: number;
  bottom: number;
  right: number;
  trackId: number;
  measureId: number;
  placedChordId: number;
  constructor(top: number, left: number, bottom: number, right: number, trackId: number, measureId: number, placedChordId: number) {
    this.top = top;
    this.left = left;
    this.bottom = bottom;
    this.right = right;
    this.trackId = trackId;
    this.measureId = measureId;
    this.placedChordId = placedChordId;
  }
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
    const formatter: Formatter = new Formatter();
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

                const stave: Stave = this.drawBareStave(measure, soundtrack, displayWidth, staveX, staveY);
                measure.sheetStave = stave;

                this.drawTonalityNameOnStave(measure, track, soundtrack, animatedStave);

                const voice: Voice = this.createBareVoice(measure, stave);

                const staveNotes: Array<StaveNote> = new Array<StaveNote>();
                for (const placedChord of measure.placedChords) {
                  if (!this.notationService.isEndOfTrackPlacedChord(placedChord)) {
                    const staveNote: StaveNote = this.createStaveNoteKeys(placedChord);
                    staveNotes.push(staveNote);
                    // Store the stave note for later access
                    placedChord.staveNote = staveNote;

                    this.addAccidentalOnNotes(placedChord);
                    this.addDotOnNotes(placedChord);
                    this.styleNotes(placedChord);

                    if (showAllNotes) {
                      const noteNames: Array<string> = this.notationService.renderAllChordNoteNamesInSyllabic(placedChord);
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

  public collectBoundingBoxes(soundtrack: Soundtrack): Array<Bounding> {
    const boundings: Array<Bounding> = new Array();
    for (const track of soundtrack.getSortedTracks()) {
      for (const measure of track.getSortedMeasures()) {
        if (measure.placedChords) {
          for (const placedChord of measure.getSortedChords()) {
            if (placedChord.staveNote) {
              const box: BoundingBox = placedChord.staveNote.getBoundingBox();
              const top = this.svgYToBrowser(soundtrack, box.getY() - VEXFLOW_BOUNDING_BOX_PADDING);
              const left = this.svgXToBrowser(soundtrack, box.getX() - VEXFLOW_BOUNDING_BOX_PADDING);
              const bottom = this.svgYToBrowser(soundtrack, box.getY() + box.getH() + VEXFLOW_BOUNDING_BOX_PADDING);
              const right = this.svgXToBrowser(soundtrack, box.getX() + box.getW() + VEXFLOW_BOUNDING_BOX_PADDING);
              if (top && left && right && bottom) {
                boundings.push(new Bounding(top, left, bottom, right, track.index, measure.index, placedChord.index));
              }
            }
          }
        }
      }
    }
    return boundings;
  }

/*
  private screenToSVG(soundtrack: Soundtrack, screenX: number, screenY: number) : SVGPoint | undefined {
    if (soundtrack.sheetContext != null) {
      const svgPoint: SVGPoint = soundtrack.sheetContext.svg.createSVGPoint(screenX, screenY);
      svgPoint.x = screenX;
      svgPoint.y = screenY;
      return svgPoint.matrixTransform(soundtrack.sheetContext.svg.getScreenCTM().inverse());
    }
  }

  private SVGToScreen(svgX, svgY) {
   var p = svg.createSVGPoint()
    p.x = svgX
    p.y = svgY
    return p.matrixTransform(svg.getScreenCTM());
  }
*/

  private svgXToBrowser(soundtrack: Soundtrack, svgX: number): number | undefined {
    if (soundtrack.sheetContext != null) {
      const svgMarginLeft: number = soundtrack.sheetContext.svg.getBoundingClientRect().left;
      return svgMarginLeft + svgX;
    }
  }

  private svgYToBrowser(soundtrack: Soundtrack, svgY: number): number | undefined {
    if (soundtrack.sheetContext != null) {
      const svgMarginTop: number = soundtrack.sheetContext.svg.getBoundingClientRect().top;
      return svgMarginTop + svgY;
    }
  }

  public locateMeasureAndChord(boundings: Array<Bounding>, x: number, y: number): [number, number, number] {
    for (const bounding of boundings) {
      if (bounding.top <= y && y <= bounding.bottom && bounding.left <= x && x <= bounding.right) {
        return [ bounding.trackId, bounding.measureId, bounding.placedChordId ];
      }
    }
    return [-1, -1, -1];
  }

  private createStaveNoteKeys(placedChord: PlacedChord): StaveNote {
    const chordDuration: string = this.renderDuration(placedChord);
    const staveNote: StaveNote = new StaveNote({
      keys: this.renderNotesSortedByPitch(placedChord.notes),
      duration: chordDuration,
      auto_stem: true,
      clef: this.renderClef()
    });
    return staveNote;
  }

  private drawBareStave(measure: Measure, soundtrack: Soundtrack, displayWidth: number, staveX: number, staveY: number): Stave {
    const stave = new Stave(staveX, staveY, displayWidth);
    if (soundtrack.sheetContext != null) {
      stave.setContext(soundtrack.sheetContext);
    }
    if (soundtrack.sheetContext != null) {
      stave.setContext(soundtrack.sheetContext);
    }
    // TODO
    // List the possible Vexflow clef names
    // It looks like a new clef can be set to any chord new StaveNote({ clef: "tenor", keys: ["d/3"], duration: "q" })
    // Add a clef property to the measure or the chord model class
    // Draw the measure clef if the first measure or if the current measure clef differs from the previous measure clef
    // See http://www.vexflow.com/build/docs/clef.html
    stave.addClef(this.renderClef());
    stave.addTimeSignature(this.renderTimeSignature(measure));
    stave.draw();
    return stave;
  }

  private createBareVoice(measure: Measure, stave: Stave): Voice {
    const voice: Voice = new Voice({
      num_beats: measure.timeSignature.numerator,
      beat_value: measure.timeSignature.denominator,
      resolution: Flow.RESOLUTION
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
    // Do not render the tonality name on the melody track
    // as the tonality name is determined from the harmony chords
    if (this.notationService.isHarmonyChord(measure.placedChords[0])) {
      const tonalityChordNames: Array<string> = this.notationService.getTonalityChordNames(measure.placedChords[0].tonality.range, measure.placedChords[0].tonality.firstChroma);
      const tonalityName: string = this.notationService.renderChordNameInSyllabic(tonalityChordNames[0]);
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
          const staveNote: StaveNote = this.styleStaveNote(placedChord, VEXFLOW_NOTE_HIGHLIGHT_COLOR);
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
          const staveNote: StaveNote = this.styleStaveNote(placedChord, VEXFLOW_NOTE_COLOR);
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

  private noCanvasContextError(error: any): void {
    this.logMessageError(this.renderCanvasContextErrorMessage(), error);
    throw new Error(error.message);
  }

  private logMessageError(message: string, error: any): void {
    console.log(message);
    console.log(error.message);
    console.log(error.stack);
    console.trace();
  }

  private styleStaveNote(placedChord: PlacedChord, color: string): StaveNote {
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

  private renderAnnotation(textNote: string): Annotation {
    return (
      new Annotation(textNote))
      .setFont(VEXFLOW_FONT_TYPE, VEXFLOW_FONT_SIZE, VEXFLOW_FONT_WEIGHT)
      .setJustification(AnnotationHorizontalJustify.CENTER_STEM)
      .setVerticalJustification(AnnotationVerticalJustify.BOTTOM);
  }

  private renderNote(note: Note): string {
    let vexflowNote: string = '';
    if (!this.notationService.noteIsNotRest(note)) {
      vexflowNote = VEXFLOW_REST_NOTE;
    } else {
      // The accidental must not be present in the note
      vexflowNote = this.notationService.removeSharpsAndFlats(note.renderChroma());
      if (note.renderOctave() != null) {
        vexflowNote += OCTAVE_SEPARATOR + note.renderOctave();
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
      placedChord.staveNote.addModifier(this.renderAnnotation(noteName), 0);
    }
  }

  private addAllChordNames(placedChord: PlacedChord, noteNames: Array<string>): void {
    if (placedChord.staveNote) {
      for (let i: number = 0; i < noteNames.length; i++) {
        placedChord.staveNote.addModifier(this.renderAnnotation(noteNames[i]), 0);
      }
    }
  }

  private addAccidentalOnNotes(placedChord: PlacedChord): void {
    if (placedChord.staveNote) {
      const staveNote: StaveNote = placedChord.staveNote;
      let index: number = 0;
      placedChord.notes.forEach((note: Note) => {
        if (note.isTripleSharp()) {
          staveNote.addModifier(new Accidental(VEXFLOW_ACCIDENTAL_TRIPLE_SHARP), index);
        } else if (note.isDoubleSharp()) {
          staveNote.addModifier(new Accidental(VEXFLOW_ACCIDENTAL_DOUBLE_SHARP), index);
        } else if (note.isSharp()) {
          staveNote.addModifier(new Accidental(VEXFLOW_ACCIDENTAL_SHARP), index);
        } else if (note.isTripleFlat()) {
          staveNote.addModifier(new Accidental(VEXFLOW_ACCIDENTAL_TRIPLE_FLAT), index);
        } else if (note.isDoubleFlat()) {
          staveNote.addModifier(new Accidental(VEXFLOW_ACCIDENTAL_DOUBLE_FLAT), index);
        } else if (note.isFlat()) {
          staveNote.addModifier(new Accidental(VEXFLOW_ACCIDENTAL_FLAT), index);
        }
        if (note.pitch.accidental) {
          staveNote.addModifier(new Accidental(note.pitch.accidental), index);
        }
        index++;
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
      const staveNote: StaveNote = placedChord.staveNote;
      if (placedChord.dottedAll) {
        let index: number = 0;
        for (const note of placedChord.notes) {
          const dot: Dot = new Dot();
          staveNote.addModifier(dot, index);
          index++;
        }
      } else {
        let index: number = 0;
        for (const note of placedChord.notes) {
          if (note.dotted) {
            const dot: Dot = new Dot();
            staveNote.addModifier(dot, index);
          }
          index++;
        }
      }
    }
  }

  private renderSVGContext(id: string, width: number, height: number): any {
    const domElement: HTMLElement | null = document.getElementById(id);
    const domDivElement: HTMLDivElement = (domElement as HTMLDivElement);
    if (domElement != null) {
      const renderer: Renderer = new Renderer(domDivElement, Renderer.Backends.SVG);
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
