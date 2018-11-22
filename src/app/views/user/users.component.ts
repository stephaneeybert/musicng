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

  displayedColumns: string[] = ['id', 'email', 'confirmed', 'firstname', 'lastname', 'actions'];

  elementsPerPage: number;
  pageSizeOptions: number[];

  currentPageNumber: number;
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
    private messageService: MessageService
  ) {
    this.dataSource = new MatTableDataSource();
  }

  ngOnInit() {
    this.elementsPerPage = this.paginationService.elementsPerPage;
    this.pageSizeOptions = this.pageSizeOptions;

    // Select the first page when the sort order changes
    this.sort.sortChange.subscribe(() => {
      this.paginator.pageIndex = 0;
    });

    merge(this.searchTermEvent, this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this.getUsers(this.searchTerm, this.sort.active, this.sort.direction, this.paginator.pageIndex);
        }),
        map((usersApi: UsersApi) => {
          this.isLoadingResults = false;
          this.isRateLimitReached = false;
          this.currentPageNumber = usersApi.currentPageNumber;
          this.elementsPerPage = usersApi.elementsPerPage;
          this.totalElements = usersApi.totalElements;
          this.totalPages = usersApi.totalPages;
          return usersApi.users;
        }),
        catchError(() => {
          this.isLoadingResults = false;
          this.isRateLimitReached = true;
          return observableOf([]);
        })
      ).subscribe((users: User[]) => {
        this.dataSource.data = users;
      });
  }

  getUsers(searchTerm: string, sortFieldName: string, sortDirection: string, currentPageNumber: number): Observable<UsersApi> {
    return this.userService.getSome(searchTerm, sortFieldName, sortDirection, currentPageNumber, this.elementsPerPage)
      .pipe(
        map(response => {
          return new UsersApi(
            response._embedded.userResourceList as User[],
            response.page.number,
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

  delete(user: User): void {
    this.userService.delete(user).subscribe(() => {
      console.log('The user ' + user.firstname + ' ' + user.lastname + ' has been deleted.');
      // TODO Display a caption that the user has been deleted
    });
  }

  displayConfirmed(userId: number) {
    console.log('Toggled the mail confirmed status for the user with id: ' + userId);
  }

  refreshList(user: User) {
    console.log('Edited the user: ' + user.id);
  }

}
