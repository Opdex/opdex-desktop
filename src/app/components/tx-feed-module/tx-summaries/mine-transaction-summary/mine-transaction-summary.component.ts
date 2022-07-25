import { IStartMiningLog, IStopMiningLog, ICollectMiningRewardsLog } from '@interfaces/contract-logs.interface';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Component, Input, OnChanges } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { LiquidityPool } from '@models/platform/liquidity-pool';

@Component({
  selector: 'opdex-mine-transaction-summary',
  templateUrl: './mine-transaction-summary.component.html',
  styleUrls: ['./mine-transaction-summary.component.scss']
})
export class MineTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  isAddition: boolean;
  lptAmount: FixedDecimal;
  collectAmount: FixedDecimal;
  pool: LiquidityPool;
  error: string;
  eventTypes = [
    TransactionLogTypes.StartMiningLog,
    TransactionLogTypes.StopMiningLog,
    TransactionLogTypes.CollectMiningRewardsLog
  ]

  constructor(
    private _liquidityPoolService: LiquidityPoolService
  ) { }

  async ngOnChanges(): Promise<void> {
    const mineEvents = this.transaction.events.filter(event => this.eventTypes.includes(event.log.event as TransactionLogTypes));

    var collectEvent = mineEvents.find(event => event.log.event === TransactionLogTypes.CollectMiningRewardsLog);
    var startEvent = mineEvents.find(event => event.log.event === TransactionLogTypes.StartMiningLog);
    var stopEvent = mineEvents.find(event => event.log.event === TransactionLogTypes.StopMiningLog);

    if (mineEvents.length > 2 || mineEvents.length === 0 || (!collectEvent && !startEvent && !stopEvent)) {
      this.error = 'Unable to read mine transaction.';
      return;
    }

    this.pool = await this._liquidityPoolService.buildLiquidityPoolByMiningPoolAddress(startEvent?.address || stopEvent?.address || collectEvent?.address)

    const collectAmount = collectEvent === undefined ? BigInt('0') : (<ICollectMiningRewardsLog>collectEvent.log.data).amount;
    this.collectAmount = FixedDecimal.FromBigInt(collectAmount, this.pool.stakingToken?.decimals);

    let lptAmount = FixedDecimal.Zero(this.pool.lpToken.decimals);

    if (startEvent !== undefined) {
      this.isAddition = true;
      lptAmount = FixedDecimal.FromBigInt((<IStartMiningLog>startEvent.log.data).amount, this.pool.lpToken.decimals);
    }
    else if (stopEvent !== undefined) {
      this.isAddition = false;
      lptAmount = FixedDecimal.FromBigInt((<IStopMiningLog>stopEvent.log.data).amount, this.pool.lpToken.decimals);
    }

    this.lptAmount = lptAmount;
  }
}
