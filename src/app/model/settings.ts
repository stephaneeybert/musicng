import { TempoUnit } from './tempo-unit';
import { RANDOM_METHOD, DEFAUT_TEMPO_BPM, DEFAUT_TIME_SIGNATURE_NUMERATOR, DEFAUT_TIME_SIGNATURE_DENOMINATOR, DEFAUT_CHORD_DURATION, DEFAUT_NOTE_OCTAVE, DEFAUT_CHORD_WIDTH, DEFAUT_RANDOM_METHOD, DEFAUT_NB_CHORDS } from '@app/service/notation.constant ';

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
  generateHarmony: boolean;
  generateDrums: boolean;
  generateBass: boolean;
  animatedStave: boolean;
  showKeyboard: boolean;

  constructor() {
    this.generateTempoBpm = DEFAUT_TEMPO_BPM;
    this.generateTimeSignatureNumerator = DEFAUT_TIME_SIGNATURE_NUMERATOR;
    this.generateTimeSignatureDenominator = DEFAUT_TIME_SIGNATURE_DENOMINATOR;
    this.generateChordDuration = DEFAUT_CHORD_DURATION;
    this.generateChordDurationUnit = TempoUnit.BPM;
    this.generateNoteOctave = DEFAUT_NOTE_OCTAVE;
    this.generateChordWidth = DEFAUT_CHORD_WIDTH;
    this.generateMethod = DEFAUT_RANDOM_METHOD;
    this.generateReverseDissimilarChord = false;
    this.generateNbChords = DEFAUT_NB_CHORDS;
    this.generateHarmony = true;
    this.generateDrums = false;
    this.generateBass = false;
    this.animatedStave = true;
    this.showKeyboard = false;
  }

  public set(
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
    generateHarmony: boolean,
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
    this.generateHarmony = generateHarmony;
    this.generateDrums = generateDrums;
    this.generateBass = generateBass;
    this.animatedStave = animatedStave;
    this.showKeyboard = showKeyboard;
  }

}
