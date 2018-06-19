import { Injectable, Injector, NgZone } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpHeaders } from '@angular/common/http';

declare let Keycloak: any;

@Injectable()
export class KeycloakClientService {

  static auth: any = {};

  constructor(private httpClient: HttpClient, private zone: NgZone) { }

  public init(): Observable<any> {
    KeycloakClientService.auth.loggedIn = false;
    return new Observable((observer) => {
      const keycloakConfig = {
        'url': environment.KEYCLOAK_URL,
        'realm': environment.KEYCLOAK_REALM,
        'clientId': environment.KEYCLOAK_CLIENTID,
        'ssl-required': 'external',
        'public-client': true
      };
      const keycloakAuth: any = new Keycloak(keycloakConfig);

      keycloakAuth.init({ onLoad: 'check-sso' })
        .success(() => {
          KeycloakClientService.auth.loggedIn = true;
          KeycloakClientService.auth.authz = keycloakAuth;
          KeycloakClientService.auth.logoutUrl = environment.KEYCLOAK_URL
            + '/realms/' + environment.KEYCLOAK_REALM + '/protocol/openid-connect/logout?redirect_uri='
            + document.baseURI;
          console.log('The keycloak auth has been initialized');
          observer.next('Succeeded in initiating the keycloak client');
          observer.complete();
        })
        .error(() => {
          console.log('The keycloak client could not be initiated');
          observer.error('Failed to initiate the keycloak client');
        });
    });
  }

  public login(ussername: string, password: string): Observable<any> {
    console.log('Sending the login credentials to obtain a token');
    const credentials = { username: ussername, password: password };
    const url: string = environment.KEYCLOAK_URL + '/realms/' + environment.KEYCLOAK_REALM
      + '/protocol/openid-connect/token/generate-token';
    return this.httpClient.post(url, credentials);
  }

  public logout(): void {
    KeycloakClientService.auth.loggedIn = false;
    KeycloakClientService.auth.authz = null;
    window.location.href = KeycloakClientService.auth.logoutUrl;
  }

  public hasRole(role: string): boolean {
    return KeycloakClientService.auth.authz.tokenParsed.realm_access.roles.indexOf(role) > -1;
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

}
