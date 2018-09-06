import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';

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

  public isAuthenticated(): boolean {
    let isAuthenticated = true;
    if (this.tokenService.accessTokenExpired()) {
      isAuthenticated = false;
    } else {
      if (this.tokenService.refreshTokenExpired()) {
        isAuthenticated = false;
        // TODO https://stackoverflow.com/questions/52182600/securing-a-route-to-use-a-refresh-token/52188069
        this.refreshAccessToken()
          .pipe(
            map((response: HttpResponse<any>) => {
              console.log('The access token has been refreshed');
              // TODO How to resend this unauthorized request ?
            })
          );
      }
    }
    return isAuthenticated;
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
          console.log('Got a response from the refresh token request');
          this.storeTokensInLocalStorage(response);
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

  public logout(): Observable<any> {
    return this.httpService.postWithHeadersInResponse(URI_LOGOUT, {})
      .pipe(
        map((response: HttpResponse<any>) => {
        })
      );
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


  /* TODO
    public hasRole(role: string): boolean {
      return KeycloakClientService.auth.authz.tokenParsed.realm_access.roles.indexOf(role) > -1;
    }

    public getRealmRoles(): void {
      return KeycloakClientService.auth.authz.realmAccess.roles;
    }

    public hasRealmRole(role: String): boolean {
      return KeycloakClientService.auth.authz.hasRealmRole(role);
    }

    public getUsername(): string {
      return KeycloakClientService.auth.authz.tokenParsed.preferred_username;
    }

    public getFullName(): string {
      return KeycloakClientService.auth.authz.tokenParsed.name;
    }

    public getToken(): Observable<string> {
      console.log('Getting the retrieved token');
      return new Observable<string>((observer) => {
        if (KeycloakClientService.auth.authz && KeycloakClientService.auth.authz.token) {
          KeycloakClientService.auth.authz
            .updateToken(5) // Refresh the token if it will expire in n seconds or less
            .success(() => {
              observer.next(<string>KeycloakClientService.auth.authz.token);
              observer.complete();
            })
            .error(() => {
              observer.error('Failed to refresh the auth token');
            });
        } else {
          observer.error('The auth token could not be retrieved because the user was not logged in');
        }
      });
    }

    public clearToken(): void {
      KeycloakClientService.auth.authz.clearToken();
    }

    public accountManagement(): void {
      KeycloakClientService.auth.authz.accountManagement();
    }

    public getConfiguration(): object {
      const notAvailable = 'N/A';
      return {
        'authServerUrl': KeycloakClientService.auth.authz.authServerUrl ? KeycloakClientService.auth.authz.authServerUrl : notAvailable,
        'openIdFlow': KeycloakClientService.auth.authz.flow ? KeycloakClientService.auth.authz.flow : notAvailable,
        'openIdResponseMode': KeycloakClientService.auth.authz.responseMode ? KeycloakClientService.auth.authz.responseMode : notAvailable,
        'openIdResponseType': KeycloakClientService.auth.authz.responseType ? KeycloakClientService.auth.authz.responseType : notAvailable,
        'realm': KeycloakClientService.auth.authz.realm ? KeycloakClientService.auth.authz.realm : notAvailable,
        'clientId': KeycloakClientService.auth.authz.clientId ? KeycloakClientService.auth.authz.clientId : notAvailable,
        'timeSkew': KeycloakClientService.auth.authz.timeSkew ? KeycloakClientService.auth.authz.timeSkew : notAvailable
      };
    }

    public loadUserProfile(): any {
      return new Promise((resolve, reject) => {
        KeycloakClientService.auth.authz.loadUserProfile().success((profile) => {
          resolve(<object>profile);
        }).error(() => {
          reject('Failed to retrieve user profile');
        });
      });
    }
  */
}
