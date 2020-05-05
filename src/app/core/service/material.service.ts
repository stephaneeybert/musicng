import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

const SNACKBAR_DISPLAY_DURATION: number = 2000;

@Injectable({
  providedIn: 'root'
})
export class MaterialService {

  constructor(
    private matSnackBar: MatSnackBar
  ) { }

  public showSnackBar(message: string, action?: string): void {
    this.matSnackBar.open(message, action, {
      duration: SNACKBAR_DISPLAY_DURATION
    });
  }

}
