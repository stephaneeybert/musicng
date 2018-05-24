import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, Event, NavigationError } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import * as StackTraceParser from 'error-stack-parser';

@Injectable()
export class ErrorService {

    constructor(
        private injector: Injector,
        private router: Router,
    ) {
        // Subscribe to the navigation errors
        this.router
            .events
            .subscribe((event: Event) => {
                if (event instanceof NavigationError) {
                    this.log(event.error)
                        .subscribe((errorWithContext) => {
                            this.router.navigate(['/error'], { queryParams: errorWithContext });
                        });
                }
            });
    }

    log(error) {
        console.error(error);
        const errorToSend = this.addContextInfo(error);
        return FakeHttpService.post(errorToSend);
    }

    addContextInfo(error) {
        const name = error.name || null;
        const appId = 'shthppnsApp';
        const user = 'ShthppnsUser';
        const time = new Date().getTime();
        const id = `${appId}-${user}-${time}`;
        const location = this.injector.get(LocationStrategy);
        const url = location instanceof PathLocationStrategy ? location.path() : '';
        const status = error.status || null;
        const message = error.message || error.toString();
        const stack = error instanceof HttpErrorResponse ? null : StackTraceParser.parse(error);

        const errorWithContext = { name, appId, user, time, id, url, status, message, stack };
        return errorWithContext;
    }
}

class FakeHttpService {
    static post(error): Observable<any> {
        console.log('Error sent to the server: ', error);
        return Observable.of(error);
    }
}
