import { Component, Inject, OnInit } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { Tonality } from '@app/model/note/tonality';
import { OCTAVE_SEPARATOR } from '@app/service/notation.constant';
import { NotationService } from '@app/service/notation.service';
import { CustomOverlayRef } from '@app/service/overlay.service';
import { DATA_TOKEN } from './sheet.component';

@Component({
  templateUrl: './sheet-menu.component.html',
  styleUrls: ['./sheet-menu.component.css']
})
export class SheetMenuComponent implements OnInit {

  inputData!: SheetMenuInput;
  tonalities: Array<Tonality> | undefined;
  harmonyChords: Array<string> | undefined;
  melodyNotes: Array<string> | undefined;
  recreateChord: boolean = false;
  recreateNote: boolean = false;

  constructor(
    private notationService: NotationService,
    private customOverlayRef: CustomOverlayRef,
    @Inject(DATA_TOKEN) public data: string
  ) {
//    console.log('Menu injected data: ' + this.inputData);
  }

  ngOnInit() {
    this.inputData = this.customOverlayRef.getInputData();

    this.tonalities = this.notationService.getAllTonalities();

    if (this.inputData.tonality) {
      const tonality: Tonality = new Tonality(this.inputData.tonality.range, this.inputData.tonality.firstChroma);
      this.harmonyChords = this.notationService.getTonalityChordNames(tonality.range, tonality.firstChroma);
    }

    this.melodyNotes = this.inputData.melodyNotes;
  }

  renderChordNameInSyllabic(chordNameIntl: string): string {
    return this.notationService.renderChordNameInSyllabic(chordNameIntl);
  }

  renderNoteNameInSyllabic(chromaOctave: string): string {
    const [chroma, octave] = this.notationService.noteToChromaOctave(chromaOctave);
    return this.notationService.noteChromaLetterToChromaSyllabic(chroma)
      + ' ' + chroma + OCTAVE_SEPARATOR + octave;
  }

  getTonalityName(tonality: Tonality): string {
    return this.notationService.getTonalityName(tonality.range, tonality.firstChroma);
  }

  renderTonalityName(tonality: Tonality): string {
    return this.notationService.renderTonalityName(tonality);
  }

  handleHarmonyChords(): boolean {
    return this.notationService.isHarmonyTrack(this.inputData.trackIndex)
      && this.inputData.placedChordIndex != undefined;
  }

  handleMelodyNotes(): boolean {
    return this.notationService.isMelodyTrack(this.inputData.trackIndex)
      && this.inputData.melodyNotes != undefined;
  }

  handleTonalities(): boolean {
    return this.notationService.isHarmonyTrack(this.inputData.trackIndex)
      && this.inputData.placedChordIndex != undefined && this.notationService.isFirstMeasureChord(this.inputData.placedChordIndex);
  }

  handleAddMeasure(): boolean {
    return this.notationService.isHarmonyTrack(this.inputData.trackIndex)
      && this.inputData.measureIndex != undefined && this.inputData.placedChordIndex == undefined;
  }

  recreateWithHarmonyChord(event: MatSelectChange): void {
    if (event.value) {
      const sheetMenuResponse: SheetMenuResponse = new SheetMenuResponse(event.value, undefined, undefined, undefined, this.recreateChord, undefined);
      this.customOverlayRef.closeWithData(sheetMenuResponse);
    } else {
      this.customOverlayRef.closeWithoutData();
    }
  }

  recreateWithMelodyNote(event: MatSelectChange): void {
    if (event.value) {
      const [chroma, octave]: [string, number] = this.notationService.noteToChromaOctave(event.value);
      const sheetMenuResponse: SheetMenuResponse = new SheetMenuResponse(undefined, chroma, octave, undefined, this.recreateNote, undefined);
      this.customOverlayRef.closeWithData(sheetMenuResponse);
    } else {
      this.customOverlayRef.closeWithoutData();
    }
  }

  recreateOnTonality(event: MatSelectChange, tonality: Tonality | undefined): void {
    if (tonality) {
      const sheetMenuResponse: SheetMenuResponse = new SheetMenuResponse(undefined, undefined, undefined, tonality, true, undefined);
      this.customOverlayRef.closeWithData(sheetMenuResponse);
    } else {
      this.customOverlayRef.closeWithoutData();
    }
  }

  addMeasure(event: Event): void {
    if (event) {
      const sheetMenuResponse: SheetMenuResponse = new SheetMenuResponse(undefined, undefined, undefined, undefined, false, true);
      this.customOverlayRef.closeWithData(sheetMenuResponse);
    } else {
      this.customOverlayRef.closeWithoutData();
    }
  }
}

export class SheetMenuInput {
  trackIndex: number;
  measureIndex: number;
  placedChordIndex: number | undefined;
  tonality: Tonality | undefined;
  melodyNotes: Array<string> | undefined;

  constructor(trackIndex: number, measureIndex: number, placedChordIndex: number | undefined, tonality: Tonality | undefined, melodyNotes: Array<string> | undefined) {
    this.trackIndex = trackIndex;
    this.measureIndex = measureIndex;
    this.placedChordIndex = placedChordIndex;
    this.tonality = tonality;
    this.melodyNotes = melodyNotes;
  }
}

export class SheetMenuResponse {
  harmonyChordChroma: string | undefined;
  melodyNoteChroma: string | undefined;
  melodyNoteOctave: number | undefined;
  tonality: Tonality | undefined;
  recreate: boolean;
  addMeasure: boolean | undefined;

  constructor(harmonyChordChroma: string | undefined, melodyNoteChroma: string | undefined, melodyNoteOctave: number | undefined, tonality: Tonality | undefined, recreate: boolean, addMeasure: boolean | undefined) {
    this.harmonyChordChroma = harmonyChordChroma;
    this.melodyNoteChroma = melodyNoteChroma;
    this.melodyNoteOctave = melodyNoteOctave;
    this.tonality = tonality;
    this.recreate = recreate;
    this.addMeasure = addMeasure;
  }
}
