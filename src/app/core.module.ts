import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ToastModule } from '@app/core/toast';
import { LibI18nModule } from 'lib-i18n';

@NgModule({
  imports: [
    HttpClientModule,
    LibI18nModule,
    ToastModule.forRoot()
  ]
})
export class CoreModule {

  // Make sure the core module is imported only once as it contains all global services which are to be singletons
  constructor(@Optional() @SkipSelf() coreModule: CoreModule) {
    if (coreModule) {
      throw new Error('The core module has ALREADY been imported.');
    }
  }

}
