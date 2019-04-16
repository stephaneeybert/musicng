import { NgModule } from '@angular/core';
import { ServiceWorkerModule } from '@angular/service-worker';

import { AppLayoutModule } from '@app/app-layout.module';
import { AppUiModule } from './app-ui.module';
import { ErrorModule } from './core/error';
import { CoreModule } from './core.module';
import { AuthModule } from './core/auth/auth.module';

import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { LoginComponent } from './core/login/login.component';
import { LoginDialogComponent } from './core/login/login-dialog.component';
import { UsersComponent } from './views/user/users.component';
import { UserComponent } from './views/user/user.component';
import { UserConfirmedComponent } from './views/user/user-confirmed.component';
import { UserEditComponent } from '@app/views/user/user-edit.component';
import { UserDialogComponent } from './views/user/user-dialog.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { DashboardViewComponent } from '@app/views/dashboard/dashboard.view.component';
import { DebounceDirective } from './debounce.directive';
import { DebounceClickDirective } from './debounce-click.directive';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LoginDialogComponent,
    UsersComponent,
    UserComponent,
    UserConfirmedComponent,
    UserEditComponent,
    UserDialogComponent,
    DashboardComponent,
    DashboardViewComponent,
    DebounceDirective,
    DebounceClickDirective
  ],
  imports: [
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    AppLayoutModule,
    AppUiModule,
    ErrorModule,
    CoreModule,
    AuthModule,
  ],
  entryComponents: [
    LoginDialogComponent,
    UserDialogComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
