import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';

type matBottomSheetDataType = { mobileType: 'ios' | 'android', promptEvent?: any };

@Component({
  selector: 'app-pwa-prompt',
  templateUrl: './pwa-prompt.component.html',
  styleUrls: ['./pwa-prompt.component.scss']
})
export class PwaPromptComponent {

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: matBottomSheetDataType,
    private matBottomSheetRef: MatBottomSheetRef<PwaPromptComponent>
  ) { }

  public installPwa(event: MouseEvent): void {
    console.log(this.data);
    console.log(event);
    this.data.promptEvent.prompt();
    this.data.promptEvent.userChoice // TODO Do I need this ?
      .then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA - User accepted the prompt and installed the app');
        } else {
          console.log('PWA - User dismissed the prompt and did not install the app');
        }
        this.data.promptEvent = null;
      });
    this.close();
  }

  public close() {
    this.matBottomSheetRef.dismiss();
  }

}
