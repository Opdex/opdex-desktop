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
import { TxButtonsComponent } from "./shared/tx-buttons/tx-buttons.component";
import { PercentageAmountButtonsComponent } from "./shared/percentage-amount-buttons/percentage-amount-buttons.component";
import { AllowanceValidationComponent } from "./shared/allowance-validation/allowance-validation.component";
import { ReviewQuoteComponent } from "./shared/review-quote/review-quote.component";
import { TxSwapComponent } from "./tx-swap/tx-swap.component";
import { LiquidityPoolSelectorComponent } from "./shared/liquidity-pool-selector/liquidity-pool-selector.component";
import { TxStakeComponent } from "./tx-stake/tx-stake.component";
import { TxStakeStartComponent } from "./tx-stake/tx-stake-start/tx-stake-start.component";
import { TxStakeCollectComponent } from "./tx-stake/tx-stake-collect/tx-stake-collect.component";
import { TxStakeStopComponent } from "./tx-stake/tx-stake-stop/tx-stake-stop.component";
import { TxMineComponent } from "./tx-mine/tx-mine.component";
import { TxMineStopComponent } from "./tx-mine/tx-mine-stop/tx-mine-stop.component";
import { TxMineStartComponent } from "./tx-mine/tx-mine-start/tx-mine-start.component";
import { TxMineCollectComponent } from "./tx-mine/tx-mine-collect/tx-mine-collect.component";
import { TxProvideComponent } from "./tx-provide/tx-provide.component";
import { TxProvideRemoveComponent } from "./tx-provide/tx-provide-remove/tx-provide-remove.component";
import { TxProvideAddComponent } from "./tx-provide/tx-provide-add/tx-provide-add.component";
import { TxTradeComponent } from './tx-trade/tx-trade.component';

@NgModule({
  declarations: [
    TxSwapComponent,
    TxProvideComponent,
    TxMineComponent,
    TxStakeComponent,
    TxMineStartComponent,
    TxMineStopComponent,
    TxMineCollectComponent,
    TxStakeCollectComponent,
    TxStakeStartComponent,
    TxStakeStopComponent,
    TxProvideAddComponent,
    TxProvideRemoveComponent,
    // TxAllowanceComponent,
    LiquidityPoolSelectorComponent,
    AllowanceValidationComponent,
    ReviewQuoteComponent,
    // TxCreatePoolComponent,
    // TxSidebarComponent,
    // WalletPreviewComponent,
    TxButtonsComponent,
    PercentageAmountButtonsComponent,
    // TxVaultProposalComponent,
    // TxVaultProposalCreateComponent,
    // TxVaultProposalVoteComponent,
    // TxVaultProposalPledgeComponent,
    TxQuoteErrorsComponent,
    TxQuoteErrorComponent,
    TxTradeComponent,
    // VaultProposalSelectorComponent,
    TxTradeComponent
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
    TxSwapComponent,
    TxProvideComponent,
    TxMineComponent,
    TxStakeComponent,
    // TxAllowanceComponent,
    // TxCreatePoolComponent,
    // TxSidebarComponent,
    TxButtonsComponent,
    TxTradeComponent
  ]
})
export class TransactionModule { }
