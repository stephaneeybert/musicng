import {Component, OnInit, Input} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Location} from '@angular/common';

import {UserService} from '../user/user.service';
import {User} from '../user/user';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserDetailComponent implements OnInit {

  @Input() user: User;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.getUser();
  }

  getUser(): void {
    const id = +this.route.snapshot.paramMap.get('id');
    this.userService.get(id)
      .subscribe(user => this.user = user);
  }

  goBack(): void {
    this.location.back();
  }

  save(): void {
    this.userService.update(this.user)
      .subscribe(() => this.goBack());
  }

}
