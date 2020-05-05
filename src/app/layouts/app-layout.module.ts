import { NgModule } from '@angular/core';

import { AppRoutingModule } from '@app/app-routing.module';
import { LayoutModule } from '@angular/cdk/layout';
import { MaterialModule } from '@app/material.module';
import { MDBootstrapModule } from '@app/mdbootstrap.module';
import { UnsecuredLayoutComponent } from '@app/layouts/unsecured/unsecured.layout.component';
import { SecuredLayoutComponent } from '@app/layouts/secured/secured.layout.component';
import { HeaderComponent } from '@app/layouts/unsecured/header.component';
import { SecuredSidenavComponent } from '@app/layouts/secured/secured.sidenav.component';
import { UnsecuredSidenavComponent } from '@app/layouts/unsecured/unsecured.sidenav.component';
import { LibI18nModule } from 'lib-i18n';
import { LibCoreModule } from 'lib-core';
import { SettingsComponent } from '@app/views/settings/settings.component';
import { AppUiModule } from '@app/app-ui.module';
import { SettingsDialogComponent } from '@app/views/settings/settings-dialog.component';
import { PwaModule } from '@app/core/pwa/pwa.module';

@NgModule({
  declarations: [
    SecuredLayoutComponent,
    UnsecuredLayoutComponent,
    HeaderComponent,
    SecuredSidenavComponent,
    UnsecuredSidenavComponent,
    SettingsComponent,
    SettingsDialogComponent
  ],
  imports: [
    AppRoutingModule,
    PwaModule,
    LayoutModule,
    AppUiModule,
    LibI18nModule,
    LibCoreModule,
    MaterialModule,
    MDBootstrapModule
  ],
  exports: [
    AppRoutingModule,
    PwaModule,
    LayoutModule,
    AppUiModule,
    LibI18nModule,
    LibCoreModule,
    MaterialModule,
    MDBootstrapModule
  ],
  // entryComponents: [ // TODO Not needed ?
  //   SettingsDialogComponent
  // ]
})
export class AppLayoutModule { }
