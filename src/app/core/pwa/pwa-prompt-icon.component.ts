import { Component } from '@angular/core';
import { PwaService } from './pwa.service';

@Component({
  selector: 'app-pwa-prompt-icon',
  templateUrl: './pwa-prompt-icon.component.html',
  styleUrls: ['./pwa-prompt-icon.component.css']
})
export class PwaPromptIconComponent {

  constructor(
    private pwaService: PwaService
  ) { }

  public isInstallable(): boolean {
    return this.pwaService.isInstallable();
  }

  public displayPwaInstallPrompt(): void {
    this.pwaService.displayPwaInstallPrompt();
  }

}
