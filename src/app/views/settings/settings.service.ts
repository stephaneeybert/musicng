import { Injectable } from '@angular/core';
import { SettingsStore } from '@app/store/settings-store';
import { Settings } from '@app/model/settings';

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

  public percentageToVelocity(percent: number): number {
    return percent / 100;
  }

}
