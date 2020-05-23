import { Injectable } from '@angular/core';
import { Settings } from '@app/model/settings';
import { LocalStorageService } from '@stephaneeybert/lib-core';

const PREFIX: string = 'musicng-settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsStorageService extends LocalStorageService<Settings> {

  public setSettings(settings: Settings): void {
    this.set(PREFIX, settings);
  }

  public getSettings(): Settings {
    const settings: Settings | null = this.get(PREFIX);
    return settings ? settings : new Settings();
  }

  public deleteSettings() {
    this.delete(PREFIX);
  }

  public cleanUpInstance(settingJson: any): Settings {
    const settings: Settings = new Settings();
    settings.generateTempoBpm = Number(settingJson.generateTempoBpm);
    settings.generateTimeSignatureNumerator = Number(settingJson.generateTimeSignatureNumerator);
    settings.generateTimeSignatureDenominator = Number(settingJson.generateTimeSignatureDenominator);
    settings.generateChordDuration = Number(settingJson.generateChordDuration);
    settings.generateChordDurationUnit = settingJson.generateChordDurationUnit;
    settings.generateNoteOctave = Number(settingJson.generateNoteOctave);
    settings.generateChordWidth = Number(Number(settingJson.generateChordWidth));
    settings.generateMethod = settingJson.generateMethod;
    settings.generateReverseDissimilarChord = settingJson.generateReverseDissimilarChord;
    settings.generateNbChords = Number(settingJson.generateNbChords);
    settings.generateSymphony = settingJson.generateSymphony;
    settings.generateDrums = settingJson.generateDrums;
    settings.generateBass = settingJson.generateBass;
    settings.animatedStave = settingJson.animatedStave;
    settings.showKeyboard = settingJson.showKeyboard;
    return settings;
  }

}
