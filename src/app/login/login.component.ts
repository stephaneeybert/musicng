import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {KeycloakClientService} from '../keycloak-client.service';
import {AuthService} from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  username: string;
  password: string;

  constructor(private router: Router, private authService: AuthService, private keycloakClientService: KeycloakClientService) {}

  ngOnInit() {
    throw new Error('A dummy error in the login page');
  }

  login(): void {
    this.keycloakClientService.login(this.username, this.password).subscribe(
      data => {
        this.authService.setJwtTokenToLocalStorage(data.token);
        this.router.navigate(['user']);
      }
    );
  }

}
