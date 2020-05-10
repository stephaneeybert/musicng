import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { environment } from '@env/environment';
import { TokenService } from '@app/core/auth/token.service';
import { User } from '@app/views/user/user';
import { HttpService } from '@stephaneeybert/lib-core';

const PATH_AUTH: string = 'auth';
const PATH_LOGIN: string = 'login';
const URI_LOGIN: string = environment.BASE_REST_URI + '/' + PATH_AUTH + '/' + PATH_LOGIN;
const PATH_LOGOUT: string = 'logout';
const URI_LOGOUT: string = environment.BASE_REST_URI + '/' + PATH_AUTH + '/' + PATH_LOGOUT;
const PATH_TOKEN_REFRESH: string = 'token-refresh';
const URI_REFRESH_TOKEN: string = environment.BASE_REST_URI + '/' + PATH_AUTH + '/' + PATH_TOKEN_REFRESH;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private postLoginRedirectUrl: string = '';

  constructor(
    private httpService: HttpService,
    private tokenService: TokenService) { }

  public setPostLoginRedirectUrl(postLoginRedirectUrl: string): void {
    this.postLoginRedirectUrl = postLoginRedirectUrl;
  }

  public getPostLoginRedirectUrl() {
    return this.postLoginRedirectUrl;
  }

  public login(username: string, password: string): Observable<HttpResponse<User>> {
    console.log('Sending the login credentials to obtain a token');
    const credentials: any = { 'email': username, 'password': password };
    let httpHeaders: HttpHeaders = this.httpService.buildHeader();
    httpHeaders = this.addClientIdHeader(httpHeaders);
    return this.httpService.postWithHeadersInResponse<HttpResponse<User>>(URI_LOGIN, credentials, httpHeaders)
      .pipe(
        map((response: HttpResponse<User>) => {
          this.storeTokensInLocalStorage(response);
          return response;
        })
      );
  }

  public logOut(): void {
    // TODO Implement a log out
  }

  public logout$(): Observable<HttpResponse<User>> {
    return this.httpService.postWithHeadersInResponse<HttpResponse<User>>(URI_LOGOUT, {})
      .pipe(
        map((response: HttpResponse<User>) => {
          this.clearTokensFromLocalStorage(response);
          return response;
        })
      );
  }

  public isAuthenticated$(): Observable<boolean> {
    if (this.tokenService.accessTokenExpired()) {
      console.log('The access token expired.');
      if (this.tokenService.refreshTokenExpired()) {
        console.log('The refresh token expired.');
        return of(false);
      } else {
        return this.refreshAccessToken$()
          .pipe(
            map((response: boolean) => {
              if (response) {
                console.log('The access token has been refreshed');
                return true;
              } else {
                return false;
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

  private storeTokensInLocalStorage(response: HttpResponse<User>): void {
    this.storeAccessTokenInLocalStorage(response);
    this.storeRefreshTokenInLocalStorage(response);
  }

  private storeAccessTokenInLocalStorage(response: HttpResponse<User>): void {
    const accessTokenHeader: any = response.headers.get(this.tokenService.getAccessTokenHeaderName());
    if (null != accessTokenHeader) {
      const accessToken: any = this.tokenService.extractTokenFromHeaderValue(accessTokenHeader);
      if (null != accessToken) {
        console.log('Storing the access token from the response header: ' + accessToken);
        this.tokenService.setAccessTokenToLocalStorage(accessToken);
      }
    }
  }

  private storeRefreshTokenInLocalStorage(response: HttpResponse<User>): void {
    const refreshTokenHeader: any = response.headers.get(this.tokenService.getRefreshTokenHeaderName());
    if (null != refreshTokenHeader) {
      const refreshToken: any = this.tokenService.extractTokenFromHeaderValue(refreshTokenHeader);
      if (null != refreshToken) {
        console.log('Storing the refresh token from the response header: ' + refreshToken);
        this.tokenService.setRefreshTokenToLocalStorage(refreshToken);
      }
    }
  }

  private clearTokensFromLocalStorage(response: HttpResponse<User>): void {
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

  public refreshAccessToken$(): Observable<boolean> {
    console.log('Sending the refresh token to obtain a new access token');
    let httpHeaders: HttpHeaders = this.httpService.buildHeader();
    httpHeaders = this.addRefreshTokenHeader(httpHeaders);
    httpHeaders = this.addClientIdHeader(httpHeaders);

    return this.httpService.postWithHeadersInResponse<HttpResponse<User>>(URI_REFRESH_TOKEN, {}, httpHeaders)
      .pipe(
        map((response: HttpResponse<User>) => {
          // Only the access token is refreshed
          // Refresing the refresh token would be like giving a never expiring refresh token
          this.storeAccessTokenInLocalStorage(response);
          console.log('Stored the refreshed access token in the local storage');
          return true;
        })
      );
  }

  public isLoginRequest(request: HttpRequest<User>): boolean {
    return request.url.includes(PATH_LOGIN);
  }

  public isRefreshTokenRequest(request: HttpRequest<User>): boolean {
    return request.url.includes(PATH_TOKEN_REFRESH);
  }

  public isSecuredUrl(request: HttpRequest<User>): boolean {
    if (request.url.match(URI_LOGIN) || request.url.match(URI_REFRESH_TOKEN)) {
      return false;
    } else {
      return true;
    }
  }

  public rememberMe(): boolean {
    return true; // TODO Implement the remember me
  }

  public addAccessTokenToClonedRequest(request: HttpRequest<User>): HttpRequest<User> {
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

}
