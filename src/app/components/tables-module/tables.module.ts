import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PoolsTableComponent } from './pools-table/pools-table.component';
import { TokensTableComponent } from './tokens-table/tokens-table.component';
import { SkeletonTableComponent } from './skeleton-table/skeleton-table.component';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedPipesModule } from '@pipes/shared-pipes.module';
import { SharedModule } from '@components/shared-module/shared.module';

@NgModule({
  declarations: [
    PoolsTableComponent,
    SkeletonTableComponent,
    TokensTableComponent
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatMenuModule,
    SharedModule,
    SharedPipesModule,
    RouterModule
  ],
  exports: [
    PoolsTableComponent,
    TokensTableComponent
  ]
})
export class TablesModule { }
