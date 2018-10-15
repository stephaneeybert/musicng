import { Observable } from 'rxjs';
import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import { LoginService } from '../../core/service/login.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  isLoggedIn$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private loginService: LoginService
  ) { }

  ngOnInit() {
    this.isLoggedIn$ = this.authService.isAuthenticated();
  }

  logout(): void {
    this.loginService.logout();
  }

}
