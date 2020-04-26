import { Component, OnInit, OnDestroy } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { TranslateService } from '@ngx-translate/core';

import { UIService } from '@app/core/service/ui.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  private swUpdateSubscription?: Subscription;

  constructor(
    private swUpdate: SwUpdate,
    private translateService: TranslateService,
    private uiService: UIService
  ) {}

  public ngOnInit() {
    this.translateService.get('app.title').subscribe((text: string) => {
      this.afterLanguageResourcesLoaded();
    });
  }

  private afterLanguageResourcesLoaded(): void {
    this.checkForAppUpdate();
    this.setAppMetaData();
  }

  private checkForAppUpdate(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdateSubscription = this.swUpdate.available.subscribe(() => {
        const appNewVersion = this.translateService.instant('app.new_version_available');
        if (confirm(appNewVersion)) {
          window.location.reload();
        }
      });
    }
  }

  private setAppMetaData(): void {
    this.uiService.setMetaData({
      title: this.translateService.instant('app.title'),
      description: this.translateService.instant('app.description')
    });
  }

  public ngOnDestroy(): void {
    if (this.swUpdateSubscription != null) {
      this.swUpdateSubscription.unsubscribe();
    }
  }

}
