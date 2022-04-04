import { Component, Inject, OnInit } from '@angular/core';
import { CustomOverlayRef } from '@app/service/overlay.service';
import { TranslateService } from '@ngx-translate/core';
import { DATA_TOKEN } from './sheet.component';

export const MENU_ITEM_RECREATE_CRESCENDO: string = 'recreate-crescendo';
export const MENU_ITEM_RECREATE_DECRESCENDO: string = 'recreate-decrescendo';

@Component({
  templateUrl: './sheet-menu.component.html',
  styleUrls: ['./sheet-menu.component.css']
})
export class SheetMenuComponent implements OnInit {

  buttonCrescendoLabel: string | undefined;
  buttonDecrescendoLabel: string | undefined;

  constructor(
    private translateService: TranslateService,
    private customOverlayRef: CustomOverlayRef,
    @Inject(DATA_TOKEN) public data: string
  ) {
//    console.log('Menu input data: ' + this.customOverlayRef.getInputData());
//    console.log('Menu injected data: ' + this.data);
  }

  ngOnInit() {
    this.buttonCrescendoLabel = this.translateService.instant('soundtracks.recreate')
      + ' ' + this.translateService.instant('soundtracks.crescendo');
    this.buttonDecrescendoLabel = this.translateService.instant('soundtracks.recreate')
      + ' ' + this.translateService.instant('soundtracks.decrescendo');
  }

  recreateCrescendo(): void {
    this.customOverlayRef.closeWithData(MENU_ITEM_RECREATE_CRESCENDO);
  }

  recreateDecrescendo(): void {
    this.customOverlayRef.closeWithData(MENU_ITEM_RECREATE_DECRESCENDO);
  }

}
