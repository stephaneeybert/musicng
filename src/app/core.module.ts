import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ToastModule } from '@app/core/toast';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { UtilsService } from './core/service/utils.service';
import { HttpService } from './core/service/http.service';
import { NotificationService } from './core/service/notification.service';
import { PaginationService } from './core/service/pagination.service';
import { LoginService } from './core/service/login.service';
import { UserService } from './views/user/user.service';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  imports: [
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    ToastModule.forRoot()
  ],
  providers: [
    UtilsService,
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
