import { Directive, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { NgControl } from '@angular/forms';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/takeUntil';
import { Subject } from 'rxjs/internal/Subject';
import { Subscription } from 'rxjs/Subscription';

@Directive({
  selector: '[ngModel][appOnDebounce]'
})
export class DebounceDirective implements OnInit, OnDestroy {

  @Output() public appOnDebounce: EventEmitter<string>;

  @Input() public debounceTime = 300;

  private isFirstChange = true;
  private subscription: Subscription;

  constructor(public model: NgControl) {
    this.appOnDebounce = new EventEmitter<string>();
  }

  ngOnInit() {
    this.subscription = this.model.valueChanges
      .debounceTime(this.debounceTime)
      .distinctUntilChanged()
      .subscribe((modelValue: string) => {
        if (this.isFirstChange) {
          this.isFirstChange = false;
        } else {
          console.log(modelValue);
          this.appOnDebounce.emit(modelValue);
        }
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
