import { NgModule } from '@angular/core';
import { MaterialModule } from '@app/material.module';
import { ThemeComponent } from './theme.component';
import { ThemeMenuComponent } from './theme-menu.component';
import { CommonModule } from '@angular/common';
import { LibI18nModule } from '@stephaneeybert/lib-i18n';
import { ThemeDarkToggleComponent } from './theme-dark-toggle.component';

@NgModule({
  declarations: [
    ThemeComponent,
    ThemeMenuComponent,
    ThemeDarkToggleComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    LibI18nModule
  ],
  exports: [
    LibI18nModule,
    ThemeComponent,
    ThemeDarkToggleComponent
  ]
})
export class ThemeModule { }
