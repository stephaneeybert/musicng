import { Route, PreloadingStrategy } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

export class AppPreloadingStrategy implements PreloadingStrategy {

    preload(route: Route, load: Function): Observable<any> {
        const loadRoute = (delay: number) => delay
            ? timer(150).pipe(mergeMap(_ => load()))
            : load();
        return route.data && route.data.preload
            ? loadRoute(route.data.delay)
            : of(null);
    }

}
