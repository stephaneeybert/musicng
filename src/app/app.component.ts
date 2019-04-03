import { Component, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { TranslateService } from '@ngx-translate/core';

const LANGUAGE_CODE_ENGLISH = 'en';
const LANGUAGE_CODE_FRANCAIS = 'fr';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private swUpdate: SwUpdate, translate: TranslateService) {
    // The default language used as a fallback if a translation isn't found for the current language
    translate.setDefaultLang(LANGUAGE_CODE_ENGLISH);
    // The language to use
    translate.use(LANGUAGE_CODE_FRANCAIS);
  }

  ngOnInit() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.available.subscribe(() => {
        if (confirm('A newer version of the application is available. Load the new version ?')) {
          window.location.reload();
        }
      });
    }
  }

}
