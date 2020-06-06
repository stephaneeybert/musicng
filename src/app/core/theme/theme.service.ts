import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { ThemeMenuOption } from './theme-menu-option';
import { BehaviorSubject, Subscription, combineLatest } from 'rxjs';
import { ThemeStorageService } from './theme-storage.service';
import { Theme } from './theme';
import { OverlayContainer } from '@angular/cdk/overlay';
import { AmbientLightSensorService } from '../sensor/ambient-light-sensor.service';

const DEFAULT_THEME: string = 'indigo';
const THEME_MENU_OPTIONS_PATH: string = 'assets/themes/options.json';

@Injectable({
  providedIn: 'root'
})
export class ThemeService implements OnDestroy {

  private currentTheme: Theme = new Theme(DEFAULT_THEME, false);

  private themeId: BehaviorSubject<string> = new BehaviorSubject<string>(DEFAULT_THEME);
  themeId$: Observable<string> = this.themeId.asObservable();

  private themeIsDark: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  themeIsDark$: Observable<boolean> = this.themeIsDark.asObservable();

  private customAndDarkSubscription?: Subscription;
  private sensorAmbientDarkEnoughSubscription?: Subscription;
  private sensorAmbientBrightEnoughSubscription?: Subscription;

  constructor(
    private httpClient: HttpClient,
    private overlayContainer: OverlayContainer,
    private themeStorageService: ThemeStorageService,
    private ambientLightSensorService: AmbientLightSensorService
  ) {
    this.observeTheme();
    this.observeAmbientlightSensor();
  }

  ngOnDestroy() {
    if (this.customAndDarkSubscription) {
      this.customAndDarkSubscription.unsubscribe();
    }
    if (this.sensorAmbientDarkEnoughSubscription) {
      this.sensorAmbientDarkEnoughSubscription.unsubscribe();
    }
    if (this.sensorAmbientBrightEnoughSubscription) {
      this.sensorAmbientBrightEnoughSubscription.unsubscribe();
    }
  }

  public getThemeOptions(): Observable<Array<ThemeMenuOption>> {
    return this.httpClient.get<Array<ThemeMenuOption>>(THEME_MENU_OPTIONS_PATH);
  }

  private loadTheme(): Theme {
    let theme: Theme | null = this.themeStorageService.getTheme();
    return theme ? this.themeStorageService.cleanUpInstance(theme) : new Theme(DEFAULT_THEME, false);
  }

  public initTheme(): void {
    const theme: Theme = this.loadTheme();
    this.switchTheme(theme.id);
    this.setDarkTheme(theme.isDark);
  }

  public switchTheme(themeId: string): void {
    this.themeId.next(themeId);
    this.currentTheme.id = themeId;
    this.themeStorageService.setTheme(this.currentTheme);
  }

  public setDarkTheme(themeIsDark: boolean): void {
    this.themeIsDark.next(themeIsDark);
    this.currentTheme.isDark = themeIsDark;
    this.themeStorageService.setTheme(this.currentTheme);
  }

  public buildThemeClassName(themeId: string, themeIsDark: boolean): string {
    if (themeIsDark) {
      return themeId + '-dark-theme';
    } else {
      return themeId + '-light-theme';
    }
  }

  public getTheme$(): Observable<[string, boolean]> {
    return combineLatest(
      this.themeId$,
      this.themeIsDark$
    );
  }

  private observeTheme(): void {
    this.customAndDarkSubscription = this.getTheme$()
    .subscribe(([themeId, themeIsDark]: [string, boolean]) => {
      this.notifyOverlay(themeId, themeIsDark);
    });
  }

  // Apply the theme to a dialog box
  public notifyOverlay(themeId: string, themeIsDark: boolean): void {
    const themeClassName: string = this.buildThemeClassName(themeId, themeIsDark);
    this.overlayContainer.getContainerElement().classList.add(themeClassName);
  }

  private observeAmbientlightSensor(): void {
    this.sensorAmbientDarkEnoughSubscription = this.ambientLightSensorService.ambientIsDarkEnough$()
    .subscribe((isDarkEnough: boolean) => {
      if (!this.currentTheme.isDark && isDarkEnough) {
        this.setDarkTheme(true);
      }
    });
    this.sensorAmbientBrightEnoughSubscription = this.ambientLightSensorService.ambientIsBrightEnough$()
    .subscribe((isBrightEnough: boolean) => {
      if (this.currentTheme.isDark && isBrightEnough) {
        this.setDarkTheme(false);
      }
    });
  }

}
