import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { LibI18nModule } from '@stephaneeybert/lib-i18n';
import { LibCoreModule } from '@stephaneeybert/lib-core';
import { LibPwaModule } from '@stephaneeybert/lib-pwa';
import { LibToastModule } from '@stephaneeybert/lib-toast';
import { EnvironmentModule } from './environment.module';

@NgModule({
  imports: [
    HttpClientModule,
    EnvironmentModule,
    LibI18nModule,
    LibCoreModule,
    LibPwaModule,
    LibToastModule.forRoot()
  ],
  exports: [
    EnvironmentModule,
    LibI18nModule,
    LibCoreModule,
    LibPwaModule
  ]
})
export class CoreModule {

  constructor(
    // Make sure the core module is injected only once as it contains all global services which are to be singletons
    @Optional() @SkipSelf() coreModule: CoreModule
    ) {
    if (coreModule) {
      throw new Error('The core module has ALREADY been injected.');
    }
  }

}
