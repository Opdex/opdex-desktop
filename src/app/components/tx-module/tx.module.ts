import { ClipboardModule } from "@angular/cdk/clipboard";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialogModule } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterModule } from "@angular/router";
import { CardsModule } from "@components/cards-module/cards.module";
import { ControlsModule } from "@components/controls-module/controls.module";
import { SharedModule } from "@components/shared-module/shared.module";
import { TxFeedModule } from "@components/tx-feed-module/tx-feed.module";
import { SharedPipesModule } from "@pipes/shared-pipes.module";

import { TxQuoteErrorComponent } from "./shared/tx-quote-error/tx-quote-error.component";
import { TxQuoteErrorsComponent } from "./shared/tx-quote-errors/tx-quote-errors.component";

@NgModule({
  declarations: [
    // TxSwapComponent,
    // TxProvideComponent,
    // TxMineComponent,
    // TxStakeComponent,
    // TxMineStartComponent,
    // TxMineStopComponent,
    // TxMineCollectComponent,
    // TxStakeCollectComponent,
    // TxStakeStartComponent,
    // TxStakeStopComponent,
    // TxProvideAddComponent,
    // TxProvideRemoveComponent,
    // TxAllowanceComponent,
    // LiquidityPoolSelectorComponent,
    // AllowanceValidationComponent,
    // ReviewQuoteComponent,
    // TxCreatePoolComponent,
    // TxSidebarComponent,
    // WalletPreviewComponent,
    // TxButtonsComponent,
    // PercentageAmountButtonsComponent,
    // TxVaultProposalComponent,
    // TxVaultProposalCreateComponent,
    // TxVaultProposalVoteComponent,
    // TxVaultProposalPledgeComponent,
    TxQuoteErrorsComponent,
    TxQuoteErrorComponent,
    // VaultProposalSelectorComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatListModule,
    MatDialogModule,
    MatSelectModule,
    MatDividerModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatBottomSheetModule,
    MatProgressBarModule,
    SharedPipesModule,
    ClipboardModule,
    SharedModule,
    ControlsModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    TxFeedModule,
    MatSlideToggleModule
  ],
  exports: [
    // TxSwapComponent,
    // TxProvideComponent,
    // TxMineComponent,
    // TxStakeComponent,
    // TxAllowanceComponent,
    // TxCreatePoolComponent,
    // TxSidebarComponent,
    // TxButtonsComponent
  ]
})
export class TransactionModule { }
