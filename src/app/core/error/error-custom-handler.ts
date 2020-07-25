import { Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler } from '@angular/core';

import { ErrorService } from './error.service';
import { Subscription } from 'rxjs';

@Injectable()
export class ErrorCustomHandler implements ErrorHandler {

  constructor(
    private injector: Injector
  ) { }

  handleError(error: Error | HttpErrorResponse): void {
    const errorService: any = this.injector.get(ErrorService);

    if (error instanceof HttpErrorResponse) {
      // Handle server or connection errors
      if (!navigator.onLine) {
        console.log('No internet connection');
      } else {
        // Handle Http errors (like error.status === 403, 404...)
        console.log('An HTTP error occured');
        const subscription: Subscription = errorService.log(error).subscribe((errorWithContextInfo: any) => {
          console.log(errorWithContextInfo);
          subscription.unsubscribe();
        });
      }
    } else {
      // Handle client errors (Angular Error, ReferenceError...)
      // Client errors can completely crash the app,
      // or originate corrupt data that could be stored in the server,
      // or keep the user working on stuff that wouldn’t be saved
      // If something is broken in the app, stop the app and
      // redirect the user to an error screen with all the information
      const subscription: Subscription = errorService.log(error)
      .subscribe((errorWithContextInfo: any) => {
        console.log(errorWithContextInfo);
        subscription.unsubscribe();
      });
    }
  }
}
