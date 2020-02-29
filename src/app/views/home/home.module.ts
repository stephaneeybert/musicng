import { NgModule } from '@angular/core';

import { MaterialModule } from '@app/material.module';
import { MidiLibModule } from 'midi-lib';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    HomeRoutingModule,
    MaterialModule,
    MidiLibModule,
    TranslateModule
  ]
})
export class HomeModule { }
