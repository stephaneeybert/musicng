import { LayoutModule } from '@angular/cdk/layout';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from '@app/app-routing.module';
import { AppUiModule } from '@app/app-ui.module';
import { SensorModule } from '@app/core/sensor/sensor.module';
import { ThemeModule } from '@app/core/theme/theme.module';
import { SecuredLayoutComponent } from '@app/layouts/secured/secured.layout.component';
import { SecuredSidenavComponent } from '@app/layouts/secured/secured.sidenav.component';
import { UnsecuredLayoutComponent } from '@app/layouts/unsecured/unsecured.layout.component';
import { UnsecuredSidenavComponent } from '@app/layouts/unsecured/unsecured.sidenav.component';
import { MaterialModule } from '@app/material.module';
import { SettingsDialogComponent } from '@app/views/settings/settings-dialog.component';
import { SettingsResetDialogComponent } from '@app/views/settings/settings-reset-dialog.component';
import { SettingsResetComponent } from '@app/views/settings/settings-reset.component';
import { SettingsComponent } from '@app/views/settings/settings.component';
import { SheetMenuComponent } from '@app/views/sheet/sheet-menu.component';
import { LibCoreModule } from '@stephaneeybert/lib-core';
import { LibI18nModule } from '@stephaneeybert/lib-i18n';
import { LibPwaModule } from '@stephaneeybert/lib-pwa';

@NgModule({
  declarations: [
    SecuredLayoutComponent,
    UnsecuredLayoutComponent,
    SecuredSidenavComponent,
    UnsecuredSidenavComponent,
    SettingsDialogComponent,
    SettingsComponent,
    SettingsResetDialogComponent,
    SettingsResetComponent,
    SheetMenuComponent
  ],
  imports: [
    AppRoutingModule,
    LayoutModule,
    AppUiModule,
    MaterialModule,
    LibI18nModule,
    LibCoreModule,
    LibPwaModule,
    ThemeModule,
    SensorModule
  ],
  exports: [
    AppRoutingModule,
    LayoutModule,
    AppUiModule,
    MaterialModule
  ]
})
export class AppLayoutModule { }
