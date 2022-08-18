import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Component, Input, OnChanges } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { Token } from '@models/platform/token';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { IRewardMiningPoolLog } from '@interfaces/contract-logs.interface';

@Component({
  selector: 'opdex-enable-mining-transaction-summary',
  templateUrl: './enable-mining-transaction-summary.component.html',
  styleUrls: ['./enable-mining-transaction-summary.component.scss']
})
export class EnableMiningTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  poolAmount: FixedDecimal;
  pools: LiquidityPool[];
  stakingToken: Token;
  error: string;
  eventTypes = [
    TransactionLogTypes.RewardMiningPoolLog,
  ]

  constructor(private _liquidityPoolService: LiquidityPoolService) { }

  async ngOnChanges(): Promise<void> {
    const rewardEvents = this.transaction.events.filter(event => this.eventTypes.includes(event.log.event as TransactionLogTypes));

    if (rewardEvents.length > 4 || rewardEvents.length === 0) {
      this.error = 'Unable to read enable mining transaction.';
      return;
    }

    let logs: IRewardMiningPoolLog[] = [];
    const pools = await Promise.all(rewardEvents.map(event => {
      const log = <IRewardMiningPoolLog>event.log.data;
      logs.push(log);
      return this._liquidityPoolService.buildLiquidityPool(log.stakingPool);
    }))

    this.pools = pools;
    this.poolAmount = FixedDecimal.FromBigInt(logs[0].amount, pools[0].stakingToken?.decimals);
    this.stakingToken = pools[0].stakingToken;
  }

  poolsTrackBy(index: number, pool: LiquidityPool): string {
    return `${index}-${pool?.trackBy}`;
  }
}
