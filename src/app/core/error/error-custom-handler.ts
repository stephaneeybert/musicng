import { ErrorHandler, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Injector } from '@angular/core';
import { Router } from '@angular/router';

import { ErrorService } from './error.service';

@Injectable()
export class ErrorCustomHandler implements ErrorHandler {

    constructor(private injector: Injector) { }

    handleError(error: Error | HttpErrorResponse) {
        const router = this.injector.get(Router);
        const errorService = this.injector.get(ErrorService);

        if (error instanceof HttpErrorResponse) {
            // Server or connection error happened
            if (!navigator.onLine) {
                // No Internet connection
                // return notificationService.notify('No Internet Connection');
            } else {
                // Handle Http Error (error.status === 403, 404...)
                errorService.log(error).subscribe();
                // return notificationService.notify(`${error.status} - ${error.message}`);
            }
        } else {
            // Handle Client Error (Angular Error, ReferenceError...)
            // Client errors can completely crash the app, or originate corrupt data that could be stored in the server,
            // or keep the user working on stuff that wouldn’t be saved
            // If something is broken in the app, stop the app, redirect the user to an error screen with all the information
            errorService.log(error).subscribe(errorWithContextInfo => {
                router.navigate(['/error'], { queryParams: errorWithContextInfo });
            });
        }

        console.error('An error was handled: ', error);
    }
}
