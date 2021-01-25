import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable } from 'rxjs';
import { ScreenDeviceService } from '@stephaneeybert/lib-core';
import { PwaService } from '@stephaneeybert/lib-pwa';
import { ThemeService } from './core/theme/theme.service';
import { SettingsService } from './views/settings/settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  themeClassName?: string;

  private customAndDarkSubscription?: Subscription;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private translateService: TranslateService,
    private screenDeviceService: ScreenDeviceService,
    private pwaService: PwaService,
    private settingsService: SettingsService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    const subscription: Subscription = this.translateService.get('app.title').subscribe((text: string) => {
      this.afterLanguageResourcesLoaded();
      subscription.unsubscribe();
    });

    const allowDarkTheme: boolean = this.settingsService.getSettings().allowDarkTheme;
    if (allowDarkTheme) {
      this.observeTheme();
      this.themeService.initTheme();
    }
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
    this.customAndDarkSubscription = this.themeService.getTheme$()
    .subscribe(([themeId, themeIsDark]: [string, boolean]) => {
      this.themeClassName = this.themeService.buildThemeClassName(themeId, themeIsDark);
      this.detectChanges();
    });
  }

  // The dark mode may be activated by the ambient light sensor without any user UI action
  private detectChanges(): void {
    this.changeDetector.detectChanges();
  }

}
