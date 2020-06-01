import { Component, Input, EventEmitter, Output, OnChanges, SimpleChange, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { User } from './user';
import { UserService } from './user.service';
import { UserDialogComponent } from './user-dialog.component';
import { Subscription } from 'rxjs';
import { MaterialService } from '@app/core/service/material.service';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
})
export class UserEditComponent implements OnChanges, OnDestroy {

  private _label = 'Edit'; // TODO Is using a _label part of the public API ?
  @Input() existingUser?: User;
  @Output() userEditedEvent: EventEmitter<User> = new EventEmitter<User>();

  userDialogRef!: MatDialogRef<UserDialogComponent>;

  private dialogSubscription?: Subscription;

  constructor(
    private matDialog: MatDialog,
    private materialService: MaterialService,
    private userService: UserService
  ) { }

  @Input()
  set label(label: string) {
    this._label = (label && label.trim()) || '<no label set>';
  }

  get label(): string {
    return this._label;
  }

  // This method is called after the input bindings attempt
  // and only if there was actual input provided to the bindings
  ngOnChanges(changes: {[propKey: string]: SimpleChange}) {
    const loggedOutput: string[] = [];
    for (const propName of Object.keys(changes)) {
      const change: any = changes[propName];
      const currentValue: any  = JSON.stringify(change.currentValue);
      const previousValue: any = JSON.stringify(change.previousValue);
      const changedTo: string = JSON.stringify(change.currentValue);
      if (change.isFirstChange()) {
        loggedOutput.push(`Initial value of ${propName} set to ${changedTo}`);
      } else {
        const changedFrom: string = JSON.stringify(change.previousValue);
        loggedOutput.push(`${propName} changed from ${changedFrom} to ${changedTo}`);
      }
    }
    console.log(loggedOutput.join(', '));
  }

  ngOnDestroy() {
    if (this.dialogSubscription) {
      this.dialogSubscription.unsubscribe();
    }
  }

  openUserDialog() {
    this.userDialogRef = this.matDialog.open(UserDialogComponent, {
      hasBackdrop: false,
      data: {
        user: this.existingUser
      }
    });

    this.dialogSubscription = this.userDialogRef
      .afterClosed()
      .subscribe(user => {
        // TODO validate the edited user
        if (user) {
          if (this.existingUser) {
            user.id = this.existingUser.id;
            const subscription: Subscription = this.userService.fullUpdate(user)
              .subscribe(updatedUser => {
                this.userEditedEvent.emit(updatedUser);
                this.materialService.showSnackBar('The user ' + updatedUser.firstname + ' ' + updatedUser.lastname + ' has been updated.');
                subscription.unsubscribe();
              });
          } else {
            const subscription: Subscription = this.userService.add(user)
              .subscribe(addedUser => {
                this.userEditedEvent.emit(addedUser);
                this.materialService.showSnackBar('The user ' + addedUser.firstname + ' ' + addedUser.lastname + ' has been added.');
                subscription.unsubscribe();
              });
          }
        }
      });
  }

}
