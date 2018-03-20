import {Injectable} from '@angular/core';
import {Router, CanActivate, CanLoad} from '@angular/router';

import {AuthService} from './auth.service';

@Injectable()
export class AuthGuardService implements CanActivate, CanLoad {

  constructor(private router: Router, private authService: AuthService) {
  }

  // Indicates if the navigation to a route is allowed
  canActivate(): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['login']);
      return false;
    }
    return true;
  }

  canLoad(): boolean {
    if (this.authService.isLoggedInAndAuthenticated()) {
      console.log('The user has been successfully authenticated');
      return true;
    } else {
      console.log('The user could not be authenticated');
      this.router.navigate(['login']);
      return false;
    }
  }

}
