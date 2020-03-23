import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppPreloadingStrategy } from './app-preloading-strategy';
import { AuthGuardService } from './core/auth/auth-guard.service';
import { SecuredLayoutComponent } from './layouts/secured/secured.layout.component';
import { UnsecuredLayoutComponent } from './layouts/unsecured/unsecured.layout.component';
import { LoginComponent } from './core/login/login.component';
import { ErrorComponent } from './core/error/error.component';
import { MidiSoundtracksComponent } from 'midi-lib';

const routes: Routes = [
  {
    path: '',
    component: UnsecuredLayoutComponent,
    children: [
      {
        path: 'login',
        component: LoginComponent
      },
      {
        path: 'soundtracks',
        component: MidiSoundtracksComponent
      },
      {
        path: 'devices',
        loadChildren: () => import('./views/device/device.module').then(module => module.DeviceModule),
        data: {
          preload: true,
          delay: false
        }
      },
      {
        path: 'error',
        component: ErrorComponent
      },
    ]
  },
  {
    path: '',
    component: SecuredLayoutComponent,
    canActivateChild: [AuthGuardService],
    children: [
    ]
  },
];

@NgModule({
  providers: [
    AppPreloadingStrategy
  ],
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: AppPreloadingStrategy })
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
