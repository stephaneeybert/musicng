import { NgModule } from '@angular/core';
import { ServiceWorkerModule } from '@angular/service-worker';

import { environment } from '@env/environment';
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
import { SettingsComponent } from '@app/views/settings/settings.component';
import { AppUiModule } from '@app/app-ui.module';
import { SettingsDialogComponent } from '@app/views/settings/settings-dialog.component';

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
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    AppRoutingModule,
    LayoutModule,
    AppUiModule,
    LibI18nModule,
    MaterialModule,
    MDBootstrapModule
  ],
  exports: [
    AppRoutingModule,
    LayoutModule,
    AppUiModule,
    LibI18nModule,
    MaterialModule,
    MDBootstrapModule
  ],
  // entryComponents: [ // TODO Not needed ?
  //   SettingsDialogComponent
  // ]
})
export class AppLayoutModule { }
