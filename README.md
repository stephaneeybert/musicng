# NgZero

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.2.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

The build artifacts will be stored in the `dist/` directory. Use the `ng build` command for a development build. Use the `ng build --prod` command for a production build. Use the `ng build --prod --base-href /stephaneeybert/ng-zero/` command for a build to be deployed on GitPages.  

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## TODO

Prevent the opening of multiple dialogs if clicking multiple times on the Add a user button
Show a message if the user cannot be added because his email already exists
Check that the email is free right after it has been typed
When searching prevent too many searches if typing super fast (see debounceTime)
Docker Spring Boot2 Mariadb
Make the user routes for the admin role and later give the admin role to stephane
Add sorting to the user all() get request so that it is consumed by the Spring Data pageable
After an app restart, check if the authorization really expired after the access token lifespan ended
After an app restart, check if the authorization really expired and if a refresh token was retrieved after the access token lifespan ended
After an app restart, check if the authorization really expired after the refresh token lifespan ended
