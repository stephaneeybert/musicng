import { Component, OnInit, Input } from '@angular/core';
import { User } from '@app/views/user/user';

@Component({
  selector: 'app-dashboard-view',
  templateUrl: './dashboard.view.component.html',
  styleUrls: ['./dashboard.view.component.css']
})
export class DashboardViewComponent {

  @Input() users: User[] = [];

}
