import { NgModule } from '@angular/core';

@NgModule({
  imports: [
  ],
  exports: [
  ],
  providers: [
    {
      provide: Window,
      useValue: window,
    }
  ]
})
export class SensorModule { }
