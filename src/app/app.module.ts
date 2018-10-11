import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { LayoutModule } from '@angular/cdk/layout';
import { NgxPaginationModule } from 'ngx-pagination';

import { CoreModule } from './core.module';
import { AppRoutingModule } from './app-routing.module';
import { ErrorModule } from './core/error';
import { AppGuiModule } from './app-gui.module';
import { AuthModule } from './core/auth/auth.module';
import { MaterialModule } from './material.module';

import { AppComponent } from './app.component';
import { MessagesComponent } from './core/messages/messages.component';
import { LoginComponent } from './core/login/login.component';
import { UsersComponent } from './views/user/users.component';
import { UserComponent } from './views/user/user.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { UserSearchComponent } from './views/user/search.component';

import { LoginDialogComponent } from './core/login/login-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    UsersComponent,
    UserComponent,
    MessagesComponent,
    DashboardComponent,
    UserSearchComponent,
    LoginComponent,
    LoginDialogComponent
  ],
  imports: [
    CoreModule,
    BrowserModule,
    LayoutModule,
    NgxPaginationModule,
    AppRoutingModule,
    ErrorModule,
    AuthModule,
    AppGuiModule,
    MaterialModule,
  ],
  entryComponents: [
    LoginDialogComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
