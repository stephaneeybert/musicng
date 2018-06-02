import { Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ErrorHandler } from '@angular/core';

import { ErrorService } from './error.service';
import { NotificationService } from '../service/notification.service';

@Injectable()
export class ErrorCustomHandler implements ErrorHandler {

    constructor(private injector: Injector) { }

    handleError(error: Error | HttpErrorResponse): void {
        const notificationService = this.injector.get(NotificationService);
        const errorService = this.injector.get(ErrorService);
        const router = this.injector.get(Router);

        console.log('There is an error');
        if (error instanceof HttpErrorResponse) {
            // Handle server or connection errors
            if (!navigator.onLine) {
                // TODO return notificationService.notify('No Internet Connection');
                console.log('No internet connection');
            } else {
                // Handle Http errors (like error.status === 403, 404...)
                console.log('HTTP ERROR !! 404');
                errorService.log(error).subscribe();
                // TODO return notificationService.notify(`${error.status} - ${error.message}`);
            }
        } else {
            // Handle client errors (Angular Error, ReferenceError...)
            // Client errors can completely crash the app,
            // or originate corrupt data that could be stored in the server,
            // or keep the user working on stuff that wouldn’t be saved
            // If something is broken in the app, stop the app and
            // redirect the user to an error screen with all the information
            console.log(error);
            errorService.log(error).subscribe(errorWithContextInfo => {
                console.log(errorWithContextInfo);
                router.navigate(['/error'], { queryParams: errorWithContextInfo });
            });
        }
    }
}
