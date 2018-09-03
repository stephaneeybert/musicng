import { Component, OnInit } from '@angular/core';

import { User } from '../user/user';
import { UserService } from '../user/user.service';
import { MessageService } from '../../core/messages/message.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

  users: User[];

  constructor(private userService: UserService, private messageService: MessageService) { }

  ngOnInit() {
    this.getUsers();
  }

  getUsers(): void {
    this.userService.getAll()
      .subscribe(users => this.users = users);
  }

  onSelect(user: User): void {
    this.messageService.add('Selected the user ' + user.email);
  }

  add(email: string): void {
    email = email.trim();
    if (!name) {
      return;
    }
    this.userService.add({ email } as User)
      .subscribe(user => {
        this.users.push(user);
      });
  }

  delete(user: User): void {
    this.users = this.users.filter(h => h !== user);
    this.userService.delete(user).subscribe();
  }

}
