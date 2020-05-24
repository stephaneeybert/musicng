import { TempoUnit } from './tempo-unit';
import { NotationConstant, RANDOM_METHOD } from '@app/service/notation.constant ';

export class Settings {

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

  constructor() {
    this.generateTempoBpm = 0;
    this.generateTimeSignatureNumerator = 0;
    this.generateTimeSignatureDenominator = 0;
    this.generateChordDuration = 0;
    this.generateChordDurationUnit = TempoUnit.BPM;
    this.generateNoteOctave = 0;
    this.generateChordWidth = 0;
    this.generateMethod = 0;
    this.generateReverseDissimilarChord = false;
    this.generateNbChords = 0;
    this.generateSymphony = false;
    this.generateDrums = false;
    this.generateBass = false;
    this.animatedStave = false;
    this.showKeyboard = false;
  }

}
