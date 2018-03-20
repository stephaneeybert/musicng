import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {KeycloakService} from '../keycloak.service';
import {AuthService} from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  username: string;
  password: string;

  constructor(private router: Router, private authService: AuthService, private keycloakService: KeycloakService) {}

  ngOnInit() {
  }

  login(): void {
    console.log('In the component login method');
    this.keycloakService.login(this.username, this.password).subscribe(
      data => {
        this.authService.setJwtTokenToLocalStorage(data.token);
        this.router.navigate(['user']);
      }
    );
  }

}
