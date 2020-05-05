import { Injectable } from '@angular/core';
import { Settings } from '@app/model/settings';
import { LocalStorageService } from 'lib-core';

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
    settings.animatedStave = settingJson.animatedStave;
    return settings;
  }

}
