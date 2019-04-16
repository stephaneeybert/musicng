import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';

import { environment } from '../../environments/environment';
import { AppRoutingModule } from './../app-routing.module';
import { LayoutModule } from '@angular/cdk/layout';
import { MaterialModule } from './../material.module';
import { UnsecuredLayoutComponent } from './../layouts/unsecured/unsecured.layout';
import { SecuredLayoutComponent } from './../layouts/secured/secured.layout';
import { HeaderComponent } from './../views/header/header.component';

@NgModule({
  declarations: [
    SecuredLayoutComponent,
    UnsecuredLayoutComponent,
    HeaderComponent,
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
