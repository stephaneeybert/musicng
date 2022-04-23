import { TempoUnit, TempoUnitType } from './tempo-unit';
import { DEFAULT_TEMPO_BPM, DEFAULT_TIME_SIGNATURE_NUMERATOR, DEFAULT_TIME_SIGNATURE_DENOMINATOR, DEFAULT_CHORD_DURATION, DEFAULT_NOTE_OCTAVE, DEFAULT_CHORD_WIDTH, DEFAULT_RANDOM_INPASSING, DEFAULT_NB_CHORDS, DEFAULT_VELOCITY_MEDIUM, DEFAULT_VELOCITY_LOUD, DEFAULT_RANDOM_MODULATION, DEFAULT_VELOCITY_SOFT, NOTE_CHROMA_C, DEFAULT_BONUS_MIN, DEFAULT_BONUS_RANDOM, DEFAULT_NB_SEMI_TONES_AS_NEAR_NOTES, DEFAULT_NB_SEMI_TONES_AS_INPASSING_NOTES } from '@app/service/notation.constant';

export class Settings {

  generateTempoBpm: number;
  generateTimeSignatureNumerator: number;
  generateTimeSignatureDenominator: number;
  generateChordDuration: number;
  generateChordDurationUnit: TempoUnitType;
  generateNoteOctave: number;
  generateChordWidth: number;
  generateReverseDissimilarChord: boolean;
  generateInpassingNote: number;
  generateNbSemiTonesAsInpassingNotes: number;
  generateNbSemiTonesAsNearNotes: number;
  generateTonality: string;
  generateOnlyMajorTonalities: boolean;
  generateModulation: number;
  generateNbChords: number;
  generateDoubleChord: boolean;
  generateBonusMin: number;
  generateBonusRandom: number;
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
  showAllNotes: boolean;
  allowDarkTheme: boolean;

  constructor() {
    this.generateTempoBpm = DEFAULT_TEMPO_BPM;
    this.generateTimeSignatureNumerator = DEFAULT_TIME_SIGNATURE_NUMERATOR;
    this.generateTimeSignatureDenominator = DEFAULT_TIME_SIGNATURE_DENOMINATOR;
    this.generateChordDuration = DEFAULT_CHORD_DURATION;
    this.generateChordDurationUnit = TempoUnit.NOTE;
    this.generateNoteOctave = DEFAULT_NOTE_OCTAVE;
    this.generateChordWidth = DEFAULT_CHORD_WIDTH;
    this.generateReverseDissimilarChord = false;
    this.generateInpassingNote = DEFAULT_RANDOM_INPASSING;
    this.generateNbSemiTonesAsInpassingNotes = DEFAULT_NB_SEMI_TONES_AS_INPASSING_NOTES;
    this.generateNbSemiTonesAsNearNotes = DEFAULT_NB_SEMI_TONES_AS_NEAR_NOTES;
    this.generateTonality = NOTE_CHROMA_C;
    this.generateOnlyMajorTonalities = false;
    this.generateModulation = DEFAULT_RANDOM_MODULATION;
    this.generateNbChords = DEFAULT_NB_CHORDS;
    this.generateDoubleChord = false;
    this.generateBonusMin = DEFAULT_BONUS_MIN;
    this.generateBonusRandom = DEFAULT_BONUS_RANDOM;
    this.generateMelody = true;
    this.generateHarmony = true;
    this.generateDrums = false;
    this.generateBass = false;
    this.generateVelocityMelody = DEFAULT_VELOCITY_LOUD;
    this.generateVelocityHarmony = DEFAULT_VELOCITY_SOFT;
    this.generateVelocityDrums = DEFAULT_VELOCITY_MEDIUM;
    this.generateVelocityBass = DEFAULT_VELOCITY_MEDIUM;
    this.animatedStave = false;
    this.showKeyboard = false;
    this.showAllNotes = false;
    this.allowDarkTheme = false;
  }

  public set(
    generateTempoBpm: number,
    generateTimeSignatureNumerator: number,
    generateTimeSignatureDenominator: number,
    generateChordDuration: number,
    generateChordDurationUnit: TempoUnitType,
    generateNoteOctave: number,
    generateChordWidth: number,
    generateReverseDissimilarChord: boolean,
    generateInpassingNote: number,
    generateNbSemiTonesAsInpassingNotes: number,
    generateNbSemiTonesAsNearNotes: number,
    generateTonality: string,
    generateOnlyMajorTonalities: boolean,
    generateModulation: number,
    generateNbChords: number,
    generateDoubleChord: boolean,
    generateBonusMin: number,
    generateBonusRandom: number,
    generateMelody: boolean,
    generateHarmony: boolean,
    generateDrums: boolean,
    generateBass: boolean,
    generateVelocityMelody: number,
    generateVelocityHarmony: number,
    generateVelocityDrums: number,
    generateVelocityBass: number,
    animatedStave: boolean,
    showKeyboard: boolean,
    showAllNotes: boolean,
    allowDarkTheme: boolean
    ) {
    this.generateTempoBpm = generateTempoBpm;
    this.generateTimeSignatureNumerator = generateTimeSignatureNumerator;
    this.generateTimeSignatureDenominator = generateTimeSignatureDenominator;
    this.generateChordDuration = generateChordDuration;
    this.generateChordDurationUnit = generateChordDurationUnit;
    this.generateNoteOctave = generateNoteOctave;
    this.generateChordWidth = generateChordWidth;
    this.generateReverseDissimilarChord = generateReverseDissimilarChord;
    this.generateInpassingNote = generateInpassingNote;
    this.generateNbSemiTonesAsInpassingNotes = generateNbSemiTonesAsInpassingNotes;
    this.generateNbSemiTonesAsNearNotes = generateNbSemiTonesAsNearNotes;
    this.generateTonality = generateTonality;
    this.generateOnlyMajorTonalities = generateOnlyMajorTonalities;
    this.generateModulation = generateModulation;
    this.generateNbChords = generateNbChords;
    this.generateDoubleChord = generateDoubleChord;
    this.generateBonusMin = generateBonusMin;
    this.generateBonusRandom = generateBonusRandom;
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
    this.showAllNotes = showAllNotes;
    this.allowDarkTheme = allowDarkTheme;
  }

}
