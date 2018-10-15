import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppPreloadingStrategy } from './app-preloading-strategy';
import { AuthGuardService } from './core/auth/auth-guard.service';
import { LoginLayoutComponent } from './layouts/login.layout';
import { HomeLayoutComponent } from './layouts/home.layout';
import { LoginComponent } from './core/login/login.component';
import { ErrorComponent } from './core/error/error.component';
import { UsersComponent } from './views/user/users.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { UserComponent } from './views/user/user.component';

const routes: Routes = [
  {
    path: '',
    component: LoginLayoutComponent,
    children: [{
      path: 'login',
      component: LoginComponent
    }]
  },
  {
    path: '',
    component: HomeLayoutComponent,
    canActivate: [AuthGuardService],
    children: [
      {
        path: '',
        redirectTo: '/users',
        pathMatch: 'full'
      },
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
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  providers: [AppPreloadingStrategy],
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: AppPreloadingStrategy })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
