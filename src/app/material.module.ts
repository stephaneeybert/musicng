import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  MatProgressSpinnerModule,
  MatToolbarModule, MatButtonModule, MatSidenavModule, MatIconModule,
  MatListModule, MatGridListModule, MatCardModule, MatMenuModule,
  MatTableModule,
  MatPaginatorModule, MatPaginatorIntl,
  MatSortModule,
  MatCheckboxModule, MatDialogModule,
  MatFormFieldModule, MatInputModule,
  MatSlideToggleModule,
  MatSnackBarModule
} from '@angular/material';
import { LocalizedPaginator } from './core/service/localized-paginator';
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
    MatSlideToggleModule,
    MatSnackBarModule
  ],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: LocalizedPaginator
    }
  ]
})
export class MaterialModule { }
