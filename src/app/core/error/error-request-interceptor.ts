import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpResponse,
    HttpErrorResponse,
} from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/retry';
import 'rxjs/add/operator/retryWhen';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/concat';

import { ErrorCustomHandler } from './error-custom-handler';
import { catchError } from 'rxjs/operators';

// Because the best Error is the one that never happens, improve the error handling
// using an HttpInterceptor to intercept all the server calls and retry them n times
// before throwing an error
const NB_RETRIES = 3;
const HTTP_SERVER_ERROR = /^5.*$/;

@Injectable()
export class ErrorRequestInterceptor implements HttpInterceptor {

    constructor(
        private errorCustomHandler: ErrorCustomHandler
    ) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).retryWhen(errors => {
            return errors.switchMap(error => {
                if (this.isServerError(error)) {
                    return Observable.of(error).delay(200);
                } else {
                    return Observable.throw(error);
                }
            })
            .take(NB_RETRIES)
            .concat(Observable.throw({error: 'There was a server error (after ' + NB_RETRIES + ' retries)'}));
        });
    }
    // TODO https://stackoverflow.com/questions/51999929
    // intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    //     return next.handle(request).retry(NB_RETRIES).do((event: HttpEvent<any>) => { }, (error: any) => {
    //         const isServerError: boolean = this.isServerError(error);
    //         if (error instanceof HttpErrorResponse && isServerError) {
    //             this.errorCustomHandler.handleError(error);
    //         }
    //     });
    // }

    private isServerError(error): boolean {
        return HTTP_SERVER_ERROR.test((error.status.toString()));
    }
}
