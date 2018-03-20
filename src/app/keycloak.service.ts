import {Injectable} from '@angular/core';
import {environment} from '../environments/environment';
import {Observable} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';

declare let Keycloak: any;

@Injectable()
export class KeycloakService {

  static auth: any = {};

  constructor(private httpClient: HttpClient) {}

  static init(): Promise<any> {
    const keycloakAuth: any = Keycloak({
      url: environment.KEYCLOAK_URL,
      realm: environment.KEYCLOAK_REALM,
      clientId: environment.KEYCLOAK_CLIENTID,
      'ssl-required': 'external',
      'public-client': true
    });

    KeycloakService.auth.loggedIn = false;

    return new Promise((resolve, reject) => {
      keycloakAuth.init({onLoad: 'check-sso'})
        .success(() => {
          console.log('The keycloak client has been initiated successfully');
          KeycloakService.auth.loggedIn = true;
          KeycloakService.auth.authz = keycloakAuth;
          KeycloakService.auth.logoutUrl = environment.KEYCLOAK_URL
            + '/realms/' + environment.KEYCLOAK_REALM + '/protocol/openid-connect/logout?redirect_uri='
            + document.baseURI;
          resolve();
        })
        .error(() => {
          reject();
        });
    });
  }

  static hasRole(role: string): boolean {
    return KeycloakService.auth.authz.tokenParsed.realm_access.roles.indexOf(role) > -1;
  }

  static getUsername(): string {
    return KeycloakService.auth.authz.tokenParsed.preferred_username;
  }

  static getFullName(): string {
    return KeycloakService.auth.authz.tokenParsed.name;
  }

  public login(ussername: string, password: string): Observable<any> {
    console.log('Sending the login credentials to obtain a token');
    const credentials = {username: ussername, password: password};
    const url: string = environment.KEYCLOAK_URL + '/realms/' + environment.KEYCLOAK_REALM
      + '/protocol/openid-connect/token/generate-token';
    return this.httpClient.post(url, credentials);
  }

  public logout(): void {
    KeycloakService.auth.loggedIn = false;
    KeycloakService.auth.authz = null;
    window.location.href = KeycloakService.auth.logoutUrl;
  }

  public getToken(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (KeycloakService.auth.authz && KeycloakService.auth.authz.token) {
        KeycloakService.auth.authz
          .updateToken(5) // Refresh the token if it will expire in n seconds or less
          .success(() => {
            resolve(<string>KeycloakService.auth.authz.token);
          })
          .error(() => {
            reject('Failed to refresh the auth token');
          });
      } else {
        reject('The auth token could not be retrieved because the user was not logged in');
      }
    });
  }

}
