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
    this.generateTempoBpm = NotationConstant.DEFAUT_TEMPO_BPM;
    this.generateTimeSignatureNumerator = NotationConstant.DEFAUT_TIME_SIGNATURE_NUMERATOR;
    this.generateTimeSignatureDenominator = NotationConstant.DEFAUT_TIME_SIGNATURE_DENOMINATOR;
    this.generateChordDuration = NotationConstant.DEFAUT_CHORD_DURATION;
    this.generateChordDurationUnit = TempoUnit.BPM;
    this.generateNoteOctave = NotationConstant.DEFAUT_NOTE_OCTAVE;
    this.generateChordWidth = NotationConstant.DEFAUT_CHORD_WIDTH;
    this.generateMethod = NotationConstant.DEFAUT_RANDOM_METHOD;
    this.generateReverseDissimilarChord = false;
    this.generateNbChords = NotationConstant.DEFAUT_NB_CHORDS;
    this.generateSymphony = true;
    this.generateDrums = false;
    this.generateBass = false;
    this.animatedStave = true;
    this.showKeyboard = false;
  }

}
