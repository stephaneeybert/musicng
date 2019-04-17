import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UiService } from '@app/core/service/ui.service';

@NgModule({
  declarations: [
  ],
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule.withConfig({warnOnNgModelWithFormControl: 'always'}),
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    UiService
  ]
})
export class AppUiModule { }
