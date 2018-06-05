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
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/throw';

import { KeycloakClientService } from './keycloak-client.service';

const AUTH_HEADER_PREFIX = 'Bearer';

@Injectable()
export class KeycloakInterceptor implements HttpInterceptor {

  constructor(private keycloakClientService: KeycloakClientService) { }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return this.addAuthHeader(request, next);
  }

  private addAuthHeader(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('=======>> Intercepting the http request to add the jwt token in the header');
    const tokenPromise: Promise<any> = this.keycloakClientService.getToken();
    const tokenObservable: Observable<any> = Observable.fromPromise(tokenPromise);
    tokenObservable.map(authToken => {
      console.log('Token value: ' + authToken);
      // Clone the request before it is sent to the server
      // as the original request is immutable and cannot be changed
      request = request.clone({
        setHeaders: {
          'Authorization': AUTH_HEADER_PREFIX + authToken
        }
      });
      console.log('=======>> The request has been cloned');
    });

    console.log('Handle the request in the interceptor chain');
    return next.handle(request)
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
