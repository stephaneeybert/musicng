import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpResponse,
  HttpErrorResponse,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

import { environment } from '../../../environments/environment';
import { KeycloakClientService } from './keycloak-client.service';

const AUTH_HEADER_PREFIX = 'Bearer';
const URI_ROOT = environment.USER_REST_URL;
const URI_CREDENTIALS = URI_ROOT + '/login';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private keycloakClientService: KeycloakClientService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isSecuredUrl(request)) {
      return this.addAuthHeader(request, next);
    } else {
      return next.handle(request);
    }
  }

  private isSecuredUrl(request: HttpRequest<any>) {
    if (request.url.match(URI_CREDENTIALS)) {
      return false;
    } else {
      return true;
    }
  }

  private addAuthHeader(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!request.headers.has('Content-Type')) {
      request = request.clone({ headers: request.headers.set('Content-Type', 'application/json') });
    }

    console.log('=======>> Intercepting the http request to add the jwt token in the header');
    const authToken = 'dummy'; // TODO this.authService.getToken();
    const authHeader = 'Bearer ' + authToken;
    console.log('Token value: ' + authToken);
    // Clone the request before it is sent to the server
    // as the original request is immutable and cannot be changed
    // Clone the request before adding the new header so as to have
    // a fresh copy of the request thus avoiding headers being added multiple times
    // The cache and pragma headers prevent IE from caching GET 200 requests
    const clonedRequest = request.clone({
      setHeaders: {
        'Authorization': AUTH_HEADER_PREFIX + authToken,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
        // 'X-Requested-With': 'XMLHttpRequest'
      }
    });
    console.log('=======>> The request has been cloned');

    return next.handle(clonedRequest)
    .catch(response => {
      if (response instanceof HttpErrorResponse) {
        if (response.status === 401) {
          // TODO redirect to the login route or show a modal
        }
        console.log('The error has been handled by the interceptor', response);
      }
      return Observable.throw(response);
    })
    .do((response: HttpEvent<any>) => {
      if (response instanceof HttpResponse) {
        console.log('The response has been handled by the interceptor', response);
      }
    });
  }

}
