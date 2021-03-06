import { NgModule } from '@angular/core';

import { AppLayoutModule } from '@app/layouts/app-layout.module';
import { ErrorModule } from './core/error/error.module';
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
import { DebounceDirective } from './debounce.directive';
import { DebounceClickDirective } from './debounce-click.directive';
import { SynthComponent } from './views/synth/synth.component';
import { KeyboardComponent } from './views/keyboard/keyboard.component';
import { DevicesComponent } from './views/device/devices.component';
import { SoundtracksComponent } from './views/soundtrack/soundtracks.component';
import { SheetComponent } from './views/sheet/sheet.component';
import { UploadComponent } from './views/upload/upload.component';
import { SoundtrackDialogComponent } from './views/soundtrack/soundtrack-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LoginDialogComponent,
    UsersComponent,
    UserComponent,
    UserConfirmedComponent,
    SoundtrackDialogComponent,
    UserEditComponent,
    UserDialogComponent,
    DebounceDirective,
    DebounceClickDirective,
    SynthComponent,
    SheetComponent,
    KeyboardComponent,
    DevicesComponent,
    SoundtracksComponent,
    UploadComponent
  ],
  imports: [
    CoreModule,
    AppLayoutModule,
    ErrorModule,
    AuthModule
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
