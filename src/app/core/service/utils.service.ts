import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root'
})
export class UtilsService {

    constructor(
        private matSnackBar: MatSnackBar
    ) { }

    public showSnackBar(message: string, action: string): void {
        this.matSnackBar.open(message, action, {
            duration: 2000,
        });
    }
}
