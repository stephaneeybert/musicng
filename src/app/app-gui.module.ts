import { NgModule } from '@angular/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, MatInputModule } from '@angular/material';
import { LoginDialogComponent } from './core/login/login-dialog.component';

@NgModule({
  declarations: [
    LoginDialogComponent
  ],
  imports: [
    BrowserAnimationsModule,
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  exports: [
  ],
  entryComponents: [
    LoginDialogComponent
  ]
})
export class AppGuiModule { }
