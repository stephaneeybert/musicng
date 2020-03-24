import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '@app/material.module';
import { SoundtrackComponent } from './soundtrack.component';
import { SoundtrackRoutingModule } from './soundtrack-routing.module';
import { MidiLibModule } from 'midi-lib';

@NgModule({
  declarations: [
    SoundtrackComponent
  ],
  imports: [
    SoundtrackRoutingModule,
    MidiLibModule,
    MaterialModule,
    TranslateModule,
  ]
})
export class SoundtrackModule { }