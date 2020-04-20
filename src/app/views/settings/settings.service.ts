import { Injectable } from '@angular/core';
import { SettingsStore } from '../../lib/store/settings-store';
import { Settings } from '../../model/settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(
    private settingsStore: SettingsStore
  ) { }

  public getSettings(): Settings {
    return this.settingsStore.getSettings();
  }

  public setSettings(settings: Settings) {
    this.settingsStore.setSettings(settings);
  }

  public setAndStoreSettings(settings: Settings) {
    this.settingsStore.setAndStoreSettings(settings);
  }

}
