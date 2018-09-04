import { NgModule } from '@angular/core';
import { JwtModule, JWT_OPTIONS } from '@auth0/angular-jwt';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { KeycloakInterceptor } from './keycloak.interceptor';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { KeycloakClientService } from './keycloak-client.service';
import { TokenService } from './token.service';
import { AuthGuardService } from './auth-guard.service';

export function jwtOptionsFactory(authService: TokenService) {
  return {
    // whitelistedDomains: ['localhost:4200'],
    // blacklistedRoutes: ['localhost:8180/auth/'],
    tokenGetter: () => {
      return authService.getAccessTokenFromLocalStorage();
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
        deps: [TokenService]
      }
    })
  ],
  providers: [
    AuthService,
    KeycloakClientService,
    TokenService,
    AuthGuardService,
    // {
    //   provide: HTTP_INTERCEPTORS, TODO
    //   useClass: KeycloakInterceptor,
    //   multi: true
    // },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
})
export class AuthModule {

  constructor(keycloakClientService: KeycloakClientService) {
    // const subscription = keycloakClientService.init() TODO
    // .subscribe(
    //   () => {
    //     console.log('The keycloak client service has been initialized');
    //   }
    // );
    // subscription.unsubscribe();
  }
}
