import { Directive, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[ngModel][appOnDebounce]'
})
export class DebounceDirective implements OnInit, OnDestroy {

  @Input() public debounceTime = 300;

  @Output() public debounceEventEmitter: EventEmitter<string>;

  private isFirstChange = true;
  private subscription?: Subscription;
  public model!: NgControl;

  constructor(model: NgControl) {
    this.model = model;
    this.debounceEventEmitter = new EventEmitter<string>();
  }

  ngOnInit() {
    if (this.model.valueChanges) {
      this.subscription = this.model.valueChanges
      .pipe(debounceTime(this.debounceTime))
      .pipe(distinctUntilChanged())
      .subscribe((modelValue: string) => {
        if (this.isFirstChange) {
          this.isFirstChange = false;
        } else {
          console.log(modelValue);
          this.debounceEventEmitter.emit(modelValue);
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.subscription != null) {
      this.subscription.unsubscribe();
    }
  }

}
