import { NgModule } from '@angular/core';
import { MaterialModule } from '@app/material.module';
import { SoundtrackComponent } from './soundtrack.component';
import { SoundtrackRoutingModule } from './soundtrack-routing.module';
import { MidiLibModule } from 'midi-lib';
import { LibI18nModule } from 'lib-i18n';

@NgModule({
  declarations: [
    SoundtrackComponent
  ],
  imports: [
    SoundtrackRoutingModule,
    MidiLibModule,
    MaterialModule,
    LibI18nModule,
  ]
})
export class SoundtrackModule { }