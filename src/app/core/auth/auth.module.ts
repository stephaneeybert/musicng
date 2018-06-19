import {NgModule} from '@angular/core';
import {JwtModule, JWT_OPTIONS} from '@auth0/angular-jwt';
import {HttpClientModule, HTTP_INTERCEPTORS} from '@angular/common/http';

import {KeycloakInterceptor} from './keycloak.interceptor';
import {KeycloakClientService} from './keycloak-client.service';
import {AuthService} from './auth.service';
import {AuthGuardService} from './auth-guard.service';

export function jwtOptionsFactory(authService: AuthService) {
  return {
    // whitelistedDomains: ['localhost:4200'],
    // blacklistedRoutes: ['localhost:8180/auth/'],
    tokenGetter: () => {
      return authService.getJwtTokenFromLocalStorage();
    }
  };
}

@NgModule({
  imports: [
    HttpClientModule,
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory,
        deps: [AuthService]
      }
    })
  ],
  providers: [
    KeycloakClientService,
    AuthService,
    AuthGuardService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: KeycloakInterceptor,
      multi: true,
    }
  ]
})
export class AuthModule {

  constructor(keycloakClientService: KeycloakClientService) {
    keycloakClientService.init()
    .then(
      () => {
        console.log('The keycloak client service has been initialized');
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
