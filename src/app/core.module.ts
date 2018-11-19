import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UtilsService } from './core/service/utils.service';
import { MessageService } from './core/messages/message.service';
import { HttpService } from './core/service/http.service';
import { NotificationService } from './core/service/notification.service';
import { PaginationService } from './core/service/pagination.service';
import { LoginService } from './core/service/login.service';
import { UserService } from './views/user/user.service';

@NgModule({
  providers: [
    UtilsService,
    MessageService,
    HttpService,
    NotificationService,
    PaginationService,
    UserService,
    LoginService
  ],
})
export class CoreModule {

  // Make sure the core module is imported only once as it contains all global services which are to be singletons
  constructor(@Optional() @SkipSelf() coreModule: CoreModule) {
    if (coreModule) {
      throw new Error('The core module has ALREADY been imported.');
    }
  }

}
