import { NgModule } from '@angular/core';

import { MidiLibComponent } from './midi-lib.component';
import { SynthComponent } from './synth/synth.component';
import { KeyboardComponent } from './keyboard/keyboard.component';
import { SoundtrackComponent } from './soundtrack/soundtrack.component';
import { DeviceComponent } from './device/device.component';
import { SheetComponent } from './sheet/sheet.component';
import { UploadComponent } from './upload/upload.component';
import { LibUiModule } from './lib-ui.module';

@NgModule({
  declarations: [
    MidiLibComponent,
    SynthComponent,
    KeyboardComponent,
    SoundtrackComponent,
    DeviceComponent,
    SheetComponent,
    UploadComponent
  ],
  imports: [
    LibUiModule
  ],
  exports: [
    MidiLibComponent,
    SynthComponent,
    KeyboardComponent,
    SoundtrackComponent,
    DeviceComponent,
    SheetComponent,
    UploadComponent
  ]
})
export class MidiLibModule { }
