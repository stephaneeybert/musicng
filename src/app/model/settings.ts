import { TempoUnit } from './tempo-unit';
import { RANDOM_METHOD, DEFAULT_TEMPO_BPM, DEFAULT_TIME_SIGNATURE_NUMERATOR, DEFAULT_TIME_SIGNATURE_DENOMINATOR, DEFAULT_CHORD_DURATION, DEFAULT_NOTE_OCTAVE, DEFAULT_CHORD_WIDTH, DEFAULT_RANDOM_METHOD, DEFAULT_RANDOM_INPASSING, DEFAULT_NB_CHORDS, DEFAULT_VELOCITY_MEDIUM, DEFAULT_VELOCITY_LOUDER } from '@app/service/notation.constant ';

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
  generateInpassingNote: number;
  generateNbChords: number;
  generateDoubleChord: boolean;
  generateMelody: boolean;
  generateHarmony: boolean;
  generateDrums: boolean;
  generateBass: boolean;
  generateVelocityMelody: number;
  generateVelocityHarmony: number;
  generateVelocityDrums: number;
  generateVelocityBass: number;
  animatedStave: boolean;
  showKeyboard: boolean;

  constructor() {
    this.generateTempoBpm = DEFAULT_TEMPO_BPM;
    this.generateTimeSignatureNumerator = DEFAULT_TIME_SIGNATURE_NUMERATOR;
    this.generateTimeSignatureDenominator = DEFAULT_TIME_SIGNATURE_DENOMINATOR;
    this.generateChordDuration = DEFAULT_CHORD_DURATION;
    this.generateChordDurationUnit = TempoUnit.BPM;
    this.generateNoteOctave = DEFAULT_NOTE_OCTAVE;
    this.generateChordWidth = DEFAULT_CHORD_WIDTH;
    this.generateMethod = DEFAULT_RANDOM_METHOD;
    this.generateReverseDissimilarChord = false;
    this.generateInpassingNote = DEFAULT_RANDOM_INPASSING;
    this.generateNbChords = DEFAULT_NB_CHORDS;
    this.generateDoubleChord = false;
    this.generateMelody = true;
    this.generateHarmony = true;
    this.generateDrums = false;
    this.generateBass = false;
    this.generateVelocityMelody = DEFAULT_VELOCITY_LOUDER;
    this.generateVelocityHarmony = DEFAULT_VELOCITY_MEDIUM;
    this.generateVelocityDrums = DEFAULT_VELOCITY_MEDIUM;
    this.generateVelocityBass = DEFAULT_VELOCITY_MEDIUM;
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
    generateInpassingNote: number,
    generateNbChords: number,
    generateDoubleChord: boolean,
    generateMelody: boolean,
    generateHarmony: boolean,
    generateDrums: boolean,
    generateBass: boolean,
    generateVelocityMelody: number,
    generateVelocityHarmony: number,
    generateVelocityDrums: number,
    generateVelocityBass: number,
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
    this.generateInpassingNote = generateInpassingNote;
    this.generateNbChords = generateNbChords;
    this.generateDoubleChord = generateDoubleChord;
    this.generateMelody = generateMelody;
    this.generateHarmony = generateHarmony;
    this.generateDrums = generateDrums;
    this.generateBass = generateBass;
    this.generateVelocityMelody = generateVelocityMelody;
    this.generateVelocityHarmony = generateVelocityHarmony;
    this.generateVelocityDrums = generateVelocityDrums;
    this.generateVelocityBass = generateVelocityBass;
    this.animatedStave = animatedStave;
    this.showKeyboard = showKeyboard;
  }

}
