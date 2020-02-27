import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserService } from '@app/views/user/user.service';
import { User } from '@app/views/user/user';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {

  constructor(private userService: UserService) { }

  users$: Observable<User[]> = this.userService.getAll()
  .pipe(
    map((users: User[]) => {
      return users.slice(1, 5);
    })
  );

}
