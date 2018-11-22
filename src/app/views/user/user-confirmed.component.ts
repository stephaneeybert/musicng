import { Component, Input, EventEmitter, Output, OnChanges } from '@angular/core';
import { of as observableOf } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';

import { User } from './user';
import { UserService } from '@app/views/user/user.service';

@Component({
  selector: 'app-user-confirmed',
  templateUrl: './user-confirmed.component.html',
})
export class UserConfirmedComponent implements OnChanges {

  @Input() userId: number;
  @Output() confirmedChange: EventEmitter<User> = new EventEmitter<User>();
  confirmed: boolean;

  constructor(
    private userService: UserService
  ) { }

  toggleConfirmed(data) {
    this.userService.get(this.userId)
      .pipe(
        switchMap((user: User) => {
          user.confirmedEmail = !user.confirmedEmail;
          return this.userService.partialUpdate(user);
        }),
        map((updatedUser: User) => {
          this.update(updatedUser.confirmedEmail);
          return this.confirmedChange.emit(updatedUser);
        }),
        catchError(() => {
          return observableOf([]);
        })
      ).subscribe((users: User[]) => {
      });
  }

  ngOnChanges() {
    this.userService.get(this.userId)
      .subscribe(user => {
        this.update(user.confirmedEmail);
      });
  }

  update(confirmedEmail: boolean) {
    this.confirmed = confirmedEmail;
  }

}
