import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppPreloadingStrategy } from './app-preloading-strategy';
import { AuthGuardService } from './core/auth/auth-guard.service';
import { SecuredLayoutComponent } from './layouts/secured/secured.layout.component';
import { UnsecuredLayoutComponent } from './layouts/unsecured/unsecured.layout.component';
import { LoginComponent } from './core/login/login.component';
import { ErrorComponent } from './core/error/error.component';
import { UsersComponent } from './views/user/users.component';
import { UserComponent } from './views/user/user.component';
import { DashboardComponent } from '@app/views/dashboard/dashboard.component';

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
        path: 'music', // TODO try having another custom module for the midi-lib
        loadChildren: () => import('./views/home/home.module').then(module => module.HomeModule),
        data: {
          preload: true,
          delay: false
        }
      },
      {
        path: 'home',
        loadChildren: () => import('./views/home/home.module').then(module => module.HomeModule),
        data: {
          preload: true,
          delay: false
        }
      },
      {
        path: '',
        redirectTo: 'music',
        pathMatch: 'full'
      },
    ]
  },
  {
    path: '',
    component: SecuredLayoutComponent,
    canActivateChild: [AuthGuardService],
    children: [
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'users/:id',
        component: UserComponent,
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: {
          expectedRole: 'user' // 'admin' TODO put this back
        }
      },
      {
        path: 'error',
        component: ErrorComponent
      },
    ]
  },
];

@NgModule({
  providers: [AppPreloadingStrategy],
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: AppPreloadingStrategy })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
