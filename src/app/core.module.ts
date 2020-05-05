import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ToastModule } from '@app/core/toast/toast.module';
import { LibI18nModule } from 'lib-i18n';
import { LibCoreModule } from 'lib-core';
import { LibPwaModule } from 'lib-pwa';

@NgModule({
  imports: [
    HttpClientModule,
    ToastModule.forRoot(),
    LibI18nModule,
    LibCoreModule,
    LibPwaModule
  ],
  exports: [
    LibI18nModule,
    LibCoreModule,
    LibPwaModule
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
