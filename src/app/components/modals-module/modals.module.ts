import { ControlsModule } from '@components/controls-module/controls.module';
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
import { CreatePoolModalComponent } from './create-pool-modal/create-pool-modal.component';

@NgModule({
  declarations: [
    BugReportModalComponent,
    HelpModalComponent,
    CreatePoolModalComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    SharedPipesModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    SharedModule,
    ControlsModule
  ],
  exports: [
    BugReportModalComponent,
    HelpModalComponent
  ]
})
export class ModalsModule { }
