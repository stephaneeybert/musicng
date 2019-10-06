import { NgModule } from '@angular/core';

import { MaterialModule } from '@app/material.module';
import { MidiLibModule } from '@lib/midi-lib.module';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';

@NgModule({
  imports: [
    HomeRoutingModule,
    MaterialModule,
    MidiLibModule
  ],
  declarations: [
    HomeComponent
  ]
})
export class HomeModule { }
