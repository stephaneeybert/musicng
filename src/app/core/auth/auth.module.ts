import { NgModule } from '@angular/core';
import { JwtModule, JWT_OPTIONS } from '@auth0/angular-jwt';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AuthInterceptor } from './auth.interceptor';
import { TokenService } from './token.service';
import { AuthGuardService } from './auth-guard.service';

export function jwtOptionsFactory(tokenService: TokenService) {
  return {
    // whitelistedDomains: ['localhost:4200'],
    // blacklistedRoutes: ['localhost:8180/auth/'],
    tokenGetter: () => {
      return tokenService.getAccessTokenFromLocalStorage();
    }
  };
}

@NgModule({
  imports: [
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory,
        deps: [TokenService]
      }
    })
  ],
  providers: [
    AuthGuardService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
})
export class AuthModule { }
