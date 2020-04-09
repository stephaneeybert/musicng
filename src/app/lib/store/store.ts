import { BehaviorSubject, Observable } from 'rxjs';

export abstract class Store<T> {

  state$?: Observable<T>;
  private _state$?: BehaviorSubject<T>;

  protected constructor(initialState: T) {
    this.init(initialState);
  }

  init(initialState: T) {
    this._state$ = new BehaviorSubject(initialState);
    this.state$ = this._state$.asObservable();
  }

  public getState(): T {
    if (this._state$) {
      return this._state$.getValue();
    } else {
      throw new Error('The data store state was not yet defined and its value could not be obtained.');
    }
  }

  public setState(nextState: T) {
    if (this._state$) {
      this._state$.next(nextState);
    } else {
      throw new Error('The data store state was not yet defined and its value could not be set.');
    }
  }

}
