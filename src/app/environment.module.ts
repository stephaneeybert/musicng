import { NgModule } from '@angular/core';
import { environment } from '@env/environment';
import { EnvironmenterModule, Environment } from 'ng-environmenter';

export const globalEnvironment = {
  environment: environment,
};

export const environmenter: Environment = {
  application: {},
  global: globalEnvironment
};

@NgModule({
  imports: [
    EnvironmenterModule.forRoot(environmenter),
  ],
  exports: [
    EnvironmenterModule
  ]
})
export class EnvironmentModule { }
