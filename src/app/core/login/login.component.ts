import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { TokenService } from '@app/core/auth/token.service';
import { LoginService } from '@app/views/user/login.service';
import { LoginDialogComponent } from './login-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {

  username = 'mittiprovence@yahoo.se';
  password = '';

  form!: FormGroup;
  private formSubmitAttempt: boolean = false;

  loginDialog!: MatDialogRef<LoginDialogComponent>;

  private dialogSubscription?: Subscription;

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

  ngOnDestroy() {
    if (this.dialogSubscription) {
      this.dialogSubscription.unsubscribe();
    }
  }

  isFieldInvalid(field: string): boolean {
    let invalid = false;
    let formField = this.form.get(field);
    if ((formField && !formField.valid && formField.touched) ||
      (formField && formField.untouched && this.formSubmitAttempt)) {
      invalid = true;
    }
    return invalid;
  }

  login(): void {
    if (this.form.valid) {
      let usernameField = this.form.get('username');
      let passwordField = this.form.get('password');
      if (usernameField && passwordField) {
        this.loginService.login(usernameField.value, passwordField.value);
      }
    }
  }

  openLoginDialog(username: string): void {
    const dialogConfig: MatDialogConfig = new MatDialogConfig();
    dialogConfig.hasBackdrop = false;
    dialogConfig.data = {
      login: username ? username : ''
    };
    this.loginDialog = this.dialog.open(LoginDialogComponent, dialogConfig);

    this.dialogSubscription = this.loginDialog.afterClosed().subscribe(name => {
      console.log(name);
      this.username = name;
    });
  }

  clear() {
    this.form.reset();
  }

}
