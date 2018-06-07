import {Injectable, Injector} from '@angular/core';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs/Observable';
import {HttpClient, HttpHeaders} from '@angular/common/http';

declare let Keycloak: any;

@Injectable()
export class KeycloakClientService {

  static auth: any = {};

  constructor(private httpClient: HttpClient) {}

  static init(): Promise<any> {
    KeycloakClientService.auth.loggedIn = false;
    return new Promise((resolve, reject) => {
      const keycloakConfig = {
      url: environment.KEYCLOAK_URL,
      realm: environment.KEYCLOAK_REALM,
      clientId: environment.KEYCLOAK_CLIENTID,
      'ssl-required': 'external',
      'public-client': true
      };
      const keycloakAuth: any = new Keycloak(keycloakConfig);

      keycloakAuth.init({onLoad: 'check-sso'})
        .success(() => {
          KeycloakClientService.auth.loggedIn = true;
          KeycloakClientService.auth.authz = keycloakAuth;
          KeycloakClientService.auth.logoutUrl = environment.KEYCLOAK_URL
          + '/realms/' + environment.KEYCLOAK_REALM + '/protocol/openid-connect/logout?redirect_uri='
          + document.baseURI;
          console.log('=======>> The keycloak client has been initiated successfully');
          resolve('Succeeded in initiating the keycloak client');
        })
        .error(() => {
          reject('Failed to initiate the keycloak client');
        });
    });
  }

  static hasRole(role: string): boolean {
    return KeycloakClientService.auth.authz.tokenParsed.realm_access.roles.indexOf(role) > -1;
  }

  static getUsername(): string {
    return KeycloakClientService.auth.authz.tokenParsed.preferred_username;
  }

  static getFullName(): string {
    return KeycloakClientService.auth.authz.tokenParsed.name;
  }

  public login(ussername: string, password: string): Observable<any> {
    console.log('=======>> Sending the login credentials to obtain a token');
    const credentials = {username: ussername, password: password};
    const url: string = environment.KEYCLOAK_URL + '/realms/' + environment.KEYCLOAK_REALM
      + '/protocol/openid-connect/token/generate-token';
    return this.httpClient.post(url, credentials);
  }

  public logout(): void {
    KeycloakClientService.auth.loggedIn = false;
    KeycloakClientService.auth.authz = null;
    window.location.href = KeycloakClientService.auth.logoutUrl;
  }

  public getToken(): Promise<string> {
    console.log('=======>> Get the retrieved token');
    return new Promise<string>((resolve, reject) => {
      if (KeycloakClientService.auth.authz && KeycloakClientService.auth.authz.token) {
        KeycloakClientService.auth.authz
          .updateToken(5) // Refresh the token if it will expire in n seconds or less
          .success(() => {
            resolve(<string>KeycloakClientService.auth.authz.token);
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
