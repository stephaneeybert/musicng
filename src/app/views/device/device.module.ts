import { NgModule } from '@angular/core';
import { DeviceRoutingModule } from './device-routing.module';
import { MaterialModule } from '@app/material.module';
import { DeviceComponent } from './device.component';
import { MidiLibModule } from 'midi-lib';
import { LibI18nModule } from 'lib-i18n';

@NgModule({
  declarations: [
    DeviceComponent
  ],
  imports: [
    DeviceRoutingModule,
    MidiLibModule,
    MaterialModule,
    LibI18nModule,
  ]
})
export class DeviceModule { }