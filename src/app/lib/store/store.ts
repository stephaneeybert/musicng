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
    return this._state$!.getValue();
  }

  public setState(nextState: T) {
    this._state$!.next(nextState);
  }

}
