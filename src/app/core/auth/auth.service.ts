import { Injectable, Injector } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';


// See https://github.com/auth0/angular2-jwt

const JWT_TOKEN_NAME = 'token';
const AUTH_HEADER_NAME = 'Authorization';
const AUTH_HEADER_PREFIX = 'Bearer';

@Injectable()
export class AuthService {

  // See https://stackoverflow.com/questions/49240232/getting-a-cyclic-dependency-error
  jwtHelperService = new JwtHelperService();
  constructor() { }
  // constructor(private jwtHelperService: JwtHelperService) {}

  public isAuthenticated(): boolean {
    const token = this.getJwtTokenFromLocalStorage();
    return (token && !this.jwtHelperService.isTokenExpired(token));
  }

  public getTokenExpirationDate() {
    const token = this.getJwtTokenFromLocalStorage();
    return this.jwtHelperService.getTokenExpirationDate(token);
  }

  public getDecodedToken() {
    const token = this.getJwtTokenFromLocalStorage();
    return this.jwtHelperService.decodeToken(token);
  }

  public getJwtTokenFromLocalStorage(): string {
    return localStorage.getItem(JWT_TOKEN_NAME);
  }

  public setJwtTokenToLocalStorage(token: string): void {
    localStorage.setItem(JWT_TOKEN_NAME, token);
  }

  public extractTokenFromHeader(header: string): string {
    if (header.startsWith(AUTH_HEADER_PREFIX)) {
      return header.substring(7, header.length);
    } else {
      return null;
    }
  }

  private buildHeader(token: string): string {
    return AUTH_HEADER_PREFIX + ' ' + this.getJwtTokenFromLocalStorage();
  }

  public buildTokenHeader(): string {
    return this.buildHeader(this.getJwtTokenFromLocalStorage());
  }

  public getHeaderName() {
    return AUTH_HEADER_NAME;
  }

  public getJwtTokenName(): string {
    return JWT_TOKEN_NAME;
  }

}
