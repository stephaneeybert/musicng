import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { UserService } from '@app/views/user/user.service';
import { User } from '@app/views/user/user';
import { last } from 'rxjs/operators';
import { Subscription } from 'rxjs';

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
    const id: string | null = this.route.snapshot.paramMap.get('id');
    if (id) {
      const subscription: Subscription = this.userService.get(id)
      .subscribe((user: User) => {
        this.user = user;
        this.form = this.formBuilder.group({
          firstname: [user.firstname, Validators.required],
          lastname: [user.lastname, Validators.required]
        });
        subscription.unsubscribe();
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
        const subscription: Subscription = this.userService.partialUpdate(this.user)
        .subscribe((user: User) => {
          this.router.navigate(['users']);
          subscription.unsubscribe();
        });
      }
    }
  }

  cancel(): void {
    this.router.navigate(['users']);
  }

}
