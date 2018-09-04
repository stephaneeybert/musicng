import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { HttpService } from '../service/http.service';
import { TokenService } from '../auth/token.service';

const PATH_AUTH = 'auth';
const PATH_LOGIN = 'login';
const URI_LOGIN = environment.BASE_REST_URI + '/' + PATH_AUTH + '/' + PATH_LOGIN;
const PATH_LOGOUT = 'logout';
const URI_LOGOUT = environment.BASE_REST_URI + '/' + PATH_AUTH + '/' + PATH_LOGOUT;
const PATH_REFRESH_TOKEN = 'token-refresh';
const URI_REFRESH_TOKEN = environment.BASE_REST_URI + '/' + PATH_AUTH + '/' + PATH_REFRESH_TOKEN;

@Injectable()
export class AuthService {

  constructor(
    private httpService: HttpService,
    private tokenService: TokenService) { }

  public login(username: string, password: string): Observable<any> {
    console.log('Sending the login credentials to obtain a token');
    const credentials = { 'email': username, 'password': password };
    return this.httpService.postWithHeadersInResponse(URI_LOGIN, credentials)
      .pipe(
        map((response: HttpResponse<any>) => {
          const header = response.headers.get(this.authService.getAccessTokenHeaderName());
          const token = this.authService.extractTokenFromHeaderValue(header);
          console.log('The token from the response header: ' + token);
          this.authService.setAccessTokenToLocalStorage(token);
        })
      );
  }

  public refreshAccessToken(refreshToken): Observable<any> {
    console.log('Sending the refresh token to obtain a new access token');
    return this.httpService.postWithHeadersInResponse(URI_REFRESH_TOKEN, refreshToken)
      .pipe(
        map((response: HttpResponse<any>) => {
        })
      );
  }

  public isLoginRequest(request: HttpRequest<any>) {
    return request.url.includes(PATH_LOGIN);
  }

  public isRefreshTokenRequest(request: HttpRequest<any>) {
    return request.url.includes(PATH_REFRESH_TOKEN);
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
