import { TempoUnit } from '@app/model/tempo-unit';
import { RANDOM_METHOD } from '@app/service/notation.constant ';

export class SettingsEdition { // TODO Why not use the existing Settings class ?

  generateTempoBpm: number;
  generateTimeSignatureNumerator: number;
  generateTimeSignatureDenominator: number;
  generateChordDuration: number;
  generateChordDurationUnit: TempoUnit;
  generateNoteOctave: number;
  generateChordWidth: number;
  generateMethod: RANDOM_METHOD;
  generateReverseDissimilarChord: boolean;
  generateNbChords: number;
  generateSymphony: boolean;
  generateDrums: boolean;
  generateBass: boolean;
  animatedStave: boolean;
  showKeyboard: boolean;

  constructor(
    generateTempoBpm: number,
    generateTimeSignatureNumerator: number,
    generateTimeSignatureDenominator: number,
    generateChordDuration: number,
    generateChordDurationUnit: TempoUnit,
    generateNoteOctave: number,
    generateChordWidth: number,
    generateMethod: RANDOM_METHOD,
    generateReverseDissimilarChord: boolean,
    generateNbChords: number,
    generateSymphony: boolean,
    generateDrums: boolean,
    generateBass: boolean,
    animatedStave: boolean,
    showKeyboard: boolean
    ) {
    this.generateTempoBpm = generateTempoBpm;
    this.generateTimeSignatureNumerator = generateTimeSignatureNumerator;
    this.generateTimeSignatureDenominator = generateTimeSignatureDenominator;
    this.generateChordDuration = generateChordDuration;
    this.generateChordDurationUnit = generateChordDurationUnit;
    this.generateNoteOctave = generateNoteOctave;
    this.generateChordWidth = generateChordWidth;
    this.generateMethod = generateMethod;
    this.generateReverseDissimilarChord = generateReverseDissimilarChord;
    this.generateNbChords = generateNbChords;
    this.generateSymphony = generateSymphony;
    this.generateDrums = generateDrums;
    this.generateBass = generateBass;
    this.animatedStave = animatedStave;
    this.showKeyboard = showKeyboard;
  }

}
