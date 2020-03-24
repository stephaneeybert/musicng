import { NgModule } from '@angular/core';
import { DeviceRoutingModule } from './device-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '@app/material.module';
import { DeviceComponent } from './device.component';
import { MidiLibModule } from 'midi-lib';

@NgModule({
  declarations: [
    DeviceComponent
  ],
  imports: [
    DeviceRoutingModule,
    MidiLibModule,
    MaterialModule,
    TranslateModule,
  ]
})
export class DeviceModule { }