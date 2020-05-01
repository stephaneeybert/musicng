import { Route, PreloadingStrategy } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

export class AppPreloadingStrategy implements PreloadingStrategy {

    preload(route: Route, load: Function): Observable<any> {
      return route.data && route.data.preload
      ? this.loadRoute(route.data.delay, load)
      : of(null);
    }

    private loadRoute(delay: number, load: Function): Observable<any> {
      return delay ? timer(150).pipe(mergeMap(_ => load())) : load();
    }

}
