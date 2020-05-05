import { NgModule, ModuleWithProviders } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { ToastComponent } from './toast.component';
import { defaultToastConfig, TOAST_CONFIG_TOKEN } from './toast-config';
import { LibI18nModule } from 'lib-i18n';

@NgModule({
  declarations: [
    ToastComponent
  ],
  imports: [
    OverlayModule,
    LibI18nModule
  ],
  exports: [
    LibI18nModule
  ]
})
export class ToastModule {

  public static forRoot(config = defaultToastConfig): ModuleWithProviders {
    return {
      ngModule: ToastModule,
      providers: [
        {
          provide: TOAST_CONFIG_TOKEN,
          useValue: { ...defaultToastConfig, ...config },
        },
      ],
    };
  }
}
