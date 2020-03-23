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
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    SecuredLayoutComponent,
    UnsecuredLayoutComponent,
    HeaderComponent,
    SecuredSidenavComponent,
    UnsecuredSidenavComponent
  ],
  imports: [
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    AppRoutingModule,
    LayoutModule,
    MaterialModule,
    TranslateModule,
    MDBootstrapModule
  ],
  exports: [
    AppRoutingModule,
    LayoutModule,
    MaterialModule,
  ]
})
export class AppLayoutModule { }
