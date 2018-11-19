import { Component, Input, EventEmitter, Output, OnChanges } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { filter } from 'rxjs/operators';

import { User } from './user';
import { UserService } from './user.service';
import { UserDialogComponent } from './user-dialog.component';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
})
export class UserEditComponent implements OnChanges {

  @Output() userEditedEvent: EventEmitter<User> = new EventEmitter<User>();

  userDialogRef: MatDialogRef<UserDialogComponent>;

  constructor(
    private matDialog: MatDialog,
    private userService: UserService
  ) { }

  ngOnChanges() {
  }

  openUserDialog(existingUser: User) {
    this.userDialogRef = this.matDialog.open(UserDialogComponent, {
      hasBackdrop: false,
      data: {
        user: existingUser
      }
    });

    this.userDialogRef
      .afterClosed()
      .subscribe(user => {
        // TODO validate the edited user
        if (user) {
          if (user.id) {
            this.userService.fullUpdate(existingUser)
              .subscribe(updatedUser => {
                this.userEditedEvent.emit(updatedUser);
                // TODO Add a hint that the user has been added
              });
          } else {
            this.userService.add(user)
              .subscribe(addedUser => {
                this.userEditedEvent.emit(addedUser);
                // TODO Add a hint that the user has been updated
              });
          }
        }
      });
  }

}
