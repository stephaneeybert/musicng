import { Component, Input, EventEmitter, Output, OnChanges } from '@angular/core';
import { of as observableOf, Subscription } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';

import { User } from './user';
import { UserService } from '@app/views/user/user.service';

@Component({
  selector: 'app-user-confirmed',
  templateUrl: './user-confirmed.component.html',
})
export class UserConfirmedComponent implements OnChanges {

  @Input() userId?: string;
  @Output() confirmedChange: EventEmitter<User> = new EventEmitter<User>();
  confirmed: boolean = false;

  constructor(
    private userService: UserService
  ) { }

  toggleConfirmed(event: Event) {
    if (this.userId) {
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
      );
    }
  }

  // This method is called after the input bindings attempt
  // this, even if no actual input was provided to the bindings
  ngOnInit(): void {
    // Ensure the input bindings are actually provided at run-time
    this.assertInputsProvided();
  }

  // This method is called after the input bindings attempt
  // and only if there was actual input provided to the bindings
  ngOnChanges() {
    if (this.userId) {
      const subscription: Subscription = this.userService.get(this.userId)
      .subscribe(user => {
        this.update(user.confirmedEmail);
        subscription.unsubscribe();
      });
    }
  }

  update(confirmedEmail: boolean) {
    this.confirmed = confirmedEmail;
  }

  // Assert the equired input binding was actually provided by the calling context
  private assertInputsProvided(): void {
    if (!this.userId) {
      throw (new Error("The required input [userId] was not provided"));
    }
  }

}
