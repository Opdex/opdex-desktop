import { TransactionModule } from '@components/tx-module/tx.module';
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
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { BugReportModalComponent } from './bug-report-modal/bug-report-modal.component';
import { HelpModalComponent } from './help-modal/help-modal.component';
import { CreateProposalModalComponent } from './create-proposal-modal/create-proposal-modal.component';
import { CreatePoolModalComponent } from './create-pool-modal/create-pool-modal.component';
import { ConfirmResyncModalComponent } from './confirm-resync-modal/confirm-resync-modal.component';
import { TermsModalComponent } from './terms-modal/terms-modal.component';

@NgModule({
  declarations: [
    BugReportModalComponent,
    HelpModalComponent,
    CreatePoolModalComponent,
    CreateProposalModalComponent,
    ConfirmResyncModalComponent,
    TermsModalComponent
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
    ControlsModule,
    TransactionModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule
  ],
  exports: [
    BugReportModalComponent,
    HelpModalComponent
  ]
})
export class ModalsModule { }
