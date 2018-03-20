import {Injectable, Injector} from '@angular/core';
import {JwtHelperService} from '@auth0/angular-jwt';

const JWT_TOKEN_NAME = 'token';

@Injectable()
export class AuthService {

  //  constructor(private jwtHelperService: JwtHelperService) {} 
  // TODO Uncomment this above constructor when the JwtHelperService will be injectable
  // without causing a cyclic dependency
  // See https://stackoverflow.com/questions/49240232/getting-a-cyclic-dependency-error
  jwtHelperService: JwtHelperService;
  constructor(private injector: Injector) {
    const jwtHelperService = this.injector.get(JwtHelperService);
  }

  public isAuthenticated(): boolean {
    const token = this.getJwtTokenFromLocalStorage();
    return (token && !this.jwtHelperService.isTokenExpired(token));
  }

  // KeycloakService.auth.loggedIn && KeycloakService.auth.authz.authenticated TODO
  public isLoggedInAndAuthenticated(): boolean {
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
