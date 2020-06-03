import { Component, OnInit } from '@angular/core';
import { ThemeService } from '@app/core/theme/theme.service';
import { Observable } from 'rxjs';
import { ThemeMenuOption } from './theme-menu-option';

@Component({
  selector: 'app-theme',
  templateUrl: './theme.component.html'
})
export class ThemeComponent implements OnInit {

  themeMenuOptions$: Observable<Array<ThemeMenuOption>> = this.themeService.getThemeOptions();

  constructor(
    private themeService: ThemeService
  ) { }

  ngOnInit() {
    this.themeService.setDefaultTheme();
  }

  themeChangeHandler(themeName: string): void {
    this.themeService.setCustomTheme(themeName);
  }

}
