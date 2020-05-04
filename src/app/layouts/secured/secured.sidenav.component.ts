import { Component } from '@angular/core';
import { LoginService } from '@app/views/user/login.service';

@Component({
  selector: 'app-secured-sidenav',
  templateUrl: './secured.sidenav.component.html',
  styleUrls: ['../sidenav.component.css']
})
export class SecuredSidenavComponent {

  constructor(
    private loginService: LoginService
  ) { }

  logout(): void {
    this.loginService.logout();
  }

}
