import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { of, throwError } from 'rxjs';
import { retryWhen, switchMap, delay, take, concat } from 'rxjs/operators';

import { ErrorCustomHandler } from './error-custom-handler';

// Because the best error is the one that never happens, improve the error handling
// using an HttpInterceptor to intercept all the server calls and retry them n times
// before throwing an error
const NB_RETRIES = 3;
const HTTP_SERVER_ERROR = /^5.*$/;

@Injectable()
export class ErrorRequestInterceptor implements HttpInterceptor {

    constructor(
        private errorCustomHandler: ErrorCustomHandler
    ) { }

    // TODO https://stackoverflow.com/questions/51999929
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            retryWhen(errors => {
                return errors
                    .pipe(
                        switchMap(error => {
                            if (this.isServerError(error)) {
                                return of(error)
                                    .pipe(
                                        delay(200)
                                    );
                            } else {
                                return throwError(error);
                            }
                        })
                    )
                    .pipe(
                        take(NB_RETRIES)
                    )
                    .pipe(
                        concat(
                            throwError({ error: 'There was a server error (after ' + NB_RETRIES + ' retries)' })
                        )
                    );
            })
        );
    }

    private isServerError(error: any): boolean {
        return HTTP_SERVER_ERROR.test((String(error.status.toString)));
    }
}
