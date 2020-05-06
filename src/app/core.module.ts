import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { LibI18nModule } from 'lib-i18n';
import { LibCoreModule } from 'lib-core';
import { LibPwaModule } from 'lib-pwa';
import { LibToastModule } from 'lib-toast';
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

  // Make sure the core module is imported only once as it contains all global services which are to be singletons
  constructor(@Optional() @SkipSelf() coreModule: CoreModule) {
    if (coreModule) {
      throw new Error('The core module has ALREADY been imported.');
    }
  }

}
