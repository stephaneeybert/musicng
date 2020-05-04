import { Component } from '@angular/core';

import { LoginService } from '@app/views/user/login.service';

@Component({
  selector: 'app-secured-layout',
  templateUrl: './secured.layout.component.html'
})
export class SecuredLayoutComponent {

  constructor(
    private loginService: LoginService
  ) { }

  logout(): void {
    this.loginService.logout();
  }

}
