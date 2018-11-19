import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder } from '@angular/forms';

import { User } from './user';
import { UserService } from './user.service';

@Component({
  templateUrl: './user-dialog.component.html',
})
export class UserDialogComponent implements OnInit {

  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private userDialogRef: MatDialogRef<UserDialogComponent>,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) private user
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      email: this.user ? this.user.email : '',
      firstname: this.user ? this.user.firstname : '',
      lastname: this.user ? this.user.lastname : ''
    });
  }

  submit(form) {
    this.userDialogRef.close(form.value);
  }

}
