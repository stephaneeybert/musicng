import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';

@Injectable()
// TODO The only notable thing is that we use the new providedIn attribute of the Injectable decorator that’s available since Angular 6, specifying ‘root’ as a value. This means that this service will be registered, as a singleton, in our application and that we don’t need to add it to the providers array anymore.
// This actually means that our services are now tree-shakeable. If we have a service defined in our application, but it’s not referenced in any other place, it will be removed from the final bundle. This was not the case when we had to add them to the providers array of a module. Angular itself is starting to move its built-in services to this way of registering them and I suggest you start doing it as well.
// @Injectable({
//     providedIn: 'root'
// })
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
