import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppPreloadingStrategy } from './app-preloading-strategy';
import { AuthGuardService } from './core/auth/auth-guard.service';
import { LoginComponent } from './core/login/login.component';
import { ErrorComponent } from './core/error/error.component';
import { UsersComponent } from './modules/user/users.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { UserComponent } from './modules/user/user.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'detail/:id',
    component: UserComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuardService],
    data: {
      expectedRole: 'admin'
    }
  },
  {
    path: 'home',
    loadChildren: './modules/home/home.module#HomeModule',
    data: {
      preload: true,
      delay: false
    }
  },
  {
    path: 'error',
    component: ErrorComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
  // {
  //   path: 'conversations/:folder',
  //   children: [ // TODO See how to use children
  //     {
  //       path: '',
  //       component: ConversationsCmp
  //     },
  //     {
  //       path: ':id',
  //       component: ConversationCmp,
  //       children: […]
  //     }
  //   ]
  // },
];

@NgModule({
  providers: [ AppPreloadingStrategy ],
  imports: [ RouterModule.forRoot(routes, { preloadingStrategy: AppPreloadingStrategy }) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
