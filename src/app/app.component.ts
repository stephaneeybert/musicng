import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable } from 'rxjs';
import { ScreenDeviceService } from 'lib-core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(
    private translateService: TranslateService,
    private screenDeviceService: ScreenDeviceService
  ) {}

  public ngOnInit() {
    const subscription: Subscription = this.translateService.get('app.title').subscribe((text: string) => {
      this.afterLanguageResourcesLoaded();
      subscription.unsubscribe();
    });
  }

  private afterLanguageResourcesLoaded(): void {
    this.setAppMetaData();
  }

  private setAppMetaData(): void {
    const title: string = this.translateService.instant('app.title');
    const description: string = this.translateService.instant('app.description');
    const themeColor: string = '#E8EAF6';
    const image: string = 'assets/icons/icon-192x192.png';
    this.screenDeviceService.setMetaData(title, description, themeColor, image);
  }

  public getDummyTestTitle(): Observable<string> {
    return this.translateService.get('app.title');
  }
}
