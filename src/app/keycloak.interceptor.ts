import {Injectable} from '@angular/core';
import {
  HttpRequest,
  HttpResponse,
  HttpErrorResponse,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';

import {KeycloakService} from './keycloak.service';

const AUTH_HEADER_PREFIX = 'Bearer';

@Injectable()
export class KeycloakInterceptor implements HttpInterceptor {

  constructor(private keycloakService: KeycloakService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return Observable.fromPromise(this.addAuthHeader(request, next));
  }

  private async addAuthHeader(request: HttpRequest<any>, next: HttpHandler): Promise<HttpEvent<any>> {
    console.log('Intercepting the http request to add the jwt token in the header');
    const tokenPromise: Promise<any> = this.keycloakService.getToken();
    const tokenObservable: Observable<any> = Observable.fromPromise(tokenPromise);
    tokenObservable.map(authToken => {
      console.log('Token value: ' + authToken);
      request = request.clone({
        setHeaders: {
          'Authorization': AUTH_HEADER_PREFIX + authToken
        }
      });
      console.log('The request has been cloned');
    });
//      return next.handle(request).do((event: HttpEvent<any>) => {
//      if (event instanceof HttpResponse) {
//        console.log('The response has been handled by the interceptor');
//      }
//    }, (err: any) => {
//      if (err instanceof HttpErrorResponse) {
//        if (err.status === 401) {
//          // redirect to the login route
//          // or show a modal
//        }
//      }
//    });
    console.log('Handle the request in the interceptor chain');
    return next.handle(request)
//      .catch((error, caught) => {
//        if (error.status === 401) {
//          authService.removeTokens();
//          this.router.navigate(['/public']);
//          return Observable.throw(error);
//        }
//      })
      .toPromise();
  }

}
