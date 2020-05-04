import { Injectable, OnDestroy } from '@angular/core';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class WakelockService implements OnDestroy {

  constructor() { }

  ngOnDestroy() {
    let wakeLock: any = null;
    let navigator: any = window.navigator;
    if ('wakeLock' in navigator && 'request' in navigator.wakeLock) {
      wakeLock.removeEventListener('release', this.releasedLockListener);
    }
  }

  public requestWakeLock(): void {
    let wakeLock: any = null;
    let pageWindow: any = window;
    let navigator: any = window.navigator;

    if ('WakeLock' in pageWindow && 'request' in pageWindow.WakeLock) {

      console.warn('The Wake Lock API is supported by the browser window object.');
      const requestWakeLock: Function = () => {
        const controller: AbortController = new AbortController();
        const signal: AbortSignal = controller.signal;
        pageWindow.WakeLock.request('screen', { signal })
          .catch((error: Error) => {
            if (error.name === 'AbortError') {
              console.log('The Wake Lock request has aborted');
            } else {
              console.error(`${error.name}, ${error.message}`);
            }
          });
        console.log('The Wake Lock is active');
        return controller;
      };
      wakeLock = requestWakeLock();
      environment.wakeLock = wakeLock;
      console.log('Got the window Wake Lock');

    } else if ('wakeLock' in navigator && 'request' in navigator.wakeLock) {

      console.warn('The Wake Lock API is supported by the browser navigator object.');
      const requestWakeLock: Function = async () => {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
          wakeLock.addEventListener('release', this.releasedLockListener);
          console.log('The Wake Lock is active');
          return wakeLock;
        } catch (error) {
          console.error(`${error.name}, ${error.message}`);
        }
      };
      requestWakeLock().then((wakeLock: any) => {
        environment.wakeLock = wakeLock;
        console.log('Got the navigator Wake Lock');
      });

    } else {
      console.warn('The Wake Lock API is not supported by the browser.');
    }
  }

  private releasedLockListener(event: Event): void {
    console.log('The Wake Lock has been released');
  }

  public releaseWakeLock(): void {
    let pageWindow: any = window;
    let navigator: any = window.navigator;
    let wakeLock: any = environment.wakeLock;

    if (wakeLock != null) {
      if ('WakeLock' in pageWindow && 'request' in pageWindow.WakeLock) {
        wakeLock.abort();
        wakeLock = null;
        console.log('Released the window Wake Lock');
      } else if ('wakeLock' in navigator && 'request' in navigator.wakeLock) {
        wakeLock.release();
        wakeLock = null;
        console.log('Released the navigator Wake Lock');
      }
    }
    environment.wakeLock = null;
  }

}
