import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';

import { environment } from '@env/environment';
import { AppRoutingModule } from '@app/app-routing.module';
import { LayoutModule } from '@angular/cdk/layout';
import { MaterialModule } from '@app/material.module';
import { UnsecuredLayoutComponent } from '@app/layouts/unsecured/unsecured.layout';
import { SecuredLayoutComponent } from '@app/layouts/secured/secured.layout';
import { HeaderComponent } from '@app/layouts/secured/header.component';
import { SidenavComponent } from '@app/layouts/secured/sidenav.component';

@NgModule({
  declarations: [
    SecuredLayoutComponent,
    UnsecuredLayoutComponent,
    HeaderComponent,
    SidenavComponent
  ],
  imports: [
    BrowserModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    AppRoutingModule,
    LayoutModule,
    MaterialModule,
  ],
  exports: [
    BrowserModule,
    AppRoutingModule,
    LayoutModule,
    MaterialModule,
  ]
})
export class AppLayoutModule { }
