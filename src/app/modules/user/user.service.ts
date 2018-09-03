import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

import { environment } from '../../../environments/environment';
import { HttpService } from '../../core/service/http.service';
import { User } from './user';

const DOMAIN_URI = 'users';

@Injectable()
export class UserService {

  private usersUrl = environment.BASE_REST_URI + '/' + DOMAIN_URI;

  constructor(
    private httpService: HttpService
  ) { }

  public getAll(): Observable<User[]> {
    return this.httpService.get(this.usersUrl)
    .map((data: any) => {
      return data._embedded.userResourceList as User[];
    });
  }

  public get(id: number): Observable<User> {
    const url = this.usersUrl + '/' + id;
    return this.httpService.get<User>(url);
  }

  public add(user: User): Observable<User> {
    return this.httpService.post<User>(this.usersUrl, user);
  }

  public update(user: User): Observable<any> {
    return this.httpService.put(this.usersUrl, user);
  }

  public delete(user: User): Observable<User> {
    const url = this.usersUrl + '/' + user.id;
    return this.httpService.delete<User>(url);
  }

  public deleteById(userId: number): Observable<User> {
    const url = this.usersUrl + '/' + userId;
    return this.httpService.delete<User>(url);
  }

  public search(term: string): Observable<User[]> {
    if (!term.trim()) {
      // If there is no search term then return an empty user array
      return of([]);
    }
    this.httpService.get<User[]>(this.usersUrl + '?name=' + term)
    .map((data: any) => {
      return data._embedded.userResourceList as User[];
    });
  }

}
