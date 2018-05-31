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
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/retry';

import { ErrorCustomHandler } from './error-custom-handler';

// Because the best Error is the one that never happens, improve the error handling
// using an HttpInterceptor to intercept all the server calls and retry them n times
// before throwing an error
const NB_RETRIES = 5;

@Injectable()
export class ErrorRequestInterceptor implements HttpInterceptor {

    constructor(
        private errorCustomHandler: ErrorCustomHandler
    ) {
        console.log('In the constructor of error request interceptor');
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).retry(NB_RETRIES).do((event: HttpEvent<any>) => { }, (error: any) => {
            if (error instanceof HttpErrorResponse) {
                this.errorCustomHandler.handleError(error);
            }
        });
    }
}
