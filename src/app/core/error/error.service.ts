import { Injectable, Injector } from '@angular/core';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { Router, Event, NavigationError } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import { of, Subscription } from 'rxjs';
import { environment } from '@env/environment';

export const DEFAULT_JSON_URL: string = 'https://jsonplaceholder.typicode.com/1';

@Injectable()
export class ErrorService {

  constructor(
    private injector: Injector,
    private router: Router,
    private httpClient: HttpClient,
  ) {
    // Subscribe to the navigation errors
    const routerSubscription: Subscription = this.router
      .events
      .subscribe((event: Event) => {
        if (event instanceof NavigationError) {
          const subscription: Subscription = this.log(event.error)
            .subscribe((errorWithContext) => {
              this.router.navigate(['error'], { queryParams: errorWithContext });
              subscription.unsubscribe();
            });
        }
        routerSubscription.unsubscribe();
      });
  }

  public log(error: any) {
    const errorWithContext: any = this.addContextInfo(error);
    return MockHttpService.post(errorWithContext);
  }

  private addContextInfo(error: any) {
    const appId: string = environment.APP_NAME;
    const location: any = this.injector.get(LocationStrategy);
    const url: string = location instanceof PathLocationStrategy ? location.path() : '';
    const time: number = new Date().getTime();

    const name: string = error.name || null;
    const user: string = ''; // TODO get the logged in user
    const id: string = `${appId}-${user}-${time}`;
    const status: string = error.status || null;
    const message: string = (error && error.body) ? error.body : error;
    const stack: any = error instanceof HttpErrorResponse ? null : error;
    const method: any = (stack && stack[0]) ? stack[0].functionName : null;

    const errorWithContext: any = { message, error, method, name, appId, user, time, id, url, status, stack };
    return errorWithContext;
  }

  fireFakeClientError() {
    throw new Error('Another runtime error)');
    // As the 'it' object is not defined, this should produce a runtime error
    // return it.happens;
  }

  fireFakeServerError() {
    const subscription: Subscription = this.httpClient
      .get(DEFAULT_JSON_URL)
      .subscribe(() => {
        subscription.unsubscribe();
      });
  }

}

 // A mocked service until a server side one is implemented
 class MockHttpService {

  static post(error: any): Observable<any> {
    return of(error);
  }

}
