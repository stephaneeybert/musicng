import {Injectable, Injector} from '@angular/core';
import {JwtHelperService} from '@auth0/angular-jwt';

const JWT_TOKEN_NAME = 'token';

// See https://github.com/auth0/angular2-jwt

@Injectable()
export class AuthService {

  // See https://stackoverflow.com/questions/49240232/getting-a-cyclic-dependency-error
  jwtHelperService = new JwtHelperService();

  constructor() {}

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

  public getJwtTokenName(): string {
    return JWT_TOKEN_NAME;
  }

}
