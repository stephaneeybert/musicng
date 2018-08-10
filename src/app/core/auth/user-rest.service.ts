import { Injectable, Injector, NgZone } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpHeaders } from '@angular/common/http';

declare let Keycloak: any;

@Injectable()
export class UserRestService {

  static auth: any = {};

  constructor(private httpClient: HttpClient, private zone: NgZone) { }

  public login(ussername: string, password: string): Observable<any> {
    console.log('Sending the login credentials to obtain a token');
    const credentials = { username: ussername, password: password };
    const url: string = environment.USER_REST_URL + '/login';
    return this.httpClient.post(url, credentials);
  }

/*
  public logout(): void {
    const url: string = environment.USER_REST_URL + '/logout';
    this.httpClient.post(url, ussername);
    window.location.href = KeycloakClientService.auth.logoutUrl;
  }

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
