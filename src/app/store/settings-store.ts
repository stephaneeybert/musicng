import { Injectable } from '@angular/core';
import { Store } from './store';
import { Settings } from '@app/model/settings';
import { Observable } from 'rxjs';
import { SettingsStorageService } from '@app/views/settings/settings-storage.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsStore extends Store<Settings> {

  constructor(
    private settingsStorageService: SettingsStorageService
  ) {
    super(new Settings());
  }

  public loadFromStorage(): void {
    const settingsJson: any = this.settingsStorageService.getSettings();
    if (settingsJson) {
      const settings: Settings = this.settingsStorageService.cleanUpInstance(settingsJson);
      this.setState(settings);
    }
  }

  public getSettings$(): Observable<Settings> {
    return this.state$!;
  }

  public getSettings(): Settings {
    return this.getState();
  }

  public setSettings(settings: Settings) {
    this.setState(settings);
  }

  private storeSettings(settings: Settings): void {
    const cleanSettings: Settings = this.settingsStorageService.cleanUpInstance(settings);
    this.settingsStorageService.setSettings(cleanSettings);
  }

  public setAndStoreSettings(settings: Settings) {
    this.setSettings(settings);
    this.storeSettings(settings);
  }

  public delete(): boolean {
    this.setState(new Settings());
    this.settingsStorageService.deleteSettings();
    return true;
  }

}
