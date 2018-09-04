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
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { tap, catchError, take, filter, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { AuthUserService } from '../auth/auth-user.service';

const PATH_LOGIN = 'login';
const URI_LOGIN = environment.BASE_REST_URI + '/users/' + PATH_LOGIN;
const PATH_REFRESH_TOKEN = 'refresh-token';
const URI_REFRESH_TOKEN = environment.BASE_REST_URI + '/users/' + PATH_REFRESH_TOKEN;

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private refreshTokenInProgress = false;

  // Contains the current refresh token or is null if
  // the refresh is pending and no refresh token is currently available
  private refreshTokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>(
    null
  );

  constructor(
    private authService: AuthService,
    private authUserService: AuthUserService
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isSecuredUrl(request)) {
      return this.handleRequest(request, next);
    } else {
      return next.handle(request);
    }
  }

  private isSecuredUrl(request: HttpRequest<any>) {
    if (request.url.match(URI_LOGIN)) {
      return false;
    } else {
      return true;
    }
  }

  private handleRequest(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    request = this.addAuthenticationToken(request);
    return next.handle(request)
      .pipe(
        tap((response: HttpEvent<any>) => {
          if (response instanceof HttpResponse) {
            console.log('The response has been handled by the interceptor', response);
          }
        }),
        catchError(response => {
          if (response instanceof HttpErrorResponse) {
            if (response.status === 401) {
              if (request.url.includes(PATH_LOGIN)) {
                return throwError(response);
              } else if (request.url.includes(PATH_REFRESH_TOKEN)) {
                // this.auth.logout(); // TODO
                return throwError(response);
              } else {
                if (this.refreshTokenInProgress) {
                  // return this.refreshTokenSubject
                  //   .pipe(
                  //     filter(result => result !== null),
                  //     take(1),
                  //     switchMap(() => {
                  //       next.handle(this.addAuthenticationToken(request));
                  //     })
                  //   );
                } else {
                  this.refreshTokenInProgress = true;
                  // Reset the refresh token subject to null so that subsequent
                  // requests will wait until the new refresh token has been retrieved
                  this.refreshTokenSubject.next(null);
                  // return this.authUserService.refreshAccessToken()
                  // .switchMap((token: any) => {
                  //   this.refreshTokenInProgress = false;
                  //   this.refreshTokenSubject.next(token);
                  //   return next.handle(this.addAuthenticationToken(request));
                  // })
                  // .catch((err: any) => {
                  //   this.refreshTokenInProgress = false;
                  //   // this.auth.logout();
                  //   return throwError(error);
                  // });
                }
              }
            } else if (response.status === 400) {
              if (response.error && response.error.error === 'invalid token') {
                // this.logout();
              }
            }
          }
          return throwError(response);
        })
      );
  }

  private addAuthenticationToken(request): HttpRequest<any> {
    if (!this.authService.getJwtTokenFromLocalStorage()) {
      return request;
    }

    // The origincatchErroral request is immutable and cannot be changed
    return request.clone({
      setHeaders: {
        'Authorization': this.authService.buildTokenHeader(),
        // The cache and pragma headers prevent IE from caching GET 200 requests
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
        // 'X-Requested-With': 'XMLHttpRequest' TODO
      }
    });
  }

  // private handle401(request: HttpRequest<any>, next: HttpHandler, user: any) {
  //   if (!this.isRefreshingToken) {
  //     this.isRefreshingToken = true;
  //     this.tokenSubject.next(null);
  //     return this.tokenService.refresh(user.refreshToken)
  //       .switchMap(refreshResponse => {
  //         if (refreshResponse) {
  //           this.authService.setUser(refreshResponse.id_token, refreshResponse.access_token, refreshResponse.refresh_token);
  //           this.tokenSubject.next(refreshResponse.access_token);
  //           return next.handle(this.addToken(request, next, refreshResponse.access_token));
  //         }
  //         else {
  //           //no token came back. probably should just log user out.
  //         }
  //       })
  //       .finally(() => {
  //         this.isRefreshingToken = false;
  //       });
  //   } else {
  //     return this.tokenSubject
  //       .filter(token => token != null)
  //       .take(1)
  //       .switchMap(token => {
  //         return next.handle(this.addToken(request, next, token));
  //       });
  //   }
  // }

}
