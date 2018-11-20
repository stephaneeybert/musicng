# NgZero

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.2.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build --prod --base-href /stephaneeybert/ng-zero/` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## TODO

Add sorting to the user all() get request so that it is consumed by the Spring Data pageable
After an app restart, check if the authorization really expired after the access token lifespan ended
After an app restart, check if the authorization really expired and if a refresh token was retrieved after the access token lifespan ended
After an app restart, check if the authorization really expired after the refresh token lifespan ended

The paginator i18n 
https://material.angular.io/components/paginator/overview#internationalization
https://material.angular.io/components/paginator/api#MatPaginatorIntl
https://stackoverflow.com/questions/46869616/how-to-use-matpaginatorintl
import { MatPaginatorIntl } from '@angular/material';
export class MatPaginatorI18n extends MatPaginatorIntl {
  itemsPerPageLabel = 'Lines per page';
  nextPageLabel = 'Next page';
  previousPageLabel = 'Previous page';
  getRangeLabel = (page: number, pageSize: number, totalResults: number) => {
    if (!totalResults) { return 'No result'; }
    totalResults = Math.max(totalResults, 0);
    const startIndex = page * pageSize;
    // If the start index exceeds the list length, do not try and fix the end index to the end.
    const endIndex =
      startIndex < totalResults ?
        Math.min(startIndex + pageSize, totalResults) :
        startIndex + pageSize; return `${startIndex + 1} - ${endIndex} sur ${totalResults}`
      ;
  }
}
