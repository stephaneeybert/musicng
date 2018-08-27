import { Component, OnInit } from '@angular/core';
import { UserService } from '../user/user.service';
import { User } from '../user/user';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  users: User[] = [];

  constructor(private userService: UserService) { }

  ngOnInit() {
    this.getAll();
  }

  getAll(): void {
    this.userService.getAll()
      .subscribe(response => {
        // this.users = response._embedded.userResourceList.slice(1, 5); TODO
      });
  }
}
