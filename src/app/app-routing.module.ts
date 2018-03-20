import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AuthGuardService} from './auth-guard.service';
import {RoleGuardService} from './role-guard.service';
import {HeroesComponent} from './heroes/heroes.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {HeroDetailComponent} from './hero-detail/hero-detail.component';
import {LoginComponent} from './login/login.component';

const routes: Routes = [
  {path: '', redirectTo: '/dashboard', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {path: 'detail/:id', component: HeroDetailComponent, canActivate: [AuthGuardService]},
  {path: 'heroes', component: HeroesComponent, canActivate: [AuthGuardService]},
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuardService],
    data: {
      expectedRole: 'admin'
    }
  },
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
