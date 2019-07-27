import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
    @Inject(MAT_DIALOG_DATA) private data
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      email: this.data.user ? this.data.user.email : '',
      firstname: this.data.user ? this.data.user.firstname : '',
      lastname: this.data.user ? this.data.user.lastname : ''
    });
  }

  submit(form) {
    this.userDialogRef.close(form.value);
  }

}
