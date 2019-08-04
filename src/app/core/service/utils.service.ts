import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

    constructor(
        private matSnackBar: MatSnackBar
    ) { }

    public showSnackBar(message: string, action?: string) {
        this.matSnackBar.open(message, action, {
          duration: 2000,
        });
      }

    public sortByAsc(collection: any, fieldName: string): any {
        return collection.sort((param1, param2) => {
            return param1[fieldName] < param2[fieldName] ? -1 :
                (param1[fieldName] > param2[fieldName] ? 1 : 0);
        });
    }

    public sortByDesc(collection: any, fieldName: string): any {
        return collection.sort((param1, param2) => {
            return param1[fieldName] > param2[fieldName] ? -1 :
                (param1[fieldName] < param2[fieldName] ? 1 : 0);
        });
    }
}
