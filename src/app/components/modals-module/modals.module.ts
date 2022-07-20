import { SharedModule } from '@components/shared-module/shared.module';
import { SharedPipesModule } from '@pipes/shared-pipes.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

// Material Imports
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

import { BugReportModalComponent } from './bug-report-modal/bug-report-modal.component';
import { HelpModalComponent } from './help-modal/help-modal.component';

@NgModule({
  declarations: [
    BugReportModalComponent,
    HelpModalComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    SharedPipesModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    SharedModule
  ],
  exports: [
    BugReportModalComponent,
    HelpModalComponent
  ]
})
export class ModalsModule { }
