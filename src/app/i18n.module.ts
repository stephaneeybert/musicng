import { NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

const LANGUAGE_CODE_ENGLISH = 'en';
const LANGUAGE_CODE_FRANCAIS = 'fr';

export function httpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './assets/i18n/');
}

@NgModule({
  imports: [
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ]
})
export class I18nModule {

  constructor(
    private translateService: TranslateService,
  ) {
    this.initLanguageTranslation();
  }

  private initLanguageTranslation(): void {
    this.translateService.addLangs([LANGUAGE_CODE_ENGLISH, LANGUAGE_CODE_FRANCAIS])
    // The default language used as a fallback if a translation isn't found for the current language
    this.translateService.setDefaultLang(LANGUAGE_CODE_FRANCAIS);
    // The language to use
    this.translateService.use(LANGUAGE_CODE_FRANCAIS);
    console.log('The browser current language is: ' + this.translateService.getBrowserLang());
  }

}
