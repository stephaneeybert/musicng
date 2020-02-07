import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { UserService } from '@app/views/user/user.service';
import { User } from '@app/views/user/user';
import { last } from 'rxjs/operators';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

  user?: User;

  form?: FormGroup;
  private formSubmitAttempt: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
  ) { }

  ngOnInit(): void {
    this.getUser();
  }

  getUser(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userService.get(id)
      .subscribe(user => {
        this.user = user;
        this.form = this.formBuilder.group({
          firstname: [this.user.firstname, Validators.required],
          lastname: [this.user.lastname, Validators.required]
        });
      });
    }
  }

  isFieldInvalid(field: string): boolean {
    let invalid = false;
    if (this.form) {
      let formField = this.form.get(field);
      if ((formField && !formField.valid && formField.touched) ||
      (formField && formField.untouched && this.formSubmitAttempt)) {
        invalid = true;
      }
    }
    return invalid;
  }

  save(): void {
    if (this.user && this.form) {
      let firstnameField = this.form.get('firstname');
      let lastnameField = this.form.get('lastname');
      if (firstnameField && lastnameField) {
        this.user.firstname = firstnameField.value;
        this.user.lastname = lastnameField.value;
        this.userService.partialUpdate(this.user)
        .subscribe(() => {
          this.router.navigate(['users']);
        });
      }
    }
  }

  cancel(): void {
    this.router.navigate(['users']);
  }

}
