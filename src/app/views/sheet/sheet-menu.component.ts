import { Component, Inject, OnInit } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { Tonality } from '@app/model/note/tonality';
import { GeneratorService } from '@app/service/generator.service';
import { NOTE_RANGE } from '@app/service/notation.constant ';
import { NotationService } from '@app/service/notation.service';
import { CustomOverlayRef } from '@app/service/overlay.service';
import { DATA_TOKEN } from './sheet.component';

@Component({
  templateUrl: './sheet-menu.component.html',
  styleUrls: ['./sheet-menu.component.css']
})
export class SheetMenuComponent implements OnInit {

  inputData!: SheetMenuInput;
  tonalityChromas: Array<string> | undefined;
  tonalityChords: Array<string> | undefined;
  crescendo: boolean = true;

  constructor(
    private notationService: NotationService,
    private generatorService: GeneratorService,
    private customOverlayRef: CustomOverlayRef,
    @Inject(DATA_TOKEN) public data: string
  ) {
//    console.log('Menu injected data: ' + this.inputData);
  }

  ngOnInit() {
    this.inputData = this.customOverlayRef.getInputData();

    this.tonalityChromas = this.notationService.getMajorTonalityChromas();
// TODO Remove if no complain of above major range this.tonalityChromas = this.generatorService.getOtherTonalityChromas(this.inputData.trackIndex, this.inputData.measureIndex, this.inputData.placedChordIndex);

    const tonality: Tonality = new Tonality(NOTE_RANGE.MAJOR, this.inputData.tonalityFirstChroma);
    this.tonalityChords = this.notationService.getTonalityChordNames(tonality.range, tonality.firstChroma);
  }

  handleTonalities(): boolean {
    return this.notationService.isHarmonyTrack(this.inputData.trackIndex) && this.notationService.isFirstMeasureChord(this.inputData.placedChordIndex);
  }

  handleHarmonyChords(): boolean {
    return this.notationService.isHarmonyTrack(this.inputData.trackIndex) && !this.notationService.isFirstMeasureChord(this.inputData.placedChordIndex);
  }

  recreateCrescendo(): void {
    const sheetMenuResponse: SheetMenuResponse = new SheetMenuResponse(true, undefined, undefined);
    this.customOverlayRef.closeWithData(sheetMenuResponse);
  }

  recreateDecrescendo(): void {
    const sheetMenuResponse: SheetMenuResponse = new SheetMenuResponse(false, undefined, undefined);
    this.customOverlayRef.closeWithData(sheetMenuResponse);
  }

  recreateWithChord(event: MatSelectChange): void {
    if (event.value) {
      const sheetMenuResponse: SheetMenuResponse = new SheetMenuResponse(this.crescendo, event.value, undefined);
      this.customOverlayRef.closeWithData(sheetMenuResponse);
    } else {
      this.customOverlayRef.closeWithoutData();
    }
  }

  recreateOnTonality(event: MatSelectChange): void {
    if (event.value) {
      const sheetMenuResponse: SheetMenuResponse = new SheetMenuResponse(this.crescendo, undefined, event.value);
      this.customOverlayRef.closeWithData(sheetMenuResponse);
    } else {
      this.customOverlayRef.closeWithoutData();
    }
  }
}

export class SheetMenuInput {
  trackIndex: number;
  measureIndex: number;
  placedChordIndex: number;
  tonalityFirstChroma: string;

  constructor(trackIndex: number, measureIndex: number, placedChordIndex: number, tonalityFirstChroma: string) {
    this.trackIndex = trackIndex;
    this.measureIndex = measureIndex;
    this.placedChordIndex = placedChordIndex;
    this.tonalityFirstChroma = tonalityFirstChroma;
  }
}

export class SheetMenuResponse {
  crescendo: boolean;
  chord: string | undefined;
  tonality: string | undefined;

  constructor(crescendo: boolean, chord: string | undefined, tonality: string | undefined) {
    this.crescendo = crescendo;
    this.chord = chord;
    this.tonality = tonality;
  }
}
