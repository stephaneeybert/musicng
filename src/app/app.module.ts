import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { ErrorModule } from './core/error';
import { AppGuiModule } from './app-gui.module';
import { AuthModule } from './core/auth/auth.module';

import { MessageService } from './core/messages/message.service';
import { HttpService } from './core/service/http.service';
import { NotificationService } from './core/service/notification.service';
import { UserService } from './modules/user/user.service';

import { AppComponent } from './app.component';
import { MessagesComponent } from './core/messages/messages.component';
import { LoginComponent } from './core/login/login.component';
import { UsersComponent } from './modules/user/users.component';
import { UserDetailComponent } from './modules/user/user.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { UserSearchComponent } from './modules/user/search.component';


@NgModule({
  declarations: [
    AppComponent,
    UsersComponent,
    UserDetailComponent,
    MessagesComponent,
    DashboardComponent,
    UserSearchComponent,
    LoginComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    AppGuiModule,
    AuthModule,
    ErrorModule
  ],
  providers: [
    UserService,
    MessageService,
    NotificationService,
    HttpService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
