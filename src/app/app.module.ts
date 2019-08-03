import { NgModule } from '@angular/core';

import { AppLayoutModule } from '@app/layouts/app-layout.module';
import { AppUiModule } from './app-ui.module';
import { ErrorModule } from './core/error';
import { CoreModule } from './core.module';
import { AuthModule } from './core/auth/auth.module';

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
// import { MidiLibModule } from 'midi-lib';

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
    AppLayoutModule,
    AppUiModule,
    ErrorModule,
    CoreModule,
    AuthModule,
    // MidiLibModule
  ],
  entryComponents: [
    LoginDialogComponent,
    UserDialogComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
