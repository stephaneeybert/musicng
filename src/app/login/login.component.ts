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
    console.log('Dummy log for a breakpoint');
  }

  login(): void {
    console.log('=======>> In the component login method');
    this.keycloakClientService.login(this.username, this.password).subscribe(
      data => {
        this.authService.setJwtTokenToLocalStorage(data.token);
        this.router.navigate(['user']);
      }
    );
  }

}
