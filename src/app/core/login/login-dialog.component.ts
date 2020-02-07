import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.component.html'
})
export class LoginDialogComponent implements OnInit {

  loginForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private loginDialog: MatDialogRef<LoginDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: this.data ? this.data.name : ''
    });
  }

  submit(form: FormGroup) {
    this.loginDialog.close(`${this.loginForm.value.username}`);
  }

}
