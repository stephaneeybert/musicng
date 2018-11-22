import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { map, tap, catchError } from 'rxjs/operators';
import { of, empty } from 'rxjs';

import { environment } from '../../../environments/environment';
import { HttpService } from '../service/http.service';
import { TokenService } from '../auth/token.service';

const PATH_AUTH = 'auth';
const PATH_LOGIN = 'login';
const URI_LOGIN = environment.BASE_REST_URI + '/' + PATH_AUTH + '/' + PATH_LOGIN;
const PATH_LOGOUT = 'logout';
const URI_LOGOUT = environment.BASE_REST_URI + '/' + PATH_AUTH + '/' + PATH_LOGOUT;
const PATH_TOKEN_REFRESH = 'token-refresh';
const URI_REFRESH_TOKEN = environment.BASE_REST_URI + '/' + PATH_AUTH + '/' + PATH_TOKEN_REFRESH;

@Injectable()
export class AuthService {

  private postLoginRedirectUrl: string;

  constructor(
    private httpService: HttpService,
    private tokenService: TokenService) { }

  public login(username: string, password: string): Observable<any> {
    console.log('Sending the login credentials to obtain a token');
    const credentials = { 'email': username, 'password': password };
    let httpHeaders: HttpHeaders = this.httpService.buildHeader(null);
    httpHeaders = this.addClientIdHeader(httpHeaders);
    return this.httpService.postWithHeadersInResponse(URI_LOGIN, credentials, httpHeaders)
      .pipe(
        map((response: HttpResponse<any>) => {
          this.storeTokensInLocalStorage(response);
        })
      );
  }

  public logout(): Observable<any> {
    return this.httpService.postWithHeadersInResponse(URI_LOGOUT, {})
      .pipe(
        map((response: HttpResponse<any>) => {
          this.clearTokensFromLocalStorage(response);
        })
      );
  }

  public isAuthenticated(): Observable<boolean> {
    if (this.tokenService.accessTokenExpired()) {
      console.log('The access token expired.');
      if (this.tokenService.refreshTokenExpired()) {
        console.log('The refresh token expired.');
        return of(false);
      } else {
        return this.refreshAccessToken()
        .pipe(
          map(response => {
            if (response) {
              console.log('The access token has been refreshed');
              return true;
            }
          }),
          catchError((error, caught) => {
            console.log('The access token could not be refreshed');
            console.log(error);
            return of(false);
          })
        );
      }
    } else {
      return of(true);
    }
  }

  private storeTokensInLocalStorage(response: HttpResponse<any>): void {
    this.storeAccessTokenInLocalStorage(response);
    this.storeRefreshTokenInLocalStorage(response);
  }

  private storeAccessTokenInLocalStorage(response: HttpResponse<any>): void {
    const accessTokenHeader = response.headers.get(this.tokenService.getAccessTokenHeaderName());
    if (null != accessTokenHeader) {
      const accessToken = this.tokenService.extractTokenFromHeaderValue(accessTokenHeader);
      if (null != accessToken) {
        console.log('Storing the access token from the response header: ' + accessToken);
        this.tokenService.setAccessTokenToLocalStorage(accessToken);
      }
    }
  }

  private storeRefreshTokenInLocalStorage(response: HttpResponse<any>): void {
    const name = this.tokenService.getRefreshTokenHeaderName();
    const refreshTokenHeader = response.headers.get(this.tokenService.getRefreshTokenHeaderName());
    if (null != refreshTokenHeader) {
      const refreshToken = this.tokenService.extractTokenFromHeaderValue(refreshTokenHeader);
      if (null != refreshToken) {
        console.log('Storing the refresh token from the response header: ' + refreshToken);
        this.tokenService.setRefreshTokenToLocalStorage(refreshToken);
      }
    }
  }

  private clearTokensFromLocalStorage(response: HttpResponse<any>): void {
    this.tokenService.setAccessTokenToLocalStorage('');
    this.tokenService.setRefreshTokenToLocalStorage('');
  }

  private addRefreshTokenHeader(httpHeaders: HttpHeaders): HttpHeaders {
    const refreshHeaderName: string = this.tokenService.getRefreshTokenHeaderName();
    const refreshToken: string = this.tokenService.buildRefreshTokenValue();
    httpHeaders = httpHeaders.append(refreshHeaderName, refreshToken);
    return httpHeaders;
  }

  private addClientIdHeader(httpHeaders: HttpHeaders): HttpHeaders {
    const clientIdHeaderName: string = this.tokenService.getClientIdHeaderName();
    const clientId: string = environment.CLIENT_ID;
    httpHeaders = httpHeaders.append(clientIdHeaderName, clientId);
    return httpHeaders;
  }

  public refreshAccessToken(): Observable<any> {
    console.log('Sending the refresh token to obtain a new access token');
    let httpHeaders: HttpHeaders = this.httpService.buildHeader(null);
    httpHeaders = this.addRefreshTokenHeader(httpHeaders);
    httpHeaders = this.addClientIdHeader(httpHeaders);

    return this.httpService.postWithHeadersInResponse(URI_REFRESH_TOKEN, {}, httpHeaders)
      .pipe(
        map((response: HttpResponse<any>) => {
          // Only the access token is refreshed
          // Refresing the refresh token would be like giving a never expiring refresh token
          this.storeAccessTokenInLocalStorage(response);
          console.log('Stored the refreshed access token in the local storage');
          return true;
        })
      );
  }

  public isLoginRequest(request: HttpRequest<any>) {
    return request.url.includes(PATH_LOGIN);
  }

  public isRefreshTokenRequest(request: HttpRequest<any>) {
    return request.url.includes(PATH_TOKEN_REFRESH);
  }

  public isSecuredUrl(request: HttpRequest<any>) {
    if (request.url.match(URI_LOGIN) || request.url.match(URI_REFRESH_TOKEN)) {
      return false;
    } else {
      return true;
    }
  }

  public rememberMe(): boolean {
    return true; // TODO Implement the remember me
  }

  public addAccessTokenToClonedRequest(request: HttpRequest<any>): HttpRequest<any> {
    const accessTokenHeaderName: string = this.tokenService.getAccessTokenHeaderName();
    return request.clone({
      setHeaders: {
        [accessTokenHeaderName]: this.tokenService.buildAccessTokenValue(),
        // The cache and pragma headers prevent IE from caching GET 200 requests
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
  }

  public setPostLoginRedirectUrl(postLoginRedirectUrl: string) {
    this.postLoginRedirectUrl = postLoginRedirectUrl;
  }

  public getPostLoginRedirectUrl() {
    return this.postLoginRedirectUrl;
  }

}
