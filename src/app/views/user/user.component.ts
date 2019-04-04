import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { UserService } from '@app/views/user/user.service';
import { User } from '@app/views/user/user';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

  user: User;

  form: FormGroup;
  private formSubmitAttempt: boolean;

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
    const id = +this.route.snapshot.paramMap.get('id');
    this.userService.get(id)
    .subscribe(user => {
      this.user = user;
      this.form = this.formBuilder.group({
        firstname: [this.user.firstname, Validators.required],
        lastname: [this.user.lastname, Validators.required]
      });
    });
  }

  isFieldInvalid(field: string): boolean {
    return (
      (!this.form.get(field).valid && this.form.get(field).touched) ||
      (this.form.get(field).untouched && this.formSubmitAttempt)
    );
  }

  save(): void {
    this.user.firstname = this.form.get('firstname').value;
    this.user.lastname = this.form.get('lastname').value;
    this.userService.partialUpdate(this.user)
      .subscribe(() => {
        this.router.navigate(['users']);
      });
  }

  cancel(): void {
    this.router.navigate(['users']);
  }

}
