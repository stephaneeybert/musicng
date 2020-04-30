import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UIService } from '@app/core/service/ui.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(
    private translateService: TranslateService,
    private uiService: UIService
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
    this.uiService.setMetaData({
      title: this.translateService.instant('app.title'),
      description: this.translateService.instant('app.description')
    });
  }

}
