import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// See more on preloading https://alligator.io/angular/preloading/
import { PreloadAllModules } from '@angular/router';

import { AuthGuardService } from './core/auth/auth-guard.service';
import { LoginComponent } from './core/login/login.component';
import { ErrorComponent } from './core/error/error.component';
import { HeroesComponent } from './modules/heroes/heroes.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { HeroDetailComponent } from './modules/hero-detail/hero-detail.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'detail/:id', component: HeroDetailComponent, canActivate: [AuthGuardService] },
  { path: 'heroes', component: HeroesComponent, canActivate: [AuthGuardService] },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuardService],
    data: {
      expectedRole: 'admin'
    }
  },
  { path: 'error', component: ErrorComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
