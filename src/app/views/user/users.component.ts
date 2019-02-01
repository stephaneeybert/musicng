import { Component, OnInit, ViewChild, ElementRef, Input, EventEmitter, Output } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { merge, Observable, of as observableOf } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';

import { User } from './user';
import { UsersApi } from './users.api';
import { UserService } from '@app/views/user/user.service';
import { PaginationService } from '@app/core/service/pagination.service';
import { UtilsService } from '@app/core/service/utils.service';
import { MessageService } from '@app/core/messages/message.service';
import { ToastService } from '@app/core/toast/toast.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

  displayedColumns: string[] = ['confirmed', 'firstname', 'lastname', 'actions'];

  elementsPerPage: number;
  pageSizeOptions: number[];

  currentPageNumber: number;
  totalElements: number;
  totalPages: number;

  isLoadingResults = true;
  isRateLimitReached = false;

  dataSource: MatTableDataSource<User>;

  updateEvent = new EventEmitter<{ value: User }>();
  searchTermEvent = new EventEmitter<{ value: string }>();
  searchTerm: string;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private userService: UserService,
    private paginationService: PaginationService,
    private utilsService: UtilsService,
    private messageService: MessageService,
    private toastService: ToastService
  ) {
    this.dataSource = new MatTableDataSource();
  }

  ngOnInit() {
    this.elementsPerPage = this.paginationService.elementsPerPage;
    this.pageSizeOptions = this.pageSizeOptions;

    // Select the first page when the sort order changes
    this.sort.sortChange.subscribe(() => {
      this.goToFirstPage();
    });

    merge(this.updateEvent, this.searchTermEvent, this.sort.sortChange, this.paginator.page)
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

  search(searchTerm: string): void {
    console.log('Searching for ' + searchTerm);
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
      this.goToFirstPage();
      this.refreshListForUser(user);
      this.utilsService.showSnackBar('The user ' + user.firstname + ' ' + user.lastname + ' has been deleted.');
    });
  }

  displayConfirmed(user: User) {
    const message = 'Toggled the mail confirmed status for ' + user.firstname + ' ' + user.lastname;
    this.showToast(message);
    this.utilsService.showSnackBar(message);
  }

  goToFirstPage() {
    this.paginator.pageIndex = 0;
  }

  refreshListForUser(user: User) {
    this.updateEvent.emit({
      value: user
    });
  }

  showToast(message: string) {
    this.toastService.show({
      text: message,
      type: 'success'
    });
  }

  logDebounceClick() {
    console.log('Logging a debounce click');
  }

}
