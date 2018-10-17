import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppPreloadingStrategy } from './app-preloading-strategy';
import { AuthGuardService } from './core/auth/auth-guard.service';
import { SecuredLayoutComponent } from './layouts/secured.layout';
import { UnsecuredLayoutComponent } from './layouts/unsecured.layout';
import { LoginComponent } from './core/login/login.component';
import { ErrorComponent } from './core/error/error.component';
import { UsersComponent } from './views/user/users.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { UserComponent } from './views/user/user.component';

const routes: Routes = [
  {
    path: '',
    component: UnsecuredLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        component: LoginComponent
      }
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
        path: 'detail/:id',
        component: UserComponent,
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: {
          expectedRole: 'admin'
        }
      },
      {
        path: 'home',
        loadChildren: './views/home/home.module#HomeModule',
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
];

@NgModule({
  providers: [AppPreloadingStrategy],
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: AppPreloadingStrategy })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
