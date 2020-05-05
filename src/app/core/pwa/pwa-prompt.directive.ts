import { Directive, HostListener, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { PwaService } from './pwa.service';
import { Subject, Subscription } from 'rxjs';
import { ScreenDeviceService } from 'lib-core';

@Directive({
  selector: '[appPwaPrompt]'
})
export class PwaPromptDirective implements OnInit, OnDestroy {

  private clicks = new Subject();
  private subscription?: Subscription;

  constructor(
    private elementRef: ElementRef,
    private pwaService: PwaService,
    private screenDeviceService: ScreenDeviceService
  ) { }

  ngOnInit() {
    if (!this.pwaService.isInstallable()) {
      this.screenDeviceService.hideElement(this.elementRef);
    }

    this.subscription = this.clicks
    .subscribe((event: any) => {
      this.pwaService.displayPwaInstallPrompt();
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  @HostListener('click', ['$event'])
  onClickEvent(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.clicks.next(event);
  }

}
