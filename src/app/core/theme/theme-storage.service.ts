import { Injectable } from '@angular/core';
import { LocalStorageService } from '@stephaneeybert/lib-core';
import { Theme } from './theme';

const PREFIX: string = 'musicng-theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeStorageService extends LocalStorageService<Theme> {

  public setTheme(theme: Theme): void {
    this.set(PREFIX, theme);
  }

  public getTheme(): Theme | null {
    const theme: Theme | null = this.get(PREFIX);
    return theme;
  }

  public deleteTheme() {
    this.delete(PREFIX);
  }

  public cleanUpInstance(themeJson: any): Theme {
    const theme: Theme = new Theme(themeJson.id, themeJson.isDark);
    return theme;
  }

}
