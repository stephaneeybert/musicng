import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/retry';

// Because the best Error is the one that never happens, improve the error handling
// using an HttpInterceptor to intercept all the server calls and retry them n times
// before throwing an error

const NB_RETRIES = 5;

@Injectable()
export class ErrorServerInterceptor implements HttpInterceptor {

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).retry(NB_RETRIES);
    }
}
