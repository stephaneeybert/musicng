import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppPreloadingStrategy } from './app-preloading-strategy';
import { AuthGuardService } from './core/auth/auth-guard.service';
import { SecuredLayoutComponent } from './layouts/secured/secured.layout.component';
import { UnsecuredLayoutComponent } from './layouts/unsecured/unsecured.layout.component';
import { LoginComponent } from './core/login/login.component';
import { ErrorComponent } from './core/error/error.component';
import { SoundtracksComponent } from './views/soundtrack/soundtracks.component';
import { DevicesComponent } from './views/device/devices.component';

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
        component: SoundtracksComponent
      },
      {
        path: 'devices',
        component: DevicesComponent
      },
      {
        path: 'error',
        component: ErrorComponent
      },
      {
        path: '', // Note that a redirect prevents Lighthouse from auditing the PWA
        redirectTo: 'soundtracks',
        pathMatch: 'full'
      }
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
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: AppPreloadingStrategy })
  ],
  exports: [
    RouterModule
  ],
  providers: [
    AppPreloadingStrategy
  ],
})
export class AppRoutingModule { }
