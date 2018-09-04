import {Injectable} from '@angular/core';
import {Router, CanActivate, CanLoad, ActivatedRouteSnapshot} from '@angular/router';

import {TokenService} from './token.service';

@Injectable()
export class AuthGuardService implements CanActivate, CanLoad {

  constructor(private router: Router, private authService: TokenService) {}

  // Check if the user can navigate to a route
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRole = route.data.expectedRole ? route.data.expectedRole : null;
    const tokenPayload = this.authService.getDecodedToken();
    const role = tokenPayload.role ? tokenPayload.role : null;
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['login']);
      return false;
    } else if (role != null && role !== expectedRole) {
      this.router.navigate(['login']);
      return false;
    } else {
      return true;
    }
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
