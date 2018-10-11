import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LoginDialogComponent } from './core/login/login-dialog.component';

@NgModule({
  declarations: [
    LoginDialogComponent
  ],
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
  ],
  entryComponents: [
    LoginDialogComponent
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class AppGuiModule { }
