import { IndexerService } from '@services/platform/indexer.service';
import { ReviewQuoteComponent } from '@components/tx-module/shared/review-quote/review-quote.component';
import { UserContext } from '@models/user-context';
import { UserContextService } from '@services/utility/user-context.service';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { MiningGovernance } from '@models/platform/mining-governance';
import { Subscription, switchMap, tap } from 'rxjs';
import { MiningGovernanceService } from '@services/platform/mining-governance.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Icons } from '@enums/icons';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'opdex-mining',
  templateUrl: './mining.component.html',
  styleUrls: ['./mining.component.scss']
})
export class MiningComponent implements OnInit, OnDestroy {
  context: UserContext;
  miningGovernance: MiningGovernance;
  nominatedPools: LiquidityPool[];
  miningPools: LiquidityPool[];
  subscription = new Subscription();
  icons = Icons;

  constructor(
    private _miningGovernanceService: MiningGovernanceService,
    private _indexerService: IndexerService,
    private _liquidityPoolService: LiquidityPoolService,
    private _userContextService: UserContextService,
    private _bottomSheet: MatBottomSheet,
  ) { }

  ngOnInit(): void {
    this.subscription.add(
      this._userContextService.context$
        .subscribe(context => this.context = context));

    this.subscription.add(
      this._indexerService.latestBlock$
        .pipe(
          switchMap(latestBlock => this._miningGovernanceService.getMiningGovernance(latestBlock)),
          tap(gov => this.miningGovernance = gov),
          switchMap(_ => this._liquidityPoolService.getNominatedLiquidityPools()),
          tap(pools => this.nominatedPools = pools),
          switchMap(_ => this._liquidityPoolService.getActiveMiningPools()),
          tap(pools => this.miningPools = pools))
        .subscribe());
  }

  async quoteDistribution(): Promise<void> {
    if (!this.context?.wallet) return;

    const quote = await this._miningGovernanceService.rewardMiningPoolsQuote();

    this._bottomSheet.open(ReviewQuoteComponent, { data: quote });
  }

  poolsTrackBy(index: number, pool: LiquidityPool): string {
    return `${index}-${pool?.trackBy}`;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
