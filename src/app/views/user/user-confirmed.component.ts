import { Component, Input, EventEmitter, Output, OnChanges } from '@angular/core';

import { User } from './user';
import { UserService } from '../user/user.service';

@Component({
  selector: 'app-user-confirmed',
  templateUrl: './user-confirmed.component.html',
})
export class UserConfirmedComponent implements OnChanges {

  @Input() userId: number;
  @Output() userConfirmedValueChange = new EventEmitter();
  confirmed: boolean;

  constructor(
    private userService: UserService
  ) { }

  toggleConfirmed() {
    this.userService.get(this.userId)
    .subscribe(user => {
      user.confirmedEmail = !user.confirmedEmail;
      this.userService.partialUpdate(user)
      .subscribe(updatedUser => {
        this.update(updatedUser.confirmedEmail);
        this.userConfirmedValueChange.emit({ id: updatedUser.id });
      });
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
