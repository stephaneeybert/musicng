import { Injectable, Injector } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

// See https://github.com/auth0/angular2-jwt

const ACCESS_TOKEN_NAME = 'accessToken';
const REFRESH_TOKEN_NAME = 'refreshToken';
const ACCESS_TOKEN_HEADER_NAME = 'Authorization';
const AUTH_BEARER_HEADER = 'Bearer';
const REFRESH_TOKEN_HEADER_NAME = 'TokenRefresh';
const CLIENT_ID_HEADER_NAME = 'ClientId';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  // See https://stackoverflow.com/questions/49240232/getting-a-cyclic-dependency-error
  jwtHelperService = new JwtHelperService();
  constructor() { }
  // constructor(private jwtHelperService: JwtHelperService) {}

  public accessTokenExpired(): boolean {
    const token = this.getAccessTokenFromLocalStorage();
    return (!token || this.jwtHelperService.isTokenExpired(token));
  }

  public refreshTokenExpired(): boolean {
    const token = this.getRefreshTokenFromLocalStorage();
    return (!token || this.jwtHelperService.isTokenExpired(token));
  }

  public getAccessTokenExpirationDate() {
    const token = this.getAccessTokenFromLocalStorage();
    return this.jwtHelperService.getTokenExpirationDate(token);
  }

  public getDecodedAccessToken() {
    const token = this.getAccessTokenFromLocalStorage();
    return this.jwtHelperService.decodeToken(token);
  }

  public getAccessTokenFromLocalStorage(): string {
    return localStorage.getItem(ACCESS_TOKEN_NAME);
  }

  public setAccessTokenToLocalStorage(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_NAME, token);
  }

  public getRefreshTokenFromLocalStorage(): string {
    return localStorage.getItem(REFRESH_TOKEN_NAME);
  }

  public setRefreshTokenToLocalStorage(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_NAME, token);
  }

  public extractTokenFromHeaderValue(header: string): string {
    if (header.startsWith(AUTH_BEARER_HEADER)) {
      return header.substring(7, header.length);
    } else {
      return null;
    }
  }

  public buildAccessTokenValue(): string {
    return AUTH_BEARER_HEADER + ' ' + this.getAccessTokenFromLocalStorage();
  }

  public buildRefreshTokenValue(): string {
    return AUTH_BEARER_HEADER + ' ' + this.getRefreshTokenFromLocalStorage();
  }

  public getAccessTokenHeaderName() {
    return ACCESS_TOKEN_HEADER_NAME;
  }

  public getRefreshTokenHeaderName() {
    return REFRESH_TOKEN_HEADER_NAME;
  }

  public getClientIdHeaderName() {
    return CLIENT_ID_HEADER_NAME;
  }

}
