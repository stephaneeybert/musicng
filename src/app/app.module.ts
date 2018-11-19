import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { LayoutModule } from '@angular/cdk/layout';
import { ServiceWorkerModule } from '@angular/service-worker';

import { CoreModule } from './core.module';
import { AppRoutingModule } from './app-routing.module';
import { ErrorModule } from './core/error';
import { AppGuiModule } from './app-gui.module';
import { AuthModule } from './core/auth/auth.module';
import { MaterialModule } from './material.module';

import { AppComponent } from './app.component';
import { MessagesComponent } from './core/messages/messages.component';
import { SecuredLayoutComponent } from './layouts/secured.layout';
import { UnsecuredLayoutComponent } from './layouts/unsecured.layout';
import { LoginComponent } from './core/login/login.component';
import { UsersComponent } from './views/user/users.component';
import { UserComponent } from './views/user/user.component';
import { UserConfirmedComponent } from './views/user/user-confirmed.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';

import { environment } from '../environments/environment';
import { LoginDialogComponent } from './core/login/login-dialog.component';
import { UserDialogComponent } from './views/user/user-dialog.component';
import { HeaderComponent } from './views/header/header.component';
import { UserEditComponent } from '@app/views/user/user-edit.component';

@NgModule({
  declarations: [
    AppComponent,
    UsersComponent,
    UserComponent,
    UserConfirmedComponent,
    UserEditComponent,
    MessagesComponent,
    DashboardComponent,
    SecuredLayoutComponent,
    UnsecuredLayoutComponent,
    LoginComponent,
    LoginDialogComponent,
    HeaderComponent,
    UserDialogComponent
  ],
  imports: [
    CoreModule,
    BrowserModule,
    LayoutModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    AppRoutingModule,
    ErrorModule,
    AuthModule,
    MaterialModule,
    AppGuiModule,
  ],
  entryComponents: [
    LoginDialogComponent,
    UserDialogComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
