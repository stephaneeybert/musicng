import { Component, Input, EventEmitter, Output, OnChanges } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { filter } from 'rxjs/operators';

import { User } from './user';
import { UserService } from './user.service';
import { UserDialogComponent } from './user-dialog.component';
import { UtilsService } from '@app/core/service/utils.service';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
})
export class UserEditComponent implements OnChanges {

  @Input() label = 'Edit';
  @Input() existingUser: User;
  @Output() userEditedEvent: EventEmitter<User> = new EventEmitter<User>();

  userDialogRef: MatDialogRef<UserDialogComponent>;

  constructor(
    private matDialog: MatDialog,
    private utilsService: UtilsService,
    private userService: UserService
  ) { }

  ngOnChanges() {
  }

  openUserDialog() {
    this.userDialogRef = this.matDialog.open(UserDialogComponent, {
      hasBackdrop: false,
      data: {
        user: this.existingUser
      }
    });

    this.userDialogRef
      .afterClosed()
      .subscribe(user => {
        // TODO validate the edited user
        if (user) {
          if (this.existingUser) {
            user.id = this.existingUser.id;
            this.userService.fullUpdate(user)
              .subscribe(updatedUser => {
                this.userEditedEvent.emit(updatedUser);
                this.utilsService.showSnackBar('The user ' + updatedUser.firstname + ' ' + updatedUser.lastname + ' has been updated.');
              });
          } else {
            this.userService.add(user)
              .subscribe(addedUser => {
                this.userEditedEvent.emit(addedUser);
                this.utilsService.showSnackBar('The user ' + addedUser.firstname + ' ' + addedUser.lastname + ' has been added.');
              });
          }
        }
      });
  }

}
