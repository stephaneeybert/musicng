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

  currentPageNumber = 1;
  elementsPerPage = 5;
  totalElements: number;
  totalPages: number;

  constructor(private userService: UserService, private messageService: MessageService) { }

  ngOnInit() {
    this.getUsers(1);
  }

  getUsers(currentPageNumber): void {
    this.currentPageNumber = currentPageNumber;
    this.userService.getSome(this.currentPageNumber, this.elementsPerPage)
      .subscribe(
        response => {
          this.currentPageNumber = response.page.number + 1;
          this.elementsPerPage = response.page.size;
          this.totalElements = response.page.totalElements;
          this.totalPages = response.page.totalPages;
          this.users = response._embedded.userResourceList as User[];
          console.log('Current page: ' + this.currentPageNumber);
          console.log('Elements per page: ' + this.elementsPerPage);
          console.log('Total elements: ' + this.totalElements);
          console.log('Total pages: ' + this.totalPages);
        },
        error => {
          console.log(error);
        });
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
