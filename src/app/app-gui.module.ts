import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, MatInputModule } from '@angular/material';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { LoginDialogComponent } from './core/login/login-dialog.component';

@NgModule({
  declarations: [
    LoginDialogComponent
  ],
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatDialogModule,
    MatFormFieldModule,
  ],
  exports: [
  ],
  entryComponents: [
    LoginDialogComponent
  ]
})
export class AppGuiModule { }
