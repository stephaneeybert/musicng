import { Injectable, Injector } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

// See https://github.com/auth0/angular2-jwt

const ACCESS_TOKEN_NAME: string = 'accessToken';
const REFRESH_TOKEN_NAME: string = 'refreshToken';
const ACCESS_TOKEN_HEADER_NAME: string = 'Authorization';
const AUTH_BEARER_HEADER: string = 'Bearer';
const REFRESH_TOKEN_HEADER_NAME: string = 'TokenRefresh';
const CLIENT_ID_HEADER_NAME: string = 'ClientId';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  // See https://stackoverflow.com/questions/49240232/getting-a-cyclic-dependency-error
  jwtHelperService = new JwtHelperService();
  constructor() {
    if (!window.localStorage) {
      throw new Error('The browser does not support local storage.');
    }
  }
  // constructor(private jwtHelperService: JwtHelperService) {}

  public accessTokenExpired(): boolean {
    const token: string = this.getAccessTokenFromLocalStorage();
    return (!token || this.jwtHelperService.isTokenExpired(token));
  }

  public refreshTokenExpired(): boolean {
    const token: string = this.getRefreshTokenFromLocalStorage();
    return (!token || this.jwtHelperService.isTokenExpired(token));
  }

  public getAccessTokenExpirationDate(): Date | null {
    const token: string = this.getAccessTokenFromLocalStorage();
    return this.jwtHelperService.getTokenExpirationDate(token);
  }

  public getDecodedAccessToken() {
    const token: string = this.getAccessTokenFromLocalStorage();
    return this.jwtHelperService.decodeToken(token);
  }

  public getAccessTokenFromLocalStorage(): string {
    const token: string | null = localStorage.getItem(ACCESS_TOKEN_NAME);
    if (token != null) {
      return token;
    } else {
      return '';
    }
  }

  public setAccessTokenToLocalStorage(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_NAME, token);
  }

  public getRefreshTokenFromLocalStorage(): string {
    const token: string | null = localStorage.getItem(REFRESH_TOKEN_NAME);
    if (token != null) {
      return token;
    } else {
      return '';
    }
  }

  public setRefreshTokenToLocalStorage(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_NAME, token);
  }

  public extractTokenFromHeaderValue(header: string): string {
    if (header.startsWith(AUTH_BEARER_HEADER)) {
      return header.substring(7, header.length);
    } else {
      return '';
    }
  }

  public buildAccessTokenValue(): string {
    return AUTH_BEARER_HEADER + ' ' + this.getAccessTokenFromLocalStorage();
  }

  public buildRefreshTokenValue(): string {
    return AUTH_BEARER_HEADER + ' ' + this.getRefreshTokenFromLocalStorage();
  }

  public getAccessTokenHeaderName(): string {
    return ACCESS_TOKEN_HEADER_NAME;
  }

  public getRefreshTokenHeaderName(): string {
    return REFRESH_TOKEN_HEADER_NAME;
  }

  public getClientIdHeaderName(): string {
    return CLIENT_ID_HEADER_NAME;
  }

}
