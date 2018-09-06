import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Router, CanActivate, CanLoad, ActivatedRouteSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

import { TokenService } from './token.service';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuardService implements CanActivate, CanLoad {

  constructor(
    private router: Router,
    private tokenService: TokenService,
    private authService: AuthService
  ) { }

  // Check if the user can navigate to a route
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const expectedRole = route.data.expectedRole ? route.data.expectedRole : null;
    const tokenPayload = this.tokenService.getDecodedAccessToken();
    return this.authService.isAuthenticated()
    .pipe(
      map(isAuth => {
        console.log('A response was returned');
        console.log(isAuth);
        if (!isAuth) {
          this.router.navigate(['login']);
          return false;
        } else {
          return true;
        }
      }),
      catchError((error, caught) => {
        console.log('An error was returned');
        console.log(error);
        return of(false);
      })
    );
    // const role = tokenPayload.role ? tokenPayload.role : null;
    // if (!this.authService.isAuthenticated()) { TODO How to guard against missing roles ?
    // } else if (role != null && role !== expectedRole) {
    //   this.router.navigate(['login']);
    //   return of(false);
    // } else {
    //   return of(true);
    // }
  }

  // Check if a module should be loaded
  // It would be pointless to load a module if the user may not use it
  canLoad(): Observable<boolean> {
    if (this.authService.isAuthenticated()) {
      return of(true);
    } else {
      return of(false);
    }
  }

}
