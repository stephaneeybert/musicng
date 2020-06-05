import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable, combineLatest } from 'rxjs';
import { ScreenDeviceService } from '@stephaneeybert/lib-core';
import { PwaService } from '@stephaneeybert/lib-pwa';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  customTheme?: string;

  private customAndDarkSubscription?: Subscription;

  constructor(
    private translateService: TranslateService,
    private screenDeviceService: ScreenDeviceService,
    private pwaService: PwaService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    const subscription: Subscription = this.translateService.get('app.title').subscribe((text: string) => {
      this.afterLanguageResourcesLoaded();
      subscription.unsubscribe();
    });

    this.observeTheme();
  }

  ngOnDestroy() {
    if (this.customAndDarkSubscription != null) {
      this.customAndDarkSubscription.unsubscribe();
    }
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
    const i18nQuestion: string = this.translateService.instant('app.pwa.install.question');
    const i18nCancel: string = this.translateService.instant('app.pwa.install.cancel');
    const i18nInstall: string = this.translateService.instant('app.pwa.install.install');
    const i18nIOSInstructions: string = this.translateService.instant('app.pwa.install.iosInstructions');
    this.pwaService.autoDisplayPwaInstallPrompt(i18nQuestion, i18nCancel, i18nInstall, i18nIOSInstructions);
  }

  public getDummyTestTitle(): Observable<string> {
    return this.translateService.get('app.title');
  }

  private observeTheme(): void {
    this.customTheme = this.themeService.getDefaultThemeName();

    const customAndDark$: Observable<[string, boolean]> = combineLatest(
      this.themeService.customTheme$,
      this.themeService.isDarkTheme$
    );

    this.customAndDarkSubscription = customAndDark$
    .subscribe(([customTheme, isDarkTheme]: [string, boolean]) => {
      if (isDarkTheme) {
        this.customTheme = customTheme + '-dark-theme';
      } else {
        this.customTheme = customTheme + '-light-theme';
      }
    });
  }

}
