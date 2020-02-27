import { Component, OnInit } from '@angular/core';
import { SwUpdate, UpdateActivatedEvent, UpdateAvailableEvent } from '@angular/service-worker';
import { TranslateService } from '@ngx-translate/core';

import { UiService } from '@app/core/service/ui.service';

const LANGUAGE_CODE_ENGLISH = 'en';
const LANGUAGE_CODE_FRANCAIS = 'fr';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(
    private swUpdate: SwUpdate,
    private translateService: TranslateService,
    private uiService: UiService
  ) {
    // The default language used as a fallback if a translation isn't found for the current language
    translateService.setDefaultLang(LANGUAGE_CODE_ENGLISH);
    // The language to use
    translateService.use(LANGUAGE_CODE_FRANCAIS);
  }

  ngOnInit() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.available.subscribe((event: UpdateAvailableEvent) => {
        if (confirm('A newer version of the application is available. Load the new version ?')) {
          window.location.reload();
        }
      });
    }

    this.metaData();
  }

  metaData() {
    this.uiService.setMetaData({
      title: 'MusicNg',
      description: 'A music generator application'
    });
  }

}
