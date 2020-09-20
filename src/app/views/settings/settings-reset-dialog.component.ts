import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  templateUrl: './settings-reset-dialog.component.html',
  styleUrls: ['./settings-dialog.component.css']
})
export class SettingsResetDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<SettingsResetDialogComponent>
  ) {
  }

  reset() {
    this.dialogRef.close(true);
  }

  close() {
    this.dialogRef.close();
  }

}
