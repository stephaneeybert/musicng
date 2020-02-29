import { Component } from '@angular/core';
import { LoginService } from '@app/core/service/login.service';

@Component({
  selector: 'app-secured-sidenav',
  templateUrl: './secured.sidenav.component.html'
})
export class SecuredSidenavComponent {

  constructor(
    private loginService: LoginService
  ) { }

  logout(): void {
    this.loginService.logout();
  }

}
