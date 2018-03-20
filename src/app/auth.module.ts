import {NgModule} from '@angular/core';
import {AuthGuardService} from './auth-guard.service';
import {HttpClientModule, HTTP_INTERCEPTORS} from '@angular/common/http';
import {JwtModule, JWT_OPTIONS} from '@auth0/angular-jwt';
import {KeycloakInterceptor} from './keycloak.interceptor';

import {KeycloakService} from './keycloak.service';
import {AuthService} from './auth.service';

// See https://github.com/auth0/angular2-jwt

export function jwtOptionsFactory(authService) {
  return {
    whitelistedDomains: ['localhost:3001'],
    blacklistedRoutes: ['localhost:3001/auth/'],
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
    AuthGuardService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: KeycloakInterceptor,
      multi: true,
    },
    KeycloakService,
    AuthService,
  ]
})
export class AuthModule {}
