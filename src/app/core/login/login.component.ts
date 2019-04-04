import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef, MatDialog, MatDialogConfig } from '@angular/material';
import { filter } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { TokenService } from '@app/core/auth/token.service';
import { LoginService } from '@app/core/service/login.service';
import { LoginDialogComponent } from './login-dialog.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  username = 'mittiprovence@yahoo.se';
  password = '';

  form: FormGroup;
  private formSubmitAttempt: boolean;

  loginDialog: MatDialogRef<LoginDialogComponent>;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private dialog: MatDialog,
    private tokenService: TokenService,
    private loginService: LoginService
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      username: [this.username, Validators.required],
      password: [this.password, Validators.required]
    });
  }

  isFieldInvalid(field: string): boolean {
    return (
      (!this.form.get(field).valid && this.form.get(field).touched) ||
      (this.form.get(field).untouched && this.formSubmitAttempt)
    );
  }

  login(): void {
    if (this.form.valid) {
      this.loginService.login(this.form.get('username').value, this.form.get('password').value);
    }
  }

  openLoginDialog(username?): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.hasBackdrop = false;
    dialogConfig.data = {
      login: username ? username : ''
    };
    this.loginDialog = this.dialog.open(LoginDialogComponent, dialogConfig);

    this.loginDialog.afterClosed().subscribe(name => {
      console.log(name);
      this.username = name;
    });
  }

  clear() {
    this.form.reset();
  }

}

