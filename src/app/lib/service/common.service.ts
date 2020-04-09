import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor() { }

  public normalizeName(name: string): string {
    return name ? name.replace(/\s/g, '') : '';
  }

  public getRandomIntegerBetween(min: number, max: number): number {
    return Math.floor(Math.random() * max) + min;
  }

  public getRandomString(length: number): string {
    return Math.random().toString(36).substring(length);
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

}
