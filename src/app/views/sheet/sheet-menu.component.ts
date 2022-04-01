import { Component, OnInit } from '@angular/core';
import { CustomOverlayRef } from '@app/service/overlay.service';
import { TranslateService } from '@ngx-translate/core';

export const MENU_ITEM_REGENERATE: string = 'regenerate';

@Component({
  templateUrl: './sheet-menu.component.html'
})
export class SheetMenuComponent implements OnInit {

  buttonLabel: string | undefined;

  constructor(
    private translateService: TranslateService,
    private customOverlayRef: CustomOverlayRef,
  ) {
    console.log(this.customOverlayRef.getData());
  }

  ngOnInit() {
    this.translateService.get('soundtracks.regenerate').subscribe((text: string) => {
      this.buttonLabel = text;
    })
  }

  regenerateSoundtrack(): void {
    this.customOverlayRef.closeWithData(MENU_ITEM_REGENERATE);
  }

}
