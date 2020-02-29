import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-unsecured-sidenav',
  templateUrl: './unsecured.sidenav.component.html'
})
export class UnsecuredSidenavComponent implements OnInit {
  constructor(
    private translateService: TranslateService
  ) { }

  public ngOnInit(): void {
    console.log('The app title: ' + this.translateService.instant('app.title'));
  }

}
