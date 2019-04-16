import { Component } from '@angular/core';

import { LoginService } from '@app/core/service/login.service';

@Component({
  selector: 'app-secured-layout',
  templateUrl: './secured.layout.component.html'
})
export class SecuredLayoutComponent {

  title = 'Tour of Zeroes';

  constructor(
    private loginService: LoginService
  ) { }

  logout(): void {
    this.loginService.logout();
  }

}
