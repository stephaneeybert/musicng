import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '@app/core/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

    constructor(
        private router: Router,
        private authService: AuthService
    ) { }

    login(username: string, password: string) {
        this.authService.login(username, password).subscribe(
            response => {
                if (this.authService.getPostLoginRedirectUrl() != null) {
                    this.router.navigateByUrl(this.authService.getPostLoginRedirectUrl());
                } else {
                    this.router.navigate(['users']);
                }
            },
            error => {
                console.log(error);
            }
        );
    }

    logout() {
        this.authService.logout().subscribe(
            response => {
                this.router.navigate(['login']);
            },
            error => {
                console.log(error);
            }
        );
    }

}
