import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';

import { environment } from '@env/environment';
import { HttpService } from '@app/core/service/http.service';
import { User } from './user';
import { HateoasPageable } from './hateoas-pageable';

const DOMAIN_URI = 'users';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private usersUrl = environment.BASE_REST_URI + '/' + DOMAIN_URI;

  constructor(
    private httpService: HttpService
  ) { }

  public getAll(): Observable<User[]> {
    return this.httpService.get<HateoasPageable>(this.usersUrl)
      .pipe(
        map((hateoasPageable: HateoasPageable) => {
          console.log(hateoasPageable);
          return hateoasPageable._embedded.userModelList as User[];
        })
      );
  }

  public getSome(searchTerm: string, sortFieldName: string, sortDirection: string, currentPage: number, pageSize: number): Observable<HateoasPageable> {
    let httpParams = new HttpParams()
    .set('page', String(currentPage))
    .set('size', String(pageSize));
    if (searchTerm) {
      httpParams = httpParams.append('searchTerm', searchTerm);
    }
    if (sortFieldName && sortDirection) {
      httpParams = httpParams.append('sort', sortFieldName + ',' + sortDirection);
    }
    return this.httpService.get<HateoasPageable>(this.usersUrl, httpParams);
  }

  public get(id: string): Observable<User> {
    const url = this.usersUrl + '/' + String(id);
    return this.httpService.get<User>(url);
  }

  public add(user: User): Observable<User> {
    return this.httpService.post<User>(this.usersUrl, user);
  }

  public fullUpdate(user: User): Observable<User> {
    const url = this.usersUrl + '/' + user.id;
    return this.httpService.put<User>(url, user);
  }

  public partialUpdate(user: User): Observable<User> {
    const url = this.usersUrl + '/' + user.id;
    return this.httpService.patch<User>(url, user);
  }

  public delete(user: User): Observable<User> {
    const url = this.usersUrl + '/' + user.id;
    return this.httpService.delete<User>(url);
  }

  public deleteById(userId: number): Observable<User> {
    const url = this.usersUrl + '/' + userId;
    return this.httpService.delete<User>(url);
  }

}
