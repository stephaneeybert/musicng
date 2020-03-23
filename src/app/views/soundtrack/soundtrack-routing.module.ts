import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SoundtrackComponent } from './soundtrack.component';

const routes: Routes = [
  {
    path: '',
    component: SoundtrackComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class SoundtrackRoutingModule { }