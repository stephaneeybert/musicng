import { Component, OnInit, ViewChild, ElementRef, Input, EventEmitter, Output } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
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

  displayedColumns: string[] = ['id', 'email', 'confirmed', 'firstname', 'lastname'];

  currentPageNumber: number;
  elementsPerPage = 5;
  totalElements: number;
  totalPages: number;

  isLoadingResults = true;
  isRateLimitReached = false;

  dataSource: MatTableDataSource<User>;

  searchTerm: string;
  searchTermEvent = new EventEmitter<{ value: string }>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private userService: UserService,
    private paginationService: PaginationService,
    private messageService: MessageService) {

    this.dataSource = new MatTableDataSource();
  }

  ngOnInit() {
    // Select the first page when the sort order changes
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    merge(this.searchTermEvent, this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this.getUsers(this.searchTerm, this.sort.active, this.sort.direction, this.paginator.pageIndex);
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
        this.dataSource.data = users;
      });
  }

  getUsers(searchTerm: string, sortFieldName: string, sortDirection: string, currentPageNumber: number): Observable<UsersApi> {
    return this.userService.getSome(searchTerm, sortFieldName, sortDirection, currentPageNumber, this.elementsPerPage)
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

  search(searchTerm: string) {
    this.searchTerm = searchTerm;
    this.searchTermEvent.emit({
      value: this.searchTerm
    });

    if (this.paginator) {
      this.paginator.firstPage();
    }
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
      });
  }

  delete(user: User): void {
    this.userService.delete(user).subscribe();
  }

  displayConfirmed(userId: number) {
    console.log('Toggled the mail confirmed status for the user with id: ' + userId);
  }

}
