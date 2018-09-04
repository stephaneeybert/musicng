import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { HttpErrorResponse, HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, Event, NavigationError } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs';

import * as StackTraceParser from 'error-stack-parser';

@Injectable()
export class ErrorService {

    constructor(
        private injector: Injector,
        private router: Router,
        private httpClient: HttpClient,
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

    public log(error) {
        const errorWithContext = this.addContextInfo(error);
        return MockHttpService.post(errorWithContext); // TODO Implement a server side error inbox
    }

    private addContextInfo(error) {
        const appId = 'My API id'; // TODO get an env variable
        const location = this.injector.get(LocationStrategy);
        const url = location instanceof PathLocationStrategy ? location.path() : '';
        const time = new Date().getTime();

        const name = error.name || null;
        const user = ''; // TODO get the logged in user
        const id = `${appId}-${user}-${time}`;
        const status = error.status || null;
        const message = (error && error.body) ? error.body.error : error.toString();
        const stack = error instanceof HttpErrorResponse ? null : error; // TODO StackTraceParser.parse(error);
        const method = (stack && stack[0]) ? stack[0].functionName : null;

        const errorWithContext = { message, method, name, appId, user, time, id, url, status, stack };
        return errorWithContext;
    }

    fireFakeClientError() {
        throw new Error('Another runtime error)');
        // As the 'it' object is not defined, this should produce a runtime error
        // return it.happens;
    }

    fireFakeServerError() {
        this.httpClient
            .get('https://jsonplaceholder.typicode.com/1')
            .subscribe();
    }
}

class MockHttpService {
    static post(error): Observable<any> {
        return of(error);
    }
}
