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
import { TokenService } from './token.service';
import { AuthService } from '../auth/auth.service';

const PATH_LOGIN = 'login';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private refreshTokenInProgress = false;

  // Contains the current refresh token or is null if
  // the refresh is pending and no refresh token is currently available
  private refreshTokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>(
    null
  );

  constructor(
    private authService: TokenService,
    private authUserService: AuthService
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.authUserService.isSecuredUrl(request)) {
      return this.handleRequest(request, next);
    } else {
      return next.handle(request);
    }
  }

  private handleRequest(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    request = this.addAuthenticationAccessToken(request);
    return next.handle(request)
      .pipe(
        tap((response: HttpEvent<any>) => {
          if (response instanceof HttpResponse) {
          }
        }),
        catchError(response => {
          if (response instanceof HttpErrorResponse) {
            if (response.status === 401) {
              if (this.authUserService.isLoginRequest(request)) {
                return throwError(response);
              } else if (this.authUserService.isRefreshTokenRequest(request)) {
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

  private addAuthenticationAccessToken(request): HttpRequest<any> {
    if (!this.authService.getAccessTokenFromLocalStorage()) {
      return request;
    }

    // The origincatchErroral request is immutable and cannot be changed
    return request.clone({
      setHeaders: {
        'Authorization': this.authService.buildTokenValue(),
        // The cache and pragma headers prevent IE from caching GET 200 requests
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
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
