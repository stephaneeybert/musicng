import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class UIService {

  constructor(
    private meta: Meta,
    private title: Title,
    private matSnackBar: MatSnackBar
    ) { }

  public setMetaData(config: any): void {
    const description: string = config.description;
    const color: string = config.color;
    const image: string = config.image;
    const title: string = config.title;
    this.title.setTitle(title);

    const tags: any = [
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
    tags.forEach(tag => this.meta.updateTag(tag));
  }

  public showSnackBar(message: string, action?: string): void {
    this.matSnackBar.open(message, action, {
      duration: 2000,
    });
  }

  public reloadPage(): void {
    window.location.reload();
  }

}
