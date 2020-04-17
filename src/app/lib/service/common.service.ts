import { Injectable } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor() { }

  public is(value: any): boolean {
    return coerceBooleanProperty(value);
  }

  public normalizeName(name: string): string {
    return name ? name.replace(/\s/g, '') : '';
  }

  public getRandomIntegerBetweenAndExcept(min: number, max: number, except: Array<number>): number {
    let random: number;
    do {
      random = this.getRandomIntegerBetween(min, max);
    } while (except.includes(random));
    return random;
  }

  public getRandomIntegerBetween(min: number, max: number): number {
    return Math.floor(Math.random() * max) + min;
  }

  public getRandomString(length: number): string {
    const start: number = 2;
    return Math.random().toString(36).substring(start, start + length);
  }

  private getDeviceWindowRef(): any {
    return window;
  }

  public getScreenInnerWidth(): number {
    return this.getDeviceWindowRef().innerWidth;
  }

  public getScreenOuterWidth(): number {
    return this.getDeviceWindowRef().outerWidth;
  }

  public getScreenWidth(): number {
    return this.getDeviceWindowRef().width;
  }

  public getScreenHeight(): number {
    return this.getDeviceWindowRef().innerWidth;
  }

  public requestWakeLock(): void {
    let wakeLock: any = null;
    let pageWindow: any = window;
    let navigator: any = window.navigator;

    if ('WakeLock' in pageWindow && 'request' in pageWindow.WakeLock) {

      console.warn('The Wake Lock API is supported by the browser window object.');
      const requestWakeLock = () => {
        const controller = new AbortController();
        const signal = controller.signal;
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
      const requestWakeLock = async () => {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
          wakeLock.addEventListener('release', () => {
            console.log('The Wake Lock has been released');
          });
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
