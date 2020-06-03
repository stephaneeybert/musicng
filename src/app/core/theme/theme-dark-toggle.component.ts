import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-dark-toggle',
  templateUrl: './theme-dark-toggle.component.html'
})
export class ThemeDarkToggleComponent implements OnInit {

  isDarkTheme$?: Observable<boolean>;

  constructor(private themeService: ThemeService) { }

  ngOnInit() {
    this.isDarkTheme$ = this.themeService.isDarkTheme$;
  }

  toggleDarkTheme(checked: boolean) {
    this.themeService.setDarkTheme(checked);
  }
}
