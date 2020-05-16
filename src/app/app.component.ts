import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable } from 'rxjs';
import { ScreenDeviceService } from '@stephaneeybert/lib-core';
import { PwaService } from '@stephaneeybert/lib-pwa';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(
    private translateService: TranslateService,
    private screenDeviceService: ScreenDeviceService,
    private pwaService: PwaService
  ) {}

  public ngOnInit() {
    const subscription: Subscription = this.translateService.get('app.title').subscribe((text: string) => {
      this.afterLanguageResourcesLoaded();
      subscription.unsubscribe();
    });
  }

  getAppTheme(): string {
    return 'app-light-theme';
    // return 'app-dark-theme';
  }

  private afterLanguageResourcesLoaded(): void {
    this.setAppMetaData();
    this.checkForAppUpdate();
    this.autoDisplayPwaInstallPrompt();
  }

  private setAppMetaData(): void {
    const title: string = this.translateService.instant('app.title');
    const description: string = this.translateService.instant('app.description');
    const themeColor: string = '#E8EAF6';
    const image: string = 'assets/icons/icon-192x192.png';
    this.screenDeviceService.setMetaData(title, description, themeColor, image);
  }

  private checkForAppUpdate(): void {
    const i18nNewVersionAvailable: string = this.translateService.instant('app.pwa.new_version_available');
    this.pwaService.checkForAppUpdate(i18nNewVersionAvailable);
  }

  private autoDisplayPwaInstallPrompt(): void {
    const i18nCancel: string = this.translateService.instant('app.pwa.install.cancel');
    const i18nInstall: string = this.translateService.instant('app.pwa.install.install');
    const i18nIOSInstructions: string = this.translateService.instant('app.pwa.install.iosInstructions');
    this.pwaService.autoDisplayPwaInstallPrompt(i18nCancel, i18nInstall, i18nIOSInstructions);
  }

  public getDummyTestTitle(): Observable<string> {
    return this.translateService.get('app.title');
  }

}
