import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  MatProgressSpinnerModule,
  MatToolbarModule, MatButtonModule, MatSidenavModule, MatIconModule,
  MatListModule, MatGridListModule, MatCardModule, MatMenuModule,
  MatTableModule, MatPaginatorModule, MatSortModule,
  MatCheckboxModule, MatDialogModule,
  MatFormFieldModule, MatInputModule
} from '@angular/material';

@NgModule({
  exports: [
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ]
})
export class MaterialModule { }
