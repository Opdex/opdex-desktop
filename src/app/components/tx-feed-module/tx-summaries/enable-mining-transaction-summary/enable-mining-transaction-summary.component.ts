import { LiquidityPoolFactoryService } from '@services/factory/liquidity-pool-factory.service';
import { take } from 'rxjs/operators';
import { IRewardMiningPoolEvent } from '@models/platform-api/responses/transactions/transaction-events/governances/reward-mining-pool-event.interface';
import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { combineLatest, Subscription } from 'rxjs';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { Token } from '@models/platform/token';
import { LiquidityPool } from '@models/platform/liquidity-pool';

@Component({
  selector: 'opdex-enable-mining-transaction-summary',
  templateUrl: './enable-mining-transaction-summary.component.html',
  styleUrls: ['./enable-mining-transaction-summary.component.scss']
})
export class EnableMiningTransactionSummaryComponent implements OnChanges, OnDestroy {
  @Input() transaction: TransactionReceipt;

  poolAmount: FixedDecimal;
  pools: LiquidityPool[];
  stakingToken: Token;
  subscription = new Subscription();
  error: string;
  eventTypes = [
    TransactionLogTypes.RewardMiningPoolLog,
  ]

  constructor(private _liquidityPoolService: LiquidityPoolFactoryService) { }

  ngOnChanges(): void {
    const rewardEvents = this.transaction.events.filter(event => this.eventTypes.includes(event.eventType)) as IRewardMiningPoolEvent[];

    if (rewardEvents.length > 4 || rewardEvents.length === 0) {
      this.error = 'Unable to read enable mining transaction.';
      return;
    }

    this.subscription.unsubscribe();
    this.subscription = new Subscription();

    this.subscription.add(
      combineLatest(rewardEvents.map(event => this._liquidityPoolService.buildLiquidityPool(event.stakingPool)))
        .pipe(take(1))
        .subscribe((pools: LiquidityPool[]) => {
          this.pools = pools;
          this.poolAmount = new FixedDecimal(rewardEvents[0].amount, pools[0].stakingToken?.decimals);
          this.stakingToken = pools[0].stakingToken;
        }));
  }

  poolsTrackBy(index: number, pool: LiquidityPool): string {
    return `${index}-${pool?.trackBy}`;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
