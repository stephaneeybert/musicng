import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Router, CanActivate, CanActivateChild, CanLoad, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '@env/environment';

import { TokenService } from './token.service';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuardService implements CanActivate, CanActivateChild, CanLoad {

  constructor(
    private router: Router,
    private tokenService: TokenService,
    private authService: AuthService
  ) { }

  // Check if the user can navigate to a route
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.authService.isAuthenticated$()
    .pipe(
      map(isAuthenticated => {
        if (!isAuthenticated) {
          this.authService.setPostLoginRedirectUrl(state.url);
          this.router.navigate(['login']);
          return false;
        } else {
          return true;
        }
      }),
      catchError((error, caught) => {
        console.log(error);
        return of(false);
      })
    );
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.authService.isAuthenticated$()
    .pipe(
      map(isAuthenticated => {
        if (!isAuthenticated) {
          this.authService.setPostLoginRedirectUrl(state.url);
          this.router.navigate(['login']);
          return false;
        } else {
          const expectedRole: string = route.data.expectedRole ? (environment.ROLE_PREFIX + route.data.expectedRole).toUpperCase() : '';
          const tokenPayload: any = this.tokenService.getDecodedAccessToken();
          const actualRoles: Array<string> = tokenPayload.scopes ? tokenPayload.scopes : '';
          // Check the role only if the route expects one
          if (expectedRole != null && (actualRoles == null || !actualRoles.includes(expectedRole))) {
            this.router.navigate(['home']);
            return false;
          } else {
            return true;
          }
        }
      }),
      catchError((error, caught) => {
        console.log(error);
        return of(false);
      })
    );
  }

  // Check if a module should be loaded
  // It would be pointless to load a module if the user may not use it
  canLoad$(): Observable<boolean> {
    if (this.authService.isAuthenticated$()) {
      return of(true);
    } else {
      return of(false);
    }
  }

}
