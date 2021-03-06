import { Injectable } from '@angular/core';
import { Settings } from '@app/model/settings';
import { CommonService, LocalStorageService } from '@stephaneeybert/lib-core';

const PREFIX: string = 'musicng-settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsStorageService extends LocalStorageService<Settings> {

  constructor (
    private commonService: CommonService
  ) {
    super();
  }

  public setSettings(settings: Settings): void {
    this.set(PREFIX, settings);
  }

  public getSettings(): Settings {
    const settings: Settings | null = this.get(PREFIX);
    if (settings) {
      return settings;
    } else {
      return new Settings();
    }
  }

  public deleteSettings() {
    this.delete(PREFIX);
  }

  public cleanUpInstance(settingJson: any): Settings {
    const settings: Settings = new Settings();

    // The settings may end up being stored with unset properties
    if (this.commonService.isSet(settingJson.generateTempoBpm)) {
      settings.generateTempoBpm = Number(settingJson.generateTempoBpm);
    }
    if (this.commonService.isSet(settingJson.generateTimeSignatureNumerator)) {
      settings.generateTimeSignatureNumerator = Number(settingJson.generateTimeSignatureNumerator);
    }
    if (this.commonService.isSet(settingJson.generateTimeSignatureDenominator)) {
      settings.generateTimeSignatureDenominator = Number(settingJson.generateTimeSignatureDenominator);
    }
    if (this.commonService.isSet(settingJson.generateChordDuration)) {
      settings.generateChordDuration = Number(settingJson.generateChordDuration);
    }
    if (this.commonService.isSet(settingJson.generateChordDurationUnit)) {
      settings.generateChordDurationUnit = settingJson.generateChordDurationUnit;
    }
    if (this.commonService.isSet(settingJson.generateNoteOctave)) {
      settings.generateNoteOctave = Number(settingJson.generateNoteOctave);
    }
    if (this.commonService.isSet(settingJson.generateChordWidth)) {
      settings.generateChordWidth = Number(settingJson.generateChordWidth);
    }
    if (this.commonService.isSet(settingJson.generateReverseDissimilarChord)) {
      settings.generateReverseDissimilarChord = settingJson.generateReverseDissimilarChord;
    }
    if (this.commonService.isSet(settingJson.generateInpassingNote)) {
      settings.generateInpassingNote = Number(settingJson.generateInpassingNote);
    }
    if (this.commonService.isSet(settingJson.generateTonality)) {
      settings.generateTonality = settingJson.generateTonality;
    }
    if (this.commonService.isSet(settingJson.generateOnlyMajorTonalities)) {
      settings.generateOnlyMajorTonalities = settingJson.generateOnlyMajorTonalities;
    }
    if (this.commonService.isSet(settingJson.generateModulation)) {
      settings.generateModulation = Number(settingJson.generateModulation);
    }
    if (this.commonService.isSet(settingJson.generateNbChords)) {
      settings.generateNbChords = Number(settingJson.generateNbChords);
    }
    if (this.commonService.isSet(settingJson.generateDoubleChord)) {
      settings.generateDoubleChord = settingJson.generateDoubleChord;
    }
    if (this.commonService.isSet(settingJson.generateBonusMin)) {
      settings.generateBonusMin = settingJson.generateBonusMin;
    }
    if (this.commonService.isSet(settingJson.generateBonusRandom)) {
      settings.generateBonusRandom = settingJson.generateBonusRandom;
    }
    if (this.commonService.isSet(settingJson.generateMelody)) {
      settings.generateMelody = settingJson.generateMelody;
    }
    if (this.commonService.isSet(settingJson.generateHarmony)) {
      settings.generateHarmony = settingJson.generateHarmony;
    }
    if (this.commonService.isSet(settingJson.generateDrums)) {
      settings.generateDrums = settingJson.generateDrums;
    }
    if (this.commonService.isSet(settingJson.generateBass)) {
      settings.generateBass = settingJson.generateBass;
    }
    if (this.commonService.isSet(settingJson.generateVelocityMelody)) {
      settings.generateVelocityMelody = Number(settingJson.generateVelocityMelody);
    }
    if (this.commonService.isSet(settingJson.generateVelocityHarmony)) {
      settings.generateVelocityHarmony = Number(settingJson.generateVelocityHarmony);
    }
    if (this.commonService.isSet(settingJson.generateVelocityDrums)) {
      settings.generateVelocityDrums = Number(settingJson.generateVelocityDrums);
    }
    if (this.commonService.isSet(settingJson.generateVelocityBass)) {
      settings.generateVelocityBass = Number(settingJson.generateVelocityBass);
    }
    if (this.commonService.isSet(settingJson.animatedStave)) {
      settings.animatedStave = settingJson.animatedStave;
    }
    if (this.commonService.isSet(settingJson.showKeyboard)) {
      settings.showKeyboard = settingJson.showKeyboard;
    }
    if (this.commonService.isSet(settingJson.showAllNotes)) {
      settings.showAllNotes = settingJson.showAllNotes;
    }
    if (this.commonService.isSet(settingJson.allowDarkTheme)) {
      settings.allowDarkTheme = settingJson.allowDarkTheme;
    }
    return settings;
  }

}
