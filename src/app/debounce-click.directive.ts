import { Directive, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { debounceTime } from 'rxjs/operators';

// Usage: <button (appOnDebounceClick)="log()" [debounceTime]="700">Debounced Click</button>

@Directive({
  selector: '[appOnDebounceClick]'
})
export class DebounceClickDirective implements OnInit, OnDestroy {

  @Input() debounceTime = 500;

  @Output() debounceClickEventEmitter = new EventEmitter();

  private clicks = new Subject();
  private subscription?: Subscription;

  constructor() { }

  ngOnInit() {
    this.subscription = this.clicks
    .pipe(
      debounceTime(this.debounceTime)
    )
    .subscribe((event: any) => {
      this.debounceClickEventEmitter.emit(event);
    });
  }

  ngOnDestroy() {
    if (this.subscription != null) {
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
