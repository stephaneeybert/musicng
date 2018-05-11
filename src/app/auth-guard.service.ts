import {Injectable} from '@angular/core';
import {Router, CanActivate, CanLoad, ActivatedRouteSnapshot} from '@angular/router';

import {AuthService} from './auth.service';

@Injectable()
export class AuthGuardService implements CanActivate, CanLoad {

  constructor(private router: Router, private authService: AuthService) {}

  // Check if the user can navigate to a route
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRole = route.data.expectedRole;
    const tokenPayload = this.authService.getDecodedToken();
    if (!this.authService.isAuthenticated() || tokenPayload.role !== expectedRole) {
      this.router.navigate(['login']);
      return false;
    }
    return true;
  }

  // Check if a module should be loaded
  // It would be pointless to load a module if the user may not use it
  canLoad(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      return false;
    }
  }

}
