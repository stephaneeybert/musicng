import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { merge, Observable, of as observableOf } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';

import { User } from './user';
import { UsersApi } from './users.api';
import { UserService } from '../user/user.service';
import { PaginationService } from '../../core/service/pagination.service';
import { MessageService } from '../../core/messages/message.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

  displayedColumns: string[] = ['id', 'email'];
  users: User[] = [];

  currentPageNumber: number;
  elementsPerPage = 5;
  totalElements: number;
  totalPages: number;

  isLoadingResults = true;
  isRateLimitReached = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private userService: UserService, private paginationService: PaginationService, private messageService: MessageService) { }

  ngOnInit() {
    // Select the first page when the sort order changes
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          // TODO add sorting
          // return this.getUsers(this.sort.active, this.sort.direction, this.paginator.pageIndex);
          return this.getUsers(this.paginator.pageIndex);
        }),
        map(userApi => {
          this.isLoadingResults = false;
          this.isRateLimitReached = false;
          this.currentPageNumber = userApi.currentPageNumber;
          this.elementsPerPage = userApi.elementsPerPage;
          this.totalElements = userApi.totalElements;
          this.totalPages = userApi.totalPages;
          return userApi.users;
        }),
        catchError(() => {
          this.isLoadingResults = false;
          this.isRateLimitReached = true;
          return observableOf([]);
        })
      ).subscribe(users => {
        this.users = users;
      });
  }

  getUsers(currentPageNumber): Observable<UsersApi> {
    return this.userService.getSome(currentPageNumber, this.elementsPerPage)
      .pipe(
        map(response => {
          return new UsersApi(
            response._embedded.userResourceList as User[],
            this.paginationService.correctPageNumberMispatch(response.page.number),
            response.page.size,
            response.page.totalElements,
            response.page.totalPages
          );
        })
      );
  }

  onSelect(user: User): void {
    this.messageService.add('Selected the user ' + user.email);
  }

  add(email: string): void {
    email = email.trim();
    if (!name) {
      return;
    }
    this.userService.add({ email } as User)
      .subscribe(user => {
        this.users.push(user);
      });
  }

  delete(user: User): void {
    this.users = this.users.filter(h => h !== user);
    this.userService.delete(user).subscribe();
  }

}
