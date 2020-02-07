import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { map, filter } from 'rxjs/operators';
import { HttpParams, HttpEvent, HttpResponse } from '@angular/common/http';

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
    return this.httpService.get(this.usersUrl)
      .pipe(
        map((data: any) => {
          return data._embedded.userResourceList as User[];
        })
      );
  }

  public getSome(searchTerm: string, sortFieldName: string, sortDirection: string, currentPage: number, pageSize: number): Observable<HateoasPageable> {
    let httpParams = new HttpParams()
    .set('page', currentPage.toString())
    .set('size', pageSize.toString());
    if (searchTerm) {
      httpParams = httpParams.append('searchTerm', searchTerm);
    }
    if (sortFieldName && sortDirection) {
      httpParams = httpParams.append('sort', sortFieldName + ',' + sortDirection);
    }
    return this.httpService.get<HateoasPageable>(this.usersUrl, httpParams)
    .pipe(
      filter((httpEvent: HttpEvent<HateoasPageable>): httpEvent is HttpResponse<HateoasPageable> => httpEvent instanceof HttpResponse),
      map((httpResponse: HttpResponse<HateoasPageable>) => {
        return httpResponse.body as HateoasPageable;
      })
    );
  }

  public get(id: string): Observable<User> {
    const url = this.usersUrl + '/' + id.toString();
    return this.httpService.get<User>(url)
    .pipe(
      filter((httpEvent: HttpEvent<User>): httpEvent is HttpResponse<User> => httpEvent instanceof HttpResponse),
      map((httpResponse: HttpResponse<User>) => {
        return httpResponse.body as User;
      })
    );
  }

  public add(user: User): Observable<User> {
    return this.httpService.post<User>(this.usersUrl, user)
    .pipe(
      filter((httpEvent: HttpEvent<User>): httpEvent is HttpResponse<User> => httpEvent instanceof HttpResponse),
      map((httpResponse: HttpResponse<User>) => {
        return httpResponse.body as User;
      })
    );
  }

  public fullUpdate(user: User): Observable<User> {
    const url = this.usersUrl + '/' + user.id;
    return this.httpService.put<User>(url, user)
    .pipe(
      filter((httpEvent: HttpEvent<User>): httpEvent is HttpResponse<User> => httpEvent instanceof HttpResponse),
      map((httpResponse: HttpResponse<User>) => {
        return httpResponse.body as User;
      })
    );
  }

  public partialUpdate(user: User): Observable<User> {
    const url = this.usersUrl + '/' + user.id;
    return this.httpService.patch<User>(url, user)
    .pipe(
      filter((httpEvent: HttpEvent<User>): httpEvent is HttpResponse<User> => httpEvent instanceof HttpResponse),
      map((httpResponse: HttpResponse<User>) => {
        return httpResponse.body as User;
      })
    );
  }

  public delete(user: User): Observable<User> {
    const url = this.usersUrl + '/' + user.id;
    return this.httpService.delete<User>(url)
    .pipe(
      filter((httpEvent: HttpEvent<User>): httpEvent is HttpResponse<User> => httpEvent instanceof HttpResponse),
      map((httpResponse: HttpResponse<User>) => {
        return httpResponse.body as User;
      })
    );
  }

  public deleteById(userId: number): Observable<User> {
    const url = this.usersUrl + '/' + userId;
    return this.httpService.delete<User>(url)
    .pipe(
      filter((httpEvent: HttpEvent<User>): httpEvent is HttpResponse<User> => httpEvent instanceof HttpResponse),
      map((httpResponse: HttpResponse<User>) => {
        return httpResponse.body as User;
      })
    );
  }

}
