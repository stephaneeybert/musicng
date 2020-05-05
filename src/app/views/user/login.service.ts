import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '@app/core/auth/auth.service';
import { HttpResponse } from '@angular/common/http';
import { User } from '@app/views/user/user';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  login(username: string, password: string) {
    const subscription: Subscription = this.authService.login(username, password)
    .subscribe((response: HttpResponse<User>) => {
        if (this.authService.getPostLoginRedirectUrl() != null) {
          this.router.navigateByUrl(this.authService.getPostLoginRedirectUrl());
        } else {
          this.router.navigate(['users']);
        }
        subscription.unsubscribe();
      },
      error => {
        console.log(error);
        subscription.unsubscribe();
      }
    );
  }

  logout() { // TODO This subscription should be done at service load time and it should not be necessary to call it from the components
    this.authService.logout$().subscribe( // TODO Missing unsubscribe
      (response: HttpResponse<User>) => {
        this.router.navigate(['login']);
      },
      error => {
        console.log(error);
      }
    );
  }

}
