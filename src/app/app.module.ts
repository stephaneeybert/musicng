import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LayoutModule } from '@angular/cdk/layout';
import {
  MatToolbarModule, MatButtonModule, MatSidenavModule, MatIconModule,
  MatListModule, MatGridListModule, MatCardModule, MatMenuModule,
  MatTableModule, MatPaginatorModule, MatSortModule,
  MatDialogModule,
  MatFormFieldModule, MatInputModule
} from '@angular/material';

import { AppRoutingModule } from './app-routing.module';
import { ErrorModule } from './core/error';
import { AppGuiModule } from './app-gui.module';
import { AuthModule } from './core/auth/auth.module';

import { MessageService } from './core/messages/message.service';
import { UtilsService } from './core/service/utils.service';
import { HttpService } from './core/service/http.service';
import { PaginationService } from './core/service/pagination.service';
import { NotificationService } from './core/service/notification.service';
import { UserService } from './modules/user/user.service';

import { AppComponent } from './app.component';
import { MessagesComponent } from './core/messages/messages.component';
import { LoginComponent } from './core/login/login.component';
import { UsersComponent } from './modules/user/users.component';
import { UserComponent } from './modules/user/user.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { UserSearchComponent } from './modules/user/search.component';


@NgModule({
  declarations: [
    AppComponent,
    UsersComponent,
    UserComponent,
    MessagesComponent,
    DashboardComponent,
    UserSearchComponent,
    LoginComponent,
  ],
  imports: [
    BrowserModule,
    NgxPaginationModule,
    FormsModule,
    LayoutModule,
    ReactiveFormsModule,
    AppRoutingModule,
    AppGuiModule,
    AuthModule,
    ErrorModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  providers: [
    UtilsService,
    UserService,
    MessageService,
    NotificationService,
    HttpService,
    PaginationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
