import {Injectable} from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot
} from '@angular/router';

import decode from 'jwt-decode';

import {AuthService} from './auth.service';

@Injectable()
export class RoleGuardService implements CanActivate {

  constructor(private router: Router, private authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRole = route.data.expectedRole;
    const token = localStorage.getItem(this.authService.getJwtTokenName());
    const tokenPayload = decode(token);
    if (!this.authService.isAuthenticated() || tokenPayload.role !== expectedRole) {
      this.router.navigate(['login']);
      return false;
    }
    return true;
  }

}
