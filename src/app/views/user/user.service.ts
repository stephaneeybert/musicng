import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpParams } from '@angular/common/http';

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
      .pipe(
        map((data: any) => {
          return data._embedded.userResourceList as User[];
        })
      );
  }

  public getSome(searchTerm: string, sortFieldName: string, sortDirection: string, currentPage: number, limit: number): Observable<any> {
    let httpParams = new HttpParams()
    .set('page', currentPage.toString())
    .set('size', limit.toString());
    if (searchTerm) {
      httpParams = httpParams.append('searchTerm', searchTerm);
    }
    if (sortFieldName && sortDirection) {
      httpParams = httpParams.append('sort', sortFieldName + ',' + sortDirection);
    }
    return this.httpService.get(this.usersUrl, httpParams);
  }

  public get(id: number): Observable<User> {
    const httpParams = new HttpParams()
    .set('id', id.toString());
    return this.httpService.get<User>(this.usersUrl, httpParams);
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
      .pipe(
        map((data: any) => {
          return data._embedded.userResourceList as User[];
        })
      );
  }

}
