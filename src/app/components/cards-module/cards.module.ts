import { MarketTokenCardComponent } from './market-token-card/market-token-card.component';
import { StakingPoolCardComponent } from './staking-pool-card/staking-pool-card.component';
import { SharedModule } from '@components/shared-module/shared.module';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Module Components
import { CardComponent } from './card/card.component';
import { LiquidityPoolSummaryCardComponent } from './liquidity-pool-summary-card/liquidity-pool-summary-card.component';
import { LiquidityPoolTokenCardComponent } from './liquidity-pool-token-card/liquidity-pool-token-card.component';
import { MiningPoolCardComponent } from './mining-pool-card/mining-pool-card.component';

@NgModule({
  declarations: [
    CardComponent,
    LiquidityPoolSummaryCardComponent,
    LiquidityPoolTokenCardComponent,
    StakingPoolCardComponent,
    MiningPoolCardComponent,
    MarketTokenCardComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressBarModule,
    MatDividerModule,
    SharedModule
  ],
  exports: [
    CardComponent,
    LiquidityPoolSummaryCardComponent,
    LiquidityPoolTokenCardComponent,
    StakingPoolCardComponent,
    MarketTokenCardComponent,
    MiningPoolCardComponent
  ]
})
export class CardsModule { }
