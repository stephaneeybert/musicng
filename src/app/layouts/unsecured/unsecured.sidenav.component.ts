import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-unsecured-sidenav',
  templateUrl: './unsecured.sidenav.component.html'
})
export class UnsecuredSidenavComponent implements OnInit, OnDestroy {

  subscription: Subscription;

  constructor(
    private translateService: TranslateService
  ) {
    this.subscription = new Subscription();
  }

  public ngOnInit() {
    this.subscription.add(
      this.translateService.get('app.title').subscribe((text: string) => { // TODO Missing unsubscribe
        console.log('The app title: ' + text);
      })
    );
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
