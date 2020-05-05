import { Platform } from '@angular/cdk/platform';
import { Injectable, OnDestroy } from '@angular/core';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { timer, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { SwUpdate } from '@angular/service-worker';
import { TranslateService } from '@ngx-translate/core';
import { PwaPromptComponent } from './pwa-prompt.component';
import { ScreenDeviceService } from 'lib-core';

const PROMPT_DELAY: number = 3000;
const PLATFORM_ANDROID: 'android' = 'android';
const PLATFORM_IOS: 'ios' = 'ios';

@Injectable({
  providedIn: 'root'
})
export class PwaService implements OnDestroy {

  private installPromptEvent?: Event;
  private alreadyInstalledEvent?: Event;
  private bottomSheetRef?: MatBottomSheetRef;

  private pwaPromptForInstallSubscription?: Subscription;
  private pwaCheckForUpdateSubscription?: Subscription;

  constructor(
    private matBottomSheet: MatBottomSheet,
    private platform: Platform,
    private swUpdate: SwUpdate,
    private screenDeviceService: ScreenDeviceService,
    private translateService: TranslateService
  ) { }

  ngOnDestroy() {
    if (this.pwaPromptForInstallSubscription != null) {
      this.pwaPromptForInstallSubscription.unsubscribe();
    }
    if (this.pwaCheckForUpdateSubscription != null) {
      this.pwaCheckForUpdateSubscription.unsubscribe();
    }

    window.removeEventListener('beforeinstallprompt', this.handleBbeforeInstallAndroid);
    window.removeEventListener('appinstalled', this.handleAlreadyInstalledAndroid);
    self.removeEventListener('install', this.handleServiceWorkerInstallEvent);
    self.removeEventListener('fetch', this.handleServiceWorkerFetchEvent);
  }

  public displayPwaInstallPrompt() {
    console.log('PWA - Is not standalone app yet');
    if (this.platform.ANDROID) {
      if (!this.isInStandaloneModeAndroid()) {
        console.log('PWA - Opening the propt install on Android');
        this.openBottomSheet(PLATFORM_ANDROID);
      }
    } else if (this.platform.IOS) {
      if (!this.isInStandaloneModeIOS()) {
        // Prevent the installation prompt when the app is already installed
        console.log('PWA - Opening the propt install on iOS');
        this.openBottomSheet(PLATFORM_IOS);
      }
    } else {
      console.log('PWA - The platform is not supporting PWA installation');
    }
  }

  public checkForBeforeInstallEvents(): void {
    console.log('PWA - In checkForBeforeInstallEvents');
    if (this.platform.ANDROID) {
      console.log('PWA - Is on Android and is not standalone: ' + !this.isInStandaloneModeAndroid());
      if (!this.isInStandaloneModeAndroid()) {
        console.log('PWA - Listening on the install prompt event on Android');
        window.addEventListener('beforeinstallprompt', this.handleBbeforeInstallAndroid);
        window.addEventListener('appinstalled', this.handleAlreadyInstalledAndroid);
        self.addEventListener('install', this.handleServiceWorkerInstallEvent);
        self.addEventListener('fetch', this.handleServiceWorkerFetchEvent);
      }
    } else if (this.platform.IOS) {
    } else {
    }
  }

  // Called if the application is sent an event before offering the user to install it on the device
  private handleBbeforeInstallAndroid(event: Event): void {
    // Prevent the default dialog from opening before our custom dialog
    event.preventDefault();
    // Keep the install prompt event for latter use
    this.installPromptEvent = event;
    console.log('PWA - Received and saved the install prompt event on Android');
  }

  private openPwaPromptComponent(mobileType: 'ios' | 'android'): void {
    this.pwaPromptForInstallSubscription = timer(PROMPT_DELAY)
      .pipe(take(1))
      .subscribe(() => {
        this.openBottomSheet(mobileType);
      });
  }

  // Called if the application if already installed
  private handleAlreadyInstalledAndroid(event: Event): void {
    this.alreadyInstalledEvent = event;
    console.log('PWA - The application is already installed');
    console.log(this.alreadyInstalledEvent);
  }

  // Called when the service worker receives an install event
  private handleServiceWorkerInstallEvent(event: any): void {
    event.waitUntil(
      caches.open('v1').then(function(cache) {
        console.log('PWA - Caching custom resources for the service worker');
        return cache.addAll([
          './index.html', // Caching the resource specified in the start_url in the manifest file
          // is a prerequisite to receiving the beforeinstallprompt event from the browser
        ]);
      })
    );
  }

  // Called when the service worker receives a fetch event
  // Listening to the fetch event is a prerequisite to receiving the beforeinstallprompt event from the browser
  private handleServiceWorkerFetchEvent(event: any): void {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        if (response) {
          console.log('PWA - Found response in cache:', response);
          return response;
        }
        console.log('PWA - No response found in cache. About to fetch from network...');
        return fetch(event.request).then(function(response) {
          console.log('PWA - Response from network is:', response);
          return response;
        }, function(error) {
          console.error('PWA - Fetching failed:', error);
          throw error;
        });
      })
    );
  }

  private openBottomSheet(mobilePlatform: 'ios' | 'android'): void {
    this.bottomSheetRef = this.matBottomSheet.open(PwaPromptComponent, {
      ariaLabel: this.translateService.instant('app.pwa.install.installOnDevice'),
      data: {
        mobileType: mobilePlatform,
        promptEvent: this.installPromptEvent
      }
    });
    this.bottomSheetRef.afterDismissed().subscribe(() => {
      console.log('PWA - The bottom sheet has been dismissed.');
    });
  }

  private receivedInstallPromptEventAndroid(): boolean {
    return this.installPromptEvent != null;
  }

  public isInstallable(): boolean {
    if (this.platform.ANDROID) {
      return this.receivedInstallPromptEventAndroid() && !this.isInStandaloneModeAndroid();
    } else if (this.platform.IOS) {
      return this.isInStandaloneModeIOS();
    } else {
      return false;
    }
  }

  private isInStandaloneModeAndroid(): boolean {
    return matchMedia('(display-mode: standalone)').matches;
  }

  private isInStandaloneModeIOS(): boolean {
    return ('standalone' in window.navigator) && (window.navigator['standalone']);
  }

  public checkForAppUpdate(): void {
    console.log('PWA - In checkForAppUpdate');
    if (this.swUpdate.isEnabled) {
      console.log('PWA - Update is enabled');
      this.pwaCheckForUpdateSubscription = this.swUpdate.available
        .subscribe(() => {
          console.log('PWA - Offering a new version');
          const appNewVersion: string = this.translateService.instant('app.pwa.new_version_available');
          if (confirm(appNewVersion)) {
            this.screenDeviceService.reloadPage();
          }
        });
    }
  }

}
