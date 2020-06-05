import { Component } from '@angular/core';
import { ThemeService } from '@app/core/theme/theme.service';
import { Observable } from 'rxjs';
import { ThemeMenuOption } from './theme-menu-option';

@Component({
  selector: 'app-theme',
  templateUrl: './theme.component.html'
})
export class ThemeComponent {

  themeMenuOptions$: Observable<Array<ThemeMenuOption>> = this.themeService.getThemeOptions();

  constructor(
    private themeService: ThemeService
  ) { }

  themeChangeHandler(themeId: string): void {
    this.themeService.switchTheme(themeId);
  }

}
