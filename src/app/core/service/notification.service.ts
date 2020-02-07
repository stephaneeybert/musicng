import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { publish, refCount } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private _notification: BehaviorSubject<string> = new BehaviorSubject('');
  readonly notification$: Observable<string> = this._notification.asObservable().pipe(publish(refCount()));

  constructor() { }

  notify(message: string) {
    this._notification.next(message);
    setTimeout(() => this._notification.next(''), 3000);
  }

}
