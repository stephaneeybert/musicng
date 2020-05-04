import { Injectable, ElementRef } from '@angular/core';
import { Meta, Title, MetaDefinition } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ScreenDeviceService {

  constructor(
    private meta: Meta,
    private title: Title,
    private matSnackBar: MatSnackBar
  ) { }

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

  public setMetaData(config: any): void {
    const description: string = config.description;
    const color: string = config.color;
    const image: string = config.image;
    const title: string = config.title;
    this.title.setTitle(title);

    const tags: Array<MetaDefinition> = [
      { name: 'description', content: description },
      { name: 'theme-color', content: color },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:image', content: image },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: title },
      { name: 'apple-touch-startup-image', content: image },
      { name: 'og:title', content: title },
      { name: 'og:description', content: description },
      { name: 'og:image', content: image },
    ];
    tags.forEach((tag: MetaDefinition) => this.meta.updateTag(tag));
  }

  public showSnackBar(message: string, action?: string): void {
    this.matSnackBar.open(message, action, {
      duration: 2000,
    });
  }

  public reloadPage(): void {
    window.location.reload();
  }

  public hideElement(elementRef: ElementRef): void {
    elementRef.nativeElement.style.display = 'none';
  }

}
