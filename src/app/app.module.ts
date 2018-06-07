import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';

import { AppRoutingModule } from './app-routing.module';
import { AuthModule } from './core/auth/auth.module';
import { AppComponent } from './app.component';
import { MessagesComponent } from './core/messages/messages.component';
import { MessageService } from './core/messages/message.service';
import { LoginComponent } from './core/login/login.component';
import { InMemoryDataService } from './core/service/in-memory-data.service';
import { HeroesComponent } from './modules/heroes/heroes.component';
import { HeroDetailComponent } from './modules/hero-detail/hero-detail.component';
import { HeroService } from './modules/hero/hero.service';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { HeroSearchComponent } from './modules/hero-search/hero-search.component';

import { NotificationService } from './core/service/notification.service';
import { ErrorModule } from './core/error';
import { KeycloakClientService } from './core/auth/keycloak-client.service';

@NgModule({
  declarations: [
    AppComponent,
    HeroesComponent,
    HeroDetailComponent,
    MessagesComponent,
    DashboardComponent,
    HeroSearchComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    HttpClientInMemoryWebApiModule.forRoot(
      InMemoryDataService, { dataEncapsulation: false }
    ),
    AppRoutingModule,
    AuthModule,
    ErrorModule
  ],
  providers: [
    HeroService,
    MessageService,
    NotificationService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor(keycloakClientService: KeycloakClientService) {
    keycloakClientService.init()
    .then(
      () => {
        console.log('The keycloak client has been initialized');
      }
    )
    .catch(
      (error) => {
        console.log(error);
        window.location.reload();
      }
    );
  }
}
